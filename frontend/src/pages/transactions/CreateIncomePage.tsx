/**
 * Create Income Transaction Page
 * Form for creating income transactions with button-based category selection
 * Supports multi-item inventory transactions with discounts
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatCurrency, toInputDate, formatDate } from '@/utils/format';
import {
  ArrowRight,
  Loader2,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  Package,
} from 'lucide-react';

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
import inventoryService from '@/api/services/inventoryService';
import { PaymentMethod, DiscountType, InventoryOperationType, UserRole } from '@/types/enum';
import {
  INCOME_CATEGORIES,
  CATEGORY_LABELS_AR,
  isCashOnlyCategory,
  type TransactionCategory,
} from '@/constants/transaction-categories';
import { TRANSACTION_CATEGORY_ICONS } from '@/constants/transaction-category-icons';
import { PaymentMethodButtons, getPaymentMethodLabel } from '@/components/shared/PaymentMethodSelect';
import { BranchSelect } from '@/components/shared/BranchSelect';
import {
  isMultiItemCategory,
  isDiscountEnabledCategory,
  calculateItemTotal,
  createEmptyInventoryItem,
  type InventoryItemEntry,
} from './utils/transaction-helpers';
import { useUserInfo } from '@/store/userStore';
import { useCustomers } from '@/hooks/api/useContacts';

interface FormData {
  category: string;
  amount: string;
  paymentMethod: PaymentMethod;
  date: Date;

  notes: string;
  branchId: string;
  // Multi-item fields
  items: InventoryItemEntry[];
  // Transaction-level discount
  transactionDiscountType: DiscountType | '';
  transactionDiscountValue: string;
  transactionDiscountReason: string;
  // Receivable fields
  createReceivable: boolean;
  customerId: string;
  receivableDueDate: string;
}

interface FormErrors {
  category?: string;
  amount?: string;
  items?: string;
  date?: string;
  branchId?: string;
  customerId?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function CreateIncomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useUserInfo();

  // Check user role
  const isAdmin = user?.role === UserRole.ADMIN;
  const userBranch = user?.branch;

  // Form state
  const [formData, setFormData] = useState<FormData>({
    category: '',
    amount: '',
    paymentMethod: PaymentMethod.CASH,
    date: new Date(),

    notes: '',
    branchId: userBranch?.id || '',
    items: [],
    transactionDiscountType: '',
    transactionDiscountValue: '',
    transactionDiscountReason: '',
    createReceivable: false,
    customerId: '',
    receivableDueDate: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Check if current category supports multi-item
  const supportsMultiItem = isMultiItemCategory(formData.category);
  const supportsDiscount = isDiscountEnabledCategory(formData.category);
  const cashOnly = isCashOnlyCategory(formData.category);


  // Fetch inventory items when multi-item category is selected
  // Filter by branch to ensure only items from the selected branch are shown
  const { data: inventoryItems = [], isLoading: loadingInventory } = useQuery({
    queryKey: ['inventory', { branchId: formData.branchId }],
    queryFn: () => inventoryService.getAll({ branchId: formData.branchId }),
    enabled: supportsMultiItem && !!formData.branchId,
  });

  // Fetch customers for receivable creation
  const { data: customersData, isLoading: isLoadingCustomers } = useCustomers({ limit: 100 });

  // Calculate totals for multi-item transactions
  const calculations = useMemo(() => {
    if (!supportsMultiItem || formData.items.length === 0) {
      return { subtotal: 0, discount: 0, total: 0 };
    }

    const subtotal = formData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);

    let discount = 0;
    if (formData.transactionDiscountType && formData.transactionDiscountValue) {
      const discountValue = parseFloat(formData.transactionDiscountValue) || 0;
      if (formData.transactionDiscountType === DiscountType.PERCENTAGE) {
        discount = (subtotal * discountValue) / 100;
      } else {
        discount = discountValue;
      }
    }

    return {
      subtotal,
      discount,
      total: subtotal - discount,
    };
  }, [formData.items, formData.transactionDiscountType, formData.transactionDiscountValue, supportsMultiItem]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: transactionService.createIncome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
      navigate('/transactions');
    },
  });

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.category) {
      newErrors.category = 'يرجى اختيار الفئة';
    }

    if (supportsMultiItem) {
      if (formData.items.length === 0) {
        newErrors.items = 'يرجى إضافة صنف واحد على الأقل';
      } else {
        const hasInvalidItem = formData.items.some(
          (item) =>
            !item.inventoryItemId ||
            !item.quantity ||
            parseFloat(item.quantity) <= 0 ||
            !item.unitPrice ||
            parseFloat(item.unitPrice) <= 0
        );
        if (hasInvalidItem) {
          newErrors.items = 'يرجى ملء جميع حقول الأصناف بشكل صحيح';
        }

        // Check quantity availability
        for (const item of formData.items) {
          const inventoryItem = inventoryItems.find((i) => i.id === item.inventoryItemId);
          if (inventoryItem && parseFloat(item.quantity) > inventoryItem.quantity) {
            newErrors.items = `الكمية المطلوبة من "${inventoryItem.name}" تتجاوز المتوفر (${inventoryItem.quantity})`;
            break;
          }
        }
      }
    } else {
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        newErrors.amount = 'يرجى إدخال مبلغ صحيح';
      }
    }

    if (!formData.date) {
      newErrors.date = 'يرجى اختيار التاريخ';
    }

    // Branch is required for admin
    if (isAdmin && !formData.branchId) {
      newErrors.branchId = 'يرجى اختيار الفرع';
    }

    // Customer is required if createReceivable is enabled
    if (formData.createReceivable && !formData.customerId) {
      newErrors.customerId = 'يرجى اختيار العميل';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Payment method: force CASH for cash-only categories
    const paymentMethod = cashOnly ? PaymentMethod.CASH : formData.paymentMethod;

    const basePayload = {
      category: formData.category,
      paymentMethod,
      date: toInputDate(formData.date),
      notes: formData.notes || undefined,
      branchId: isAdmin ? formData.branchId : undefined,
      createReceivable: formData.createReceivable || undefined,
      contactId: formData.createReceivable && formData.customerId ? formData.customerId : undefined,
      receivableDueDate: formData.createReceivable && formData.receivableDueDate ? formData.receivableDueDate : undefined,
    };

    if (supportsMultiItem) {
      // Multi-item transaction
      createMutation.mutate({
        ...basePayload,
        items: formData.items.map((item) => ({
          inventoryItemId: item.inventoryItemId,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          operationType: InventoryOperationType.CONSUMPTION,
          discountType: item.discountType || undefined,
          discountValue: item.discountValue ? parseFloat(item.discountValue) : undefined,
          notes: item.notes || undefined,
        })),
        discountType: formData.transactionDiscountType || undefined,
        discountValue: formData.transactionDiscountValue
          ? parseFloat(formData.transactionDiscountValue)
          : undefined,
        discountReason: formData.transactionDiscountReason || undefined,
      });
    } else {
      // Simple transaction
      createMutation.mutate({
        ...basePayload,
        amount: parseFloat(formData.amount),
      });
    }
  };

  // Update form field
  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Reset items when category changes to non-multi-item
      if (field === 'category' && !isMultiItemCategory(value as string)) {
        newData.items = [];
        newData.transactionDiscountType = '';
        newData.transactionDiscountValue = '';
        newData.transactionDiscountReason = '';
      }

      // Add first item when switching to multi-item category
      if (field === 'category' && isMultiItemCategory(value as string) && prev.items.length === 0) {
        newData.items = [createEmptyInventoryItem()];
      }

      // Force CASH payment for cash-only categories
      if (field === 'category' && isCashOnlyCategory(value as string)) {
        newData.paymentMethod = PaymentMethod.CASH;
      }

      return newData;
    });

    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Add inventory item
  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyInventoryItem()],
    }));
  };

  // Remove inventory item
  const removeItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  // Update inventory item
  const updateItem = (id: string, field: keyof InventoryItemEntry, value: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        // Auto-fill price when selecting inventory item
        if (field === 'inventoryItemId') {
          const inventoryItem = inventoryItems.find((i) => i.id === value);
          if (inventoryItem?.sellingPrice) {
            updated.unitPrice = String(inventoryItem.sellingPrice);
          }
        }

        return updated;
      }),
    }));

    if (errors.items) {
      setErrors((prev) => ({ ...prev, items: undefined }));
    }
  };

  // Get display amount
  const displayAmount = supportsMultiItem
    ? calculations.total
    : parseFloat(formData.amount) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/transactions')}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">إضافة إيراد</h1>
          <p className="text-muted-foreground text-sm">إنشاء معاملة إيراد جديدة</p>
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {INCOME_CATEGORIES.map((category) => (
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
                          formData.category === category ? 'bg-primary/20' : 'bg-muted'
                        )}
                      >
                        {TRANSACTION_CATEGORY_ICONS[category]}
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

            {/* Inventory Items Section (for multi-item categories) */}
            {supportsMultiItem && (
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
                  {loadingInventory ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : inventoryItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">لا توجد أصناف في المخزون</p>
                    </div>
                  ) : (
                    <>
                      {/* Inventory Items Grid - Button Style */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {inventoryItems.map((inv) => {
                          const isSelected = formData.items.some((item) => item.inventoryItemId === inv.id);
                          const selectedItem = formData.items.find((item) => item.inventoryItemId === inv.id);
                          const quantity = selectedItem ? parseFloat(selectedItem.quantity) || 0 : 0;

                          return (
                            <button
                              key={inv.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  // Remove item
                                  const itemToRemove = formData.items.find((item) => item.inventoryItemId === inv.id);
                                  if (itemToRemove && formData.items.length > 1) {
                                    removeItem(itemToRemove.id);
                                  } else if (itemToRemove) {
                                    // Reset the item instead of removing if it's the last one
                                    updateItem(itemToRemove.id, 'inventoryItemId', '');
                                    updateItem(itemToRemove.id, 'quantity', '');
                                    updateItem(itemToRemove.id, 'unitPrice', '');
                                  }
                                } else {
                                  // Add new item or update empty slot
                                  const emptyItem = formData.items.find((item) => !item.inventoryItemId);
                                  if (emptyItem) {
                                    updateItem(emptyItem.id, 'inventoryItemId', inv.id);
                                  } else {
                                    addItem();
                                    // Need to update the newly added item
                                    setTimeout(() => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        items: prev.items.map((item, idx) =>
                                          idx === prev.items.length - 1
                                            ? {
                                                ...item,
                                                inventoryItemId: inv.id,
                                                unitPrice: inv.sellingPrice ? String(inv.sellingPrice) : '',
                                              }
                                            : item
                                        ),
                                      }));
                                    }, 0);
                                  }
                                }
                              }}
                              className={cn(
                                'relative flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-center',
                                'hover:border-primary/50 hover:bg-primary/5',
                                isSelected
                                  ? 'border-primary bg-primary/10'
                                  : 'border-border bg-card',
                                inv.quantity <= 0 && 'opacity-50 cursor-not-allowed'
                              )}
                              disabled={inv.quantity <= 0 && !isSelected}
                            >
                              {/* Quantity Badge */}
                              {isSelected && quantity > 0 && (
                                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                  {quantity}
                                </span>
                              )}
                              <span className="text-sm font-medium line-clamp-2">{inv.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatCurrency(inv.sellingPrice)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                متوفر: {inv.quantity}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Selected Items Details */}
                      {formData.items.filter((item) => item.inventoryItemId).length > 0 && (
                        <div className="border-t pt-4 space-y-3">
                          <Label className="text-sm font-medium">الأصناف المختارة</Label>
                          {formData.items
                            .filter((item) => item.inventoryItemId)
                            .map((item) => {
                              const inventoryItem = inventoryItems.find((i) => i.id === item.inventoryItemId);
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
                                        if (formData.items.length > 1) {
                                          removeItem(item.id);
                                        } else {
                                          updateItem(item.id, 'inventoryItemId', '');
                                          updateItem(item.id, 'quantity', '');
                                          updateItem(item.id, 'unitPrice', '');
                                        }
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {/* Quantity */}
                                    <div className="space-y-1">
                                      <Label className="text-xs">الكمية</Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                        className="h-8 text-xs"
                                      />
                                    </div>

                                    {/* Unit Price */}
                                    <div className="space-y-1">
                                      <Label className="text-xs">السعر</Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0"
                                        value={item.unitPrice}
                                        onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                                        className="h-8 text-xs"
                                      />
                                    </div>

                                    {/* Item Discount */}
                                    {supportsDiscount && (
                                      <div className="space-y-1">
                                        <Label className="text-xs">خصم</Label>
                                        <div className="flex gap-1">
                                          <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0"
                                            value={item.discountValue}
                                            onChange={(e) => updateItem(item.id, 'discountValue', e.target.value)}
                                            className="h-8 text-xs flex-1"
                                          />
                                          <Select
                                            value={item.discountType || DiscountType.PERCENTAGE}
                                            onValueChange={(v) => updateItem(item.id, 'discountType', v as DiscountType)}
                                          >
                                            <SelectTrigger className="h-8 w-14 text-xs">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value={DiscountType.PERCENTAGE}>%</SelectItem>
                                              <SelectItem value={DiscountType.AMOUNT}>د.ع</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Item Notes */}
                                  <div className="space-y-1">
                                    <Label className="text-xs">ملاحظة خاصة بالصنف (اختياري)</Label>
                                    <Input
                                      type="text"
                                      placeholder="أضف ملاحظة..."
                                      value={item.notes}
                                      onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                                      className="h-8 text-xs"
                                      maxLength={500}
                                    />
                                  </div>

                                  {/* Item Total */}
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">الإجمالي:</span>
                                    <span className="font-semibold text-secondary">
                                      {formatCurrency(itemTotal)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          }
                        </div>
                      )}

                      {/* Transaction-level Discount */}
                      {supportsDiscount && formData.items.length > 0 && (
                        <div className="p-4 rounded-lg border border-dashed border-border space-y-3">
                          <Label className="text-sm font-medium">خصم على المعاملة (اختياري)</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="قيمة الخصم"
                                value={formData.transactionDiscountValue}
                                onChange={(e) =>
                                  updateField('transactionDiscountValue', e.target.value)
                                }
                                className="flex-1"
                              />
                              <Select
                                value={formData.transactionDiscountType}
                                onValueChange={(v) =>
                                  updateField('transactionDiscountType', v as DiscountType)
                                }
                              >
                                <SelectTrigger className="w-20">
                                  <SelectValue placeholder="%" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={DiscountType.PERCENTAGE}>%</SelectItem>
                                  <SelectItem value={DiscountType.AMOUNT}>مبلغ</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="sm:col-span-2">
                              <Input
                                placeholder="سبب الخصم (اختياري)"
                                value={formData.transactionDiscountReason}
                                onChange={(e) =>
                                  updateField('transactionDiscountReason', e.target.value)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Totals Summary */}
                      <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">الإجمالي الفرعي:</span>
                          <span>{formatCurrency(calculations.subtotal)}</span>
                        </div>
                        {calculations.discount > 0 && (
                          <div className="flex justify-between text-sm text-destructive">
                            <span>الخصم:</span>
                            <span>-{formatCurrency(calculations.discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg border-t border-secondary/20 pt-2">
                          <span>الإجمالي النهائي:</span>
                          <span className="text-secondary">
                            {formatCurrency(calculations.total)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {errors.items && <p className="text-destructive text-sm">{errors.items}</p>}
                </CardContent>
              </Card>
            )}

            {/* Amount & Payment Method (for non-multi-item categories) */}
            {!supportsMultiItem && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">تفاصيل المبلغ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Amount */}
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

            {/* Payment Method */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">طريقة الدفع</CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentMethodButtons
                  value={formData.paymentMethod}
                  onChange={(value) => updateField('paymentMethod', value)}
                  cashOnly={cashOnly}
                />
              </CardContent>
            </Card>

            {/* Receivable */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">ذمة مدينة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="createReceivable"
                    checked={formData.createReceivable}
                    onCheckedChange={(checked) =>
                      updateField('createReceivable', checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="createReceivable"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    إنشاء ذمة مدينة
                  </Label>
                </div>

                {formData.createReceivable && (
                  <div className="space-y-4 pt-2 border-t">
                    {/* Customer Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="customerId">
                        العميل <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.customerId}
                        onValueChange={(value) => updateField('customerId', value)}
                      >
                        <SelectTrigger
                          id="customerId"
                          className={cn(errors.customerId && 'border-destructive')}
                        >
                          <SelectValue placeholder="اختر العميل" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingCustomers ? (
                            <div className="p-2 flex justify-center">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          ) : (
                            customersData?.data.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {errors.customerId && (
                        <p className="text-destructive text-sm">{errors.customerId}</p>
                      )}
                    </div>

                    {/* Due Date */}
                    <div className="space-y-2">
                      <Label htmlFor="receivableDueDate">تاريخ الاستحقاق (اختياري)</Label>
                      <Input
                        id="receivableDueDate"
                        type="date"
                        value={formData.receivableDueDate}
                        onChange={(e) => updateField('receivableDueDate', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Details */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">معلومات إضافية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">


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
                <CardTitle className="text-base">الفرع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <BranchSelect
                    value={formData.branchId}
                    onValueChange={(value) => updateField('branchId', value)}
                    placeholder="اختر الفرع"
                  />
                  {errors.branchId && (
                    <p className="text-destructive text-sm">{errors.branchId}</p>
                  )}
                </div>
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

            {/* Summary */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">ملخص</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">النوع:</span>
                  <span className="font-medium text-secondary">إيراد</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الفئة:</span>
                  <span className="font-medium">
                    {formData.category
                      ? CATEGORY_LABELS_AR[formData.category as TransactionCategory]
                      : '-'}
                  </span>
                </div>
                {supportsMultiItem && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">عدد الأصناف:</span>
                    <span className="font-medium">{formData.items.length}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">طريقة الدفع:</span>
                  <span className="font-medium">
                    {getPaymentMethodLabel(formData.paymentMethod)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">التاريخ:</span>
                  <span className="font-medium">{formatDate(formData.date)}</span>
                </div>
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-medium">المبلغ:</span>
                    <span className="text-lg font-bold text-secondary">
                      {displayAmount > 0
                        ? `+${formatCurrency(displayAmount)}`
                        : '0 د.ع'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 ml-2" />
                    حفظ الإيراد
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => navigate('/transactions')}
                disabled={createMutation.isPending}
              >
                إلغاء
              </Button>
            </div>

            {/* Error Message */}
            {createMutation.isError && (
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
