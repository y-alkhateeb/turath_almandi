/**
 * UnifiedTransactionForm Component
 * Single form component for both INCOME and EXPENSE transactions
 *
 * Features:
 * - Unified design for both transaction types
 * - Category selection via button grid (CategorySelector)
 * - Conditional multi-item support for specific categories
 * - Discount section (income only, specific categories)
 * - Debt creation for partial payments
 * - Payment method radio buttons
 * - Calendar date picker
 * - Form validation with react-hook-form + zod
 * - "Add & Create Another" functionality
 */

import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Alert, AlertDescription } from '@/ui/alert';
import { Icon } from '@/components/icon';
import CategorySelector from './CategorySelector';
import MultiItemCardSelector from './MultiItemCardSelector';
import { cn } from '@/utils';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import transactionService, { type TransactionItemDto } from '@/api/services/transactionService';
import { useEmployees } from '@/hooks/useEmployees';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, supportsMultiItem, supportsDiscount } from '@/constants/transactionCategories';
import { toast } from 'sonner';
import type { TransactionType, PaymentMethod, Currency } from '#/entity';

// ============================================
// TYPES
// ============================================

interface UnifiedTransactionFormProps {
  type: TransactionType; // 'INCOME' | 'EXPENSE'
  initialData?: Partial<TransactionFormData>;
  isEditMode?: boolean;
  transactionId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface TransactionFormData {
  type: TransactionType;
  category: string;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  date: string;
  employeeVendorName?: string;
  notes?: string;
  employeeId?: string;
  branchId?: string;

  // Multi-item fields
  items: TransactionItemDto[];

  // Discount fields (income only)
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountValue?: number;
  discountReason?: string;

  // Debt fields
  isPartialPayment: boolean;
  paidAmount?: number;
  createDebt: boolean;
  debtCreditorName?: string;
  debtDueDate?: string;
}

// ============================================
// VALIDATION SCHEMA
// ============================================

const createSchema = (type: TransactionType) => z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1, 'يجب اختيار الفئة'),
  amount: z.number().min(0.01, 'المبلغ يجب أن يكون أكبر من صفر'),
  currency: z.enum(['USD', 'IQD']).default('USD'),
  paymentMethod: type === 'INCOME'
    ? z.enum(['CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE'])
    : z.enum(['CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE']).optional(),
  date: z.string().min(1, 'يجب اختيار التاريخ'),
  employeeVendorName: z.string().optional(),
  notes: z.string().optional(),
  employeeId: z.string().optional(),
  branchId: z.string().optional(),

  items: z.array(z.object({
    inventoryItemId: z.string(),
    quantity: z.number().min(0.01),
    unitPrice: z.number().min(0),
    operationType: z.enum(['PURCHASE', 'CONSUMPTION']),
    discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
    discountValue: z.number().optional(),
  })).default([]),

  discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  discountValue: z.number().optional(),
  discountReason: z.string().optional(),

  isPartialPayment: z.boolean().default(false),
  paidAmount: z.number().optional(),
  createDebt: z.boolean().default(false),
  debtCreditorName: z.string().optional(),
  debtDueDate: z.string().optional(),
}).refine((data) => {
  // If partial payment, validate paidAmount
  if (data.isPartialPayment && (!data.paidAmount || data.paidAmount >= data.amount)) {
    return false;
  }
  return true;
}, {
  message: 'المبلغ المدفوع يجب أن يكون أقل من الإجمالي',
  path: ['paidAmount'],
}).refine((data) => {
  // If creating debt, validate creditor name
  if (data.createDebt && !data.debtCreditorName) {
    return false;
  }
  return true;
}, {
  message: 'يجب إدخال اسم الدائن',
  path: ['debtCreditorName'],
});

// ============================================
// COMPONENT
// ============================================

export default function UnifiedTransactionForm({
  type,
  initialData,
  isEditMode = false,
  transactionId,
  onSuccess,
  onCancel,
}: UnifiedTransactionFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createAnother, setCreateAnother] = useState(false);
  const { data: employees = [], isLoading: isLoadingEmployees } = useEmployees({
    status: 'ACTIVE',
  });

  const schema = useMemo(() => createSchema(type), [type]);

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type,
      category: initialData?.category || '',
      amount: initialData?.amount || 0,
      currency: initialData?.currency || 'USD',
      paymentMethod: initialData?.paymentMethod || (type === 'EXPENSE' ? 'CASH' : 'CASH'),
      date: initialData?.date || new Date().toISOString().split('T')[0],
      employeeVendorName: initialData?.employeeVendorName || '',
      notes: initialData?.notes || '',
      employeeId: initialData?.employeeId || '',
      branchId: initialData?.branchId || user?.branchId,
      items: initialData?.items || [],
      discountType: initialData?.discountType,
      discountValue: initialData?.discountValue,
      discountReason: initialData?.discountReason,
      isPartialPayment: false,
      paidAmount: undefined,
      createDebt: false,
      debtCreditorName: '',
      debtDueDate: '',
    },
  });

  const { watch, setValue, formState: { errors }, control } = form;
  const category = watch('category');
  const items = watch('items');
  const amount = watch('amount');
  const isPartialPayment = watch('isPartialPayment');
  const paidAmount = watch('paidAmount');
  const createDebt = watch('createDebt');
  const discountType = watch('discountType');
  const discountValue = watch('discountValue');

  const isSalaryCategory = category === 'EMPLOYEE_SALARIES';

  // ============================================
  // FEATURE FLAGS
  // ============================================

  const allowsMultiItem = category ? supportsMultiItem(category) : false;
  const allowsDiscount = type === 'INCOME' && category ? supportsDiscount(category) : false;

  // ============================================
  // CALCULATIONS
  // ============================================

  const calculateItemsTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      let itemTotal = item.quantity * item.unitPrice;

      // Apply item-level discount
      if (item.discountType && item.discountValue) {
        if (item.discountType === 'PERCENTAGE') {
          itemTotal -= (itemTotal * item.discountValue) / 100;
        } else {
          itemTotal -= item.discountValue;
        }
      }

      return sum + itemTotal;
    }, 0);
  }, [items]);

  const calculateDiscountAmount = useMemo(() => {
    if (!discountType || !discountValue) return 0;

    const baseAmount = allowsMultiItem && items.length > 0 ? calculateItemsTotal : amount;

    if (discountType === 'PERCENTAGE') {
      return (baseAmount * discountValue) / 100;
    }
    return discountValue;
  }, [discountType, discountValue, calculateItemsTotal, amount, allowsMultiItem, items.length]);

  const finalTotal = useMemo(() => {
    const baseAmount = allowsMultiItem && items.length > 0 ? calculateItemsTotal : amount;
    return baseAmount - calculateDiscountAmount;
  }, [calculateItemsTotal, amount, calculateDiscountAmount, allowsMultiItem, items.length]);

  const remainingAmount = useMemo(() => {
    if (!isPartialPayment || !paidAmount) return 0;
    return finalTotal - paidAmount;
  }, [isPartialPayment, paidAmount, finalTotal]);

  // ============================================
  // EFFECTS
  // ============================================

  // Auto-calculate amount from items
  useEffect(() => {
    if (allowsMultiItem && items.length > 0) {
      setValue('amount', calculateItemsTotal);
    }
  }, [allowsMultiItem, items, calculateItemsTotal, setValue]);

  // Reset discount when category changes
  useEffect(() => {
    if (!allowsDiscount) {
      setValue('discountType', undefined);
      setValue('discountValue', undefined);
      setValue('discountReason', undefined);
    }
  }, [allowsDiscount, setValue]);

  // Reset items when category changes
  useEffect(() => {
    if (!allowsMultiItem) {
      setValue('items', []);
    }
  }, [allowsMultiItem, setValue]);

  // ============================================
  // MUTATIONS
  // ============================================

  const createMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      // Prepare data based on whether it's multi-item or simple
      if (allowsMultiItem && data.items.length > 0) {
        // Use createWithInventory endpoint
        return transactionService.createWithInventory({
          type: data.type,
          totalAmount: finalTotal,
          paidAmount: data.isPartialPayment ? data.paidAmount : finalTotal,
          category: data.category,
          paymentMethod: data.paymentMethod as 'CASH' | 'MASTER',
          date: data.date,
          notes: data.notes,
          branchId: data.branchId,
          inventoryItem: undefined, // Not using single item structure
          debt: data.createDebt && remainingAmount > 0 ? {
            creditorName: data.debtCreditorName!,
            dueDate: data.debtDueDate,
          } : undefined,
        });
      } else {
        // Use simple create endpoint
        return transactionService.create({
          type: data.type,
          amount: finalTotal,
          currency: data.currency,
          paymentMethod: data.paymentMethod,
          category: data.category,
          date: data.date,
          employeeVendorName: data.employeeVendorName,
          notes: data.notes,
          employeeId: data.employeeId,
          branchId: data.branchId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      toast.success(`تم إضافة ${type === 'INCOME' ? 'الوارد' : 'المصروف'} بنجاح`);

      if (createAnother) {
        form.reset();
      } else {
        onSuccess?.();
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ أثناء الحفظ');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      if (!transactionId) throw new Error('Transaction ID is required');

      return transactionService.update(transactionId, {
        amount: data.amount,
        currency: data.currency,
        paymentMethod: data.paymentMethod,
        category: data.category,
        date: data.date,
        employeeVendorName: data.employeeVendorName,
        notes: data.notes,
        employeeId: data.employeeId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });

      toast.success('تم تحديث المعاملة بنجاح');

      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ أثناء التحديث');
    },
  });

  // ============================================
  // HANDLERS
  // ============================================

  const onSubmit = (data: TransactionFormData) => {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // ============================================
  // RENDER
  // ============================================

  const categories = type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Category Selection */}
      <CategorySelector
        categories={categories}
        value={category}
        onChange={(value) => setValue('category', value)}
        disabled={isSubmitting || isEditMode}
      />

      {category && (
        <>
          {/* Multi-Item Selection */}
          {allowsMultiItem && (
            <Card>
              <CardHeader>
                <CardTitle>الأصناف</CardTitle>
              </CardHeader>
              <CardContent>
                <MultiItemCardSelector
                  branchId={user?.branchId || ''}
                  operationType={type === 'INCOME' ? 'CONSUMPTION' : 'PURCHASE'}
                  selectedItems={items}
                  onItemsChange={(newItems) => setValue('items', newItems)}
                  disabled={isSubmitting}
                />
              </CardContent>
            </Card>
          )}

          {/* Amount (for non-multi-item transactions) */}
          {!allowsMultiItem && (
            <Card>
              <CardHeader>
                <CardTitle>المبلغ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  name="amount"
                  control={form.control}
                  render={({ field }) => (
                    <div>
                      <Label htmlFor="amount">
                        المبلغ <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isSubmitting}
                        className={cn(errors.amount && 'border-red-500')}
                      />
                      {errors.amount && (
                        <p className="text-xs text-red-600 mt-1">{errors.amount.message}</p>
                      )}
                    </div>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Discount Section (Income only, specific categories) */}
          {allowsDiscount && (
            <Card>
              <CardHeader>
                <CardTitle>الخصم (اختياري)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="discountType"
                    control={form.control}
                    render={({ field }) => (
                      <div>
                        <Label htmlFor="discountType">نوع الخصم</Label>
                        <select
                          id="discountType"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value || undefined)}
                          disabled={isSubmitting}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        >
                          <option value="">بدون خصم</option>
                          <option value="PERCENTAGE">نسبة مئوية (%)</option>
                          <option value="FIXED">مبلغ ثابت</option>
                        </select>
                      </div>
                    )}
                  />

                  {discountType && (
                    <Controller
                      name="discountValue"
                      control={form.control}
                      render={({ field }) => (
                        <div>
                          <Label htmlFor="discountValue">
                            قيمة الخصم {discountType === 'PERCENTAGE' ? '(%)' : '(د.ع)'}
                          </Label>
                          <Input
                            id="discountValue"
                            type="number"
                            min="0"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            disabled={isSubmitting}
                          />
                        </div>
                      )}
                    />
                  )}
                </div>

                {discountType && (
                  <Controller
                    name="discountReason"
                    control={form.control}
                    render={({ field }) => (
                      <div>
                        <Label htmlFor="discountReason">سبب الخصم</Label>
                        <div className="space-y-2">
                          <Input
                            id="discountReason"
                            type="text"
                            placeholder="أدخل سبب الخصم..."
                            {...field}
                            disabled={isSubmitting}
                            className="w-full"
                          />
                          <div className="flex flex-wrap gap-2">
                            {['مجاملة', 'طاولة', 'عميل دائم', 'عرض خاص'].map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                onClick={() => field.onChange(suggestion)}
                                className="px-3 py-1 text-xs rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  />
                )}

                {discountType && discountValue && discountValue > 0 && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-900 dark:text-gray-100">قيمة الخصم:</span>
                      <span className="font-semibold text-amber-700 dark:text-amber-400">
                        -{calculateDiscountAmount.toFixed(2)} د.ع
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Total Summary */}
          <Card className={cn(
            'border-2 max-w-md',
            type === 'INCOME'
              ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
              : 'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
          )}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {type === 'INCOME' ? 'إجمالي الوارد:' : 'إجمالي المصروف:'}
                </span>
                <span className={cn(
                  'text-2xl font-bold',
                  type === 'INCOME' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}>
                  {finalTotal.toFixed(2)} د.ع
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Employee Selector (for salaries) */}
          {isSalaryCategory && (
            <Card>
              <CardHeader>
                <CardTitle>اختيار الموظف</CardTitle>
              </CardHeader>
              <CardContent>
                <Controller
                  name="employeeId"
                  control={form.control}
                  render={({ field }) => (
                    <div>
                      <Label htmlFor="employeeId">
                        الموظف <span className="text-red-500">*</span>
                      </Label>
                      <select
                        id="employeeId"
                        {...field}
                        disabled={isSubmitting || isLoadingEmployees}
                        className={cn(
                          'w-full h-10 px-3 rounded-md border border-input bg-background text-sm',
                          errors.employeeId && 'border-red-500'
                        )}
                      >
                        <option value="">-- اختر الموظف --</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} - {emp.position}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Payment Method & Date */}
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل الدفع</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                name="paymentMethod"
                control={form.control}
                render={({ field }) => (
                  <div>
                    <Label>طريقة الدفع</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {(['CASH', 'CARD'] as const).map((method) => (
                        <label
                          key={method}
                          className={cn(
                            'flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all',
                            field.value === method
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400'
                              : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
                          )}
                        >
                          <input
                            type="radio"
                            value={method}
                            checked={field.value === method}
                            onChange={() => field.onChange(method)}
                            disabled={isSubmitting}
                            className="sr-only"
                          />
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {method === 'CASH' && 'نقدي'}
                            {method === 'CARD' && 'ماستر'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              />

              <Controller
                name="date"
                control={form.control}
                render={({ field }) => (
                  <div>
                    <Label htmlFor="date">
                      التاريخ <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      {...field}
                      disabled={isSubmitting}
                      className={cn('max-w-xs', errors.date && 'border-red-500')}
                    />
                    {errors.date && (
                      <p className="text-xs text-red-600 mt-1">{errors.date.message}</p>
                    )}
                  </div>
                )}
              />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>ملاحظات (اختياري)</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="notes"
                control={form.control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={3}
                    placeholder="أضف أي ملاحظات..."
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background resize-none focus:ring-2 focus:ring-primary-500"
                  />
                )}
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-between gap-4 pt-4">
            <div className="flex items-center gap-4">
              {!isEditMode && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createAnother}
                    onChange={(e) => setCreateAnother(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm">حفظ وإضافة آخر</span>
                </label>
              )}
            </div>

            <div className="flex items-center gap-3">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  إلغاء
                </Button>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || !category}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Icon icon="svg-spinners:ring-resize" className="ml-2" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Icon icon="solar:check-circle-bold" className="ml-2" />
                    {isEditMode ? 'تحديث' : 'حفظ'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </form>
  );
}
