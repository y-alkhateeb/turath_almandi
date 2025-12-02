/**
 * Create Expense Transaction Page
 * Form for creating expense transactions with button-based category selection
 *
 * Features:
 * - Multi-item inventory support for INVENTORY category
 * - Partial payment with supplier selection
 * - Branch selection (Admin: dropdown, Accountant: read-only)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatCurrency, toInputDate, formatDate } from '@/utils/format';
import { ArrowRight, Loader2, Save, Trash2, Package, Building2 } from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Textarea,
  DatePicker,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import transactionService from '@/api/services/transactionService';
import employeeService from '@/api/services/employeeService';
import inventoryService from '@/api/services/inventoryService';
import branchService from '@/api/services/branchService';
import contactService from '@/api/services/contactService';
import { TransactionType, EmployeeStatus, PaymentMethod, InventoryOperationType, ContactType, UserRole } from '@/types/enum';
import {
  EXPENSE_CATEGORIES,
  CATEGORY_LABELS_AR,
  type TransactionCategory,
} from '@/constants/transaction-categories';
import { useUserInfo } from '@/store/userStore';
import { PaymentMethodButtons, getPaymentMethodLabel } from '@/components/shared/PaymentMethodSelect';
import {
  type InventoryItemEntry,
  calculateItemTotal,
  createEmptyInventoryItem,
} from './utils/transaction-helpers';

// ============================================
// TYPES
// ============================================

interface FormData {
  category: string;
  amount: string;
  date: Date;
  employeeVendorName: string;
  notes: string;
  employeeId: string;
  branchId: string;
  paymentMethod: PaymentMethod;
  // Partial payment fields
  isPartialPayment: boolean;
  paidAmount: string;
  supplierId: string;
}

interface FormErrors {
  category?: string;
  amount?: string;
  date?: string;
  employeeId?: string;
  branchId?: string;
  paidAmount?: string;
  supplierId?: string;
  inventoryItems?: string;
}

// ============================================
// CATEGORY ICONS
// ============================================

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  EMPLOYEE_SALARIES: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  WORKER_DAILY: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  SUPPLIES: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  MAINTENANCE: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  INVENTORY: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  DEBT: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  CASHIER_SHORTAGE: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  RETURNS: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  ),
  OTHER_EXPENSE: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
    </svg>
  ),
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function CreateExpensePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // User info for role-based UI
  const user = useUserInfo();
  const isAdmin = user?.role === UserRole.ADMIN;
  const userBranch = user?.branch;

  // Form state
  const [formData, setFormData] = useState<FormData>({
    category: '',
    amount: '',
    date: new Date(),
    employeeVendorName: '',
    notes: '',
    employeeId: '',
    branchId: userBranch?.id || '',
    paymentMethod: PaymentMethod.CASH,
    isPartialPayment: false,
    paidAmount: '',
    supplierId: '',
  });

  // Inventory items state (for INVENTORY category)
  const [inventoryItems, setInventoryItems] = useState<InventoryItemEntry[]>([
    createEmptyInventoryItem(),
  ]);

  const [errors, setErrors] = useState<FormErrors>({});

  // Check if current category is inventory purchase
  const isInventoryCategory = formData.category === 'INVENTORY';

  // Fetch employees for salary category
  const { data: employeesData } = useQuery({
    queryKey: ['employees', { status: EmployeeStatus.ACTIVE }],
    queryFn: () => employeeService.getAll({ status: EmployeeStatus.ACTIVE, limit: 100 }),
    enabled: formData.category === 'EMPLOYEE_SALARIES',
  });

  const employees = employeesData?.data || [];

  // Fetch branches for admin
  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchService.getAllActive(),
    enabled: isAdmin,
  });

  // Fetch inventory items for INVENTORY category
  const { data: inventoryData } = useQuery({
    queryKey: ['inventory', { branchId: formData.branchId }],
    queryFn: () => inventoryService.getAll({ branchId: formData.branchId || undefined, limit: '100' }),
    enabled: isInventoryCategory && !!formData.branchId,
  });

  const inventoryList = inventoryData?.data || [];

  // Fetch suppliers for partial payment (SUPPLIER or BOTH types can be suppliers)
  const { data: suppliersData } = useQuery({
    queryKey: ['contacts', 'suppliers'],
    queryFn: () => contactService.getAll({ type: ContactType.SUPPLIER, limit: 100 }),
    enabled: isInventoryCategory,
  });

  const suppliers = suppliersData?.data || [];

  // Create mutation for regular transactions
  const createMutation = useMutation({
    mutationFn: transactionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/transactions');
    },
  });



  // Calculate total from inventory items
  const inventoryTotal = inventoryItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);

  // Calculate remaining amount for partial payment
  const totalPaidAmount = parseFloat(formData.paidAmount) || 0;
  const remainingAmount = inventoryTotal - totalPaidAmount;

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.category) {
      newErrors.category = 'يرجى اختيار الفئة';
    }

    // Branch is required for admin
    if (isAdmin && !formData.branchId) {
      newErrors.branchId = 'يرجى اختيار الفرع';
    }

    // For non-inventory categories, amount is required
    if (!isInventoryCategory) {
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        newErrors.amount = 'يرجى إدخال مبلغ صحيح';
      }
    } else {
      // For inventory category, validate inventory items
      const validItems = inventoryItems.filter(
        (item) => item.inventoryItemId && parseFloat(item.quantity) > 0 && parseFloat(item.unitPrice) > 0
      );
      if (validItems.length === 0) {
        newErrors.inventoryItems = 'يرجى إضافة صنف واحد على الأقل';
      }

      // Partial payment validation
      if (formData.isPartialPayment) {
        if (!formData.supplierId) {
          newErrors.supplierId = 'يرجى اختيار المورد';
        }
        if (!formData.paidAmount || parseFloat(formData.paidAmount) <= 0) {
          newErrors.paidAmount = 'يرجى إدخال المبلغ المدفوع';
        }
        if (parseFloat(formData.paidAmount) >= inventoryTotal) {
          newErrors.paidAmount = 'المبلغ المدفوع يجب أن يكون أقل من الإجمالي';
        }
      }
    }

    if (!formData.date) {
      newErrors.date = 'يرجى اختيار التاريخ';
    }

    // Employee is required for salary category
    if (formData.category === 'EMPLOYEE_SALARIES' && !formData.employeeId) {
      newErrors.employeeId = 'يرجى اختيار الموظف';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Unified payload construction
    const payload: any = {
      type: TransactionType.EXPENSE,
      category: formData.category,
      date: toInputDate(formData.date),
      paymentMethod: formData.paymentMethod,
      branchId: formData.branchId || undefined,
      notes: formData.notes || undefined,
      employeeVendorName: formData.employeeVendorName || undefined,
    };

    // For inventory category
    if (isInventoryCategory) {
      const validItems = inventoryItems.filter(
        (item) => item.inventoryItemId && parseFloat(item.quantity) > 0 && parseFloat(item.unitPrice) > 0
      );

      payload.items = validItems.map((item) => ({
        inventoryItemId: item.inventoryItemId,
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        operationType: InventoryOperationType.PURCHASE,
      }));

      // Partial payment fields
      if (formData.isPartialPayment) {
        payload.paidAmount = parseFloat(formData.paidAmount);
        payload.contactId = formData.supplierId;
      }
    } else {
      // Regular transaction
      payload.amount = parseFloat(formData.amount);
      if (formData.category === 'EMPLOYEE_SALARIES') {
        payload.employeeId = formData.employeeId;
      }
    }

    createMutation.mutate(payload);
  };

  // Update form field
  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Clear employee when category changes from salary
      if (field === 'category' && value !== 'EMPLOYEE_SALARIES') {
        newData.employeeId = '';
      }

      // Reset inventory items when category changes
      if (field === 'category') {
        setInventoryItems([createEmptyInventoryItem()]);
        newData.isPartialPayment = false;
        newData.paidAmount = '';
        newData.supplierId = '';
      }

      return newData;
    });

    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Inventory item handlers
  const updateInventoryItem = (id: string, field: keyof InventoryItemEntry, value: string) => {
    setInventoryItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        return updated;
      })
    );
    if (errors.inventoryItems) {
      setErrors((prev) => ({ ...prev, inventoryItems: undefined }));
    }
  };

  const addInventoryItem = () => {
    setInventoryItems((prev) => [...prev, createEmptyInventoryItem()]);
  };

  const removeInventoryItem = (id: string) => {
    if (inventoryItems.length > 1) {
      setInventoryItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Check if category requires employee selection
  const requiresEmployee = formData.category === 'EMPLOYEE_SALARIES';

  // Check if mutation is pending
  const isPending = createMutation.isPending;
  const isError = createMutation.isError;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/transactions')}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">إضافة مصروف</h1>
          <p className="text-muted-foreground text-sm">إنشاء معاملة مصروف جديدة</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category Selection */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">الفئة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {EXPENSE_CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => updateField('category', category)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                        'hover:border-primary/50 hover:bg-primary/5',
                        formData.category === category
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card'
                      )}
                    >
                      <div
                        className={cn(
                          'p-2 rounded-full',
                          formData.category === category
                            ? 'bg-primary/20'
                            : 'bg-muted'
                        )}
                      >
                        {CATEGORY_ICONS[category]}
                      </div>
                      <span className="text-sm font-medium text-center">
                        {CATEGORY_LABELS_AR[category as TransactionCategory]}
                      </span>
                    </button>
                  ))}
                </div>
                {errors.category && (
                  <p className="text-destructive text-sm mt-2">{errors.category}</p>
                )}
              </CardContent>
            </Card>

            {/* Employee Selection (for salary category) */}
            {requiresEmployee && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">اختيار الموظف</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={formData.employeeId}
                    onValueChange={(value) => updateField('employeeId', value)}
                  >
                    <SelectTrigger className={cn(errors.employeeId && 'border-destructive')}>
                      <SelectValue placeholder="اختر الموظف" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          <div className="flex items-center gap-2">
                            <span>{employee.name}</span>
                            <span className="text-muted-foreground text-xs">
                              ({employee.position})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.employeeId && (
                    <p className="text-destructive text-sm mt-2">{errors.employeeId}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Inventory Items (for INVENTORY category) */}
            {isInventoryCategory && (
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      أصناف المخزون
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Inventory Items Grid - Button Style */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {inventoryList.map((inv) => {
                      const isSelected = inventoryItems.some((item) => item.inventoryItemId === inv.id);
                      const selectedItem = inventoryItems.find((item) => item.inventoryItemId === inv.id);
                      const quantity = selectedItem ? parseFloat(selectedItem.quantity) || 0 : 0;

                      return (
                        <button
                          key={inv.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              // Remove item
                              const itemToRemove = inventoryItems.find((item) => item.inventoryItemId === inv.id);
                              if (itemToRemove && inventoryItems.length > 1) {
                                removeInventoryItem(itemToRemove.id);
                              } else if (itemToRemove) {
                                // Reset the item instead of removing if it's the last one
                                updateInventoryItem(itemToRemove.id, 'inventoryItemId', '');
                                updateInventoryItem(itemToRemove.id, 'quantity', '');
                                updateInventoryItem(itemToRemove.id, 'unitPrice', '');
                              }
                            } else {
                              // Add new item or update empty slot
                              const emptyItem = inventoryItems.find((item) => !item.inventoryItemId);
                              if (emptyItem) {
                                updateInventoryItem(emptyItem.id, 'inventoryItemId', inv.id);
                              } else {
                                addInventoryItem();
                                // Need to update the newly added item
                                setTimeout(() => {
                                  setInventoryItems((prev) =>
                                    prev.map((item, idx) =>
                                      idx === prev.length - 1
                                        ? { ...item, inventoryItemId: inv.id }
                                        : item
                                    )
                                  );
                                }, 0);
                              }
                            }
                          }}
                          className={cn(
                            'relative flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-center',
                            'hover:border-primary/50 hover:bg-primary/5',
                            isSelected
                              ? 'border-primary bg-primary/10'
                              : 'border-border bg-card'
                          )}
                        >
                          {/* Quantity Badge */}
                          {isSelected && quantity > 0 && (
                            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                              {quantity}
                            </span>
                          )}
                          <span className="text-sm font-medium line-clamp-2">{inv.name}</span>
                          <span className="text-xs text-muted-foreground">{inv.unit}</span>
                          <span className="text-xs text-muted-foreground">
                            الكمية: {inv.quantity}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Items Details */}
                  {inventoryItems.filter((item) => item.inventoryItemId).length > 0 && (
                    <div className="border-t pt-4 space-y-3">
                      <Label className="text-sm font-medium">الأصناف المختارة</Label>
                      {inventoryItems
                        .filter((item) => item.inventoryItemId)
                        .map((item) => {
                          const inventoryItem = inventoryList.find((i) => i.id === item.inventoryItemId);
                          const itemTotal = calculateItemTotal(item);

                          return (
                            <div
                              key={item.id}
                              className="p-3 rounded-lg border border-border bg-muted/30 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{inventoryItem?.name}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => {
                                    if (inventoryItems.length > 1) {
                                      removeInventoryItem(item.id);
                                    } else {
                                      updateInventoryItem(item.id, 'inventoryItemId', '');
                                      updateInventoryItem(item.id, 'quantity', '');
                                      updateInventoryItem(item.id, 'unitPrice', '');
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {/* Quantity */}
                                <div className="space-y-1">
                                  <Label className="text-xs">الكمية</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0"
                                    value={item.quantity}
                                    onChange={(e) => updateInventoryItem(item.id, 'quantity', e.target.value)}
                                    className="h-8 text-xs"
                                  />
                                </div>

                                {/* Unit Price */}
                                <div className="space-y-1">
                                  <Label className="text-xs">سعر الشراء</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0"
                                    value={item.unitPrice}
                                    onChange={(e) => updateInventoryItem(item.id, 'unitPrice', e.target.value)}
                                    className="h-8 text-xs"
                                  />
                                </div>
                              </div>

                              {/* Item Total */}
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">الإجمالي:</span>
                                <span className="font-semibold">
                                  {formatCurrency(itemTotal)}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      }
                    </div>
                  )}

                  {errors.inventoryItems && (
                    <p className="text-destructive text-sm">{errors.inventoryItems}</p>
                  )}

                  {/* Inventory Total */}
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">إجمالي المشتريات:</span>
                      <span className="text-xl font-bold text-primary">
                        {formatCurrency(inventoryTotal)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Partial Payment Section (for INVENTORY category) */}
            {isInventoryCategory && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">السداد الجزئي</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Enable Partial Payment */}
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="isPartialPayment"
                      checked={formData.isPartialPayment}
                      onCheckedChange={(checked) =>
                        updateField('isPartialPayment', checked as boolean)
                      }
                    />
                    <Label htmlFor="isPartialPayment" className="cursor-pointer">
                      تفعيل السداد الجزئي (ينشئ دين مستحق للمورد)
                    </Label>
                  </div>

                  {formData.isPartialPayment && (
                    <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                      {/* Supplier Selection */}
                      <div className="space-y-2">
                        <Label>المورد *</Label>
                        <Select
                          value={formData.supplierId}
                          onValueChange={(value) => updateField('supplierId', value)}
                        >
                          <SelectTrigger className={cn(errors.supplierId && 'border-destructive')}>
                            <SelectValue placeholder="اختر المورد" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.supplierId && (
                          <p className="text-destructive text-sm">{errors.supplierId}</p>
                        )}
                      </div>

                      {/* Paid Amount */}
                      <div className="space-y-2">
                        <Label>المبلغ المدفوع *</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max={inventoryTotal}
                            placeholder="0.00"
                            value={formData.paidAmount}
                            onChange={(e) => updateField('paidAmount', e.target.value)}
                            className={cn('pl-12', errors.paidAmount && 'border-destructive')}
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            د.ع
                          </span>
                        </div>
                        {errors.paidAmount && (
                          <p className="text-destructive text-sm">{errors.paidAmount}</p>
                        )}
                      </div>

                      {/* Remaining Amount */}
                      <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-orange-600">المبلغ المتبقي (دين):</span>
                          <span className="font-bold text-orange-600">
                            {formatCurrency(remainingAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Amount (for non-inventory categories) */}
            {!isInventoryCategory && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">المبلغ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="amount">المبلغ *</Label>
                    <div className="relative">
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => updateField('amount', e.target.value)}
                        className={cn(
                          'pl-12 text-lg font-semibold',
                          errors.amount && 'border-destructive'
                        )}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        د.ع
                      </span>
                    </div>
                    {errors.amount && (
                      <p className="text-destructive text-sm">{errors.amount}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Details */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">معلومات إضافية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Vendor Name */}
                <div className="space-y-2">
                  <Label htmlFor="employeeVendorName">اسم المورد / الجهة</Label>
                  <Input
                    id="employeeVendorName"
                    placeholder="اختياري"
                    value={formData.employeeVendorName}
                    onChange={(e) => updateField('employeeVendorName', e.target.value)}
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Textarea
                    id="notes"
                    placeholder="أضف ملاحظات إضافية..."
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Branch Selection */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  الفرع
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isAdmin ? (
                  <Select
                    value={formData.branchId}
                    onValueChange={(value) => updateField('branchId', value)}
                  >
                    <SelectTrigger className={cn(errors.branchId && 'border-destructive')}>
                      <SelectValue placeholder="اختر الفرع" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-3 rounded-md bg-muted">
                    <span className="font-medium">{userBranch?.name || 'غير محدد'}</span>
                  </div>
                )}
                {errors.branchId && (
                  <p className="text-destructive text-sm mt-2">{errors.branchId}</p>
                )}
              </CardContent>
            </Card>

            {/* Date Selection */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">التاريخ</CardTitle>
              </CardHeader>
              <CardContent>
                <DatePicker
                  value={formData.date}
                  onChange={(date) => updateField('date', date || new Date())}
                  disableFuture
                  error={!!errors.date}
                />
                {errors.date && (
                  <p className="text-destructive text-sm mt-2">{errors.date}</p>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">طريقة الدفع</CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentMethodButtons
                  value={formData.paymentMethod}
                  onChange={(value) => updateField('paymentMethod', value)}
                />
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">ملخص</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">النوع:</span>
                  <span className="font-medium text-red-600">مصروف</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الفئة:</span>
                  <span className="font-medium">
                    {formData.category
                      ? CATEGORY_LABELS_AR[formData.category as TransactionCategory]
                      : '-'}
                  </span>
                </div>
                {requiresEmployee && formData.employeeId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">الموظف:</span>
                    <span className="font-medium">
                      {employees.find((e) => e.id === formData.employeeId)?.name || '-'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">التاريخ:</span>
                  <span className="font-medium">
                    {formatDate(formData.date)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">طريقة الدفع:</span>
                  <span className="font-medium">
                    {getPaymentMethodLabel(formData.paymentMethod)}
                  </span>
                </div>
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-medium">المبلغ:</span>
                    <span className="text-lg font-bold text-red-600">
                      {isInventoryCategory
                        ? `-${formatCurrency(inventoryTotal)}`
                        : formData.amount
                          ? `-${formatCurrency(parseFloat(formData.amount))}`
                          : '0 د.ع'}
                    </span>
                  </div>
                  {formData.isPartialPayment && (
                    <>
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-muted-foreground">المدفوع:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(totalPaidAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-muted-foreground">المتبقي (دين):</span>
                        <span className="font-medium text-orange-600">
                          {formatCurrency(remainingAmount)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 ml-2" />
                    حفظ المصروف
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => navigate('/transactions')}
                disabled={isPending}
              >
                إلغاء
              </Button>
            </div>

            {/* Error Message */}
            {isError && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-destructive text-sm">
                  حدث خطأ أثناء حفظ المعاملة. يرجى المحاولة مرة أخرى.
                </p>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
