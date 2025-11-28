/**
 * TransactionFormRedesigned - نموذج إضافة معاملة بتصميم محسن
 *
 * التحسينات:
 * - فصل صفحات الإيرادات والمصروفات
 * - اختيار الفئة عبر شبكة بطاقات بدلاً من القائمة المنسدلة
 * - زر "إضافة المزيد" للحفظ والبقاء في نفس الصفحة
 *
 * السيناريوهات:
 * 1. مصروف + مشتريات مخزون = شراء وإضافة للمخزون (PURCHASE)
 * 2. إيراد + مبيعات المخزون = بيع من المخزون (CONSUMPTION)
 * 3. باقي الفئات = إدخال مبلغ يدوي
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Save, Loader2 } from 'lucide-react';
import { BranchSelector, DateInput } from '@/components/form';
import { PaymentSection } from './PaymentSection';
import { InventoryItemSection, type SelectedInventoryItem } from './InventoryItemSection';
import { CategorySelector } from './CategorySelector';
import { useAuth } from '@/hooks/useAuth';
import { useCreateTransactionWithInventory } from '@/hooks/useTransactions';
import type { Transaction } from '#/entity';
import type { TransactionWithInventoryRequest } from '@/types/inventoryOperation.types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/constants/transactionCategories';
import { toast } from 'sonner';

// ============================================
// VALIDATION SCHEMA
// ============================================

const formSchema = z.object({
  category: z.string().min(1, 'الفئة مطلوبة'),
  date: z.string().min(1, 'التاريخ مطلوب'),
  notes: z.string().max(1000).optional(),
  branchId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

// ============================================
// TYPES
// ============================================

type TransactionType = 'INCOME' | 'EXPENSE';

interface TransactionFormRedesignedProps {
  /** نوع المعاملة (إيراد أو مصروف) - يحدد من الصفحة */
  transactionType: TransactionType;
  /** callback عند نجاح الحفظ */
  onSuccess?: (transaction: Transaction) => void;
  /** callback عند الإلغاء */
  onCancel?: () => void;
  /** الفئة الافتراضية */
  defaultCategory?: string;
}

export function TransactionFormRedesigned({
  transactionType,
  onSuccess,
  onCancel,
  defaultCategory,
}: TransactionFormRedesignedProps) {
  const { user, isAdmin } = useAuth();
  const createTransaction = useCreateTransactionWithInventory();

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const isExpense = transactionType === 'EXPENSE';

  // الفئات المتاحة حسب نوع المعاملة
  // Filter out DEBT_PAYMENT from income (it's auto-created when paying debts)
  const categoryOptions = useMemo(() => {
    if (transactionType === 'INCOME') {
      return INCOME_CATEGORIES.filter(cat => cat.value !== 'DEBT_PAYMENT');
    }
    return EXPENSE_CATEGORIES;
  }, [transactionType]);

  // الفئة الافتراضية
  const initialCategory = useMemo(() => {
    if (defaultCategory) return defaultCategory;
    return transactionType === 'INCOME' ? 'INVENTORY_SALES' : 'INVENTORY';
  }, [transactionType, defaultCategory]);

  // ============================================
  // FORM STATE
  // ============================================
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: initialCategory,
      date: new Date().toISOString().split('T')[0],
      notes: '',
      branchId: isAdmin ? undefined : user?.branchId,
    },
  });

  // ============================================
  // LOCAL STATE
  // ============================================

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MASTER'>('CASH');
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [createDebt, setCreateDebt] = useState(false);
  const [debtCreditorName, setDebtCreditorName] = useState('');
  const [debtDueDate, setDebtDueDate] = useState('');

  // Inventory state
  const [selectedInventoryItem, setSelectedInventoryItem] =
    useState<SelectedInventoryItem | null>(null);
  const [inventoryTotal, setInventoryTotal] = useState(0);

  // Manual amount for non-inventory categories
  const [manualAmount, setManualAmount] = useState(0);

  // Error state
  const [formError, setFormError] = useState<string | null>(null);

  // ============================================
  // WATCHERS
  // ============================================
  const category = watch('category');
  const branchId = watch('branchId') || user?.branchId || null;

  // ============================================
  // COMPUTED VALUES
  // ============================================

  // Is this an inventory transaction?
  const isInventoryCategory = useMemo(() => {
    return (
      (transactionType === 'EXPENSE' && category === 'INVENTORY') ||
      (transactionType === 'INCOME' && category === 'INVENTORY_SALES')
    );
  }, [transactionType, category]);

  // Inventory operation type (auto-determined)
  const inventoryOperationType = useMemo(() => {
    if (!isInventoryCategory) return null;
    return transactionType === 'EXPENSE' ? 'PURCHASE' : 'CONSUMPTION';
  }, [transactionType, isInventoryCategory]);

  // Total amount (from inventory or manual)
  const totalAmount = useMemo(() => {
    return isInventoryCategory ? inventoryTotal : manualAmount;
  }, [isInventoryCategory, inventoryTotal, manualAmount]);

  // Is this a DEBT category? (auto-enable debt registration)
  const isDebtCategory = category === 'DEBT';

  // Categories that allow partial payment (expenses only)
  const PARTIAL_PAYMENT_ALLOWED_CATEGORIES = ['SUPPLIES', 'MAINTENANCE', 'INVENTORY', 'DEBT', 'OTHER_EXPENSE'];
  const allowPartialPayment = useMemo(() => {
    if (transactionType === 'INCOME') {
      return false;
    }
    return PARTIAL_PAYMENT_ALLOWED_CATEGORIES.includes(category);
  }, [transactionType, category]);

  // ============================================
  // EFFECTS
  // ============================================

  // Auto-enable debt registration for DEBT category
  useEffect(() => {
    if (isDebtCategory) {
      setIsPartialPayment(false);
      setPaidAmount(0);
      setCreateDebt(true);
    } else {
      setCreateDebt(false);
    }
  }, [isDebtCategory]);

  // Reset partial payment when switching to a category that doesn't allow it
  useEffect(() => {
    if (!allowPartialPayment) {
      setIsPartialPayment(false);
      setCreateDebt(false);
      setDebtCreditorName('');
      setDebtDueDate('');
    }
  }, [allowPartialPayment]);

  // Update paid amount when total changes (if not partial payment)
  useEffect(() => {
    if (!isPartialPayment) {
      setPaidAmount(totalAmount);
    }
  }, [totalAmount, isPartialPayment]);

  // Reset inventory state when category changes
  useEffect(() => {
    if (!isInventoryCategory) {
      setSelectedInventoryItem(null);
      setInventoryTotal(0);
    } else {
      setManualAmount(0);
    }
  }, [isInventoryCategory]);

  // ============================================
  // HANDLERS
  // ============================================

  const resetFormState = useCallback(() => {
    setPaymentMethod('CASH');
    setIsPartialPayment(false);
    setPaidAmount(0);
    setCreateDebt(false);
    setDebtCreditorName('');
    setDebtDueDate('');
    setSelectedInventoryItem(null);
    setInventoryTotal(0);
    setManualAmount(0);
    setFormError(null);
  }, []);

  const resetFormForAddMore = useCallback(() => {
    // Reset form to defaults but keep the date and branch
    const currentDate = new Date().toISOString().split('T')[0];
    reset({
      category: initialCategory,
      date: currentDate,
      notes: '',
      branchId: isAdmin ? undefined : user?.branchId,
    });
    resetFormState();
  }, [reset, initialCategory, isAdmin, user?.branchId, resetFormState]);

  const submitTransaction = async (data: FormData, addMore: boolean) => {
    setFormError(null);

    try {
      // Validate total amount
      if (totalAmount <= 0) {
        throw new Error('المبلغ الإجمالي يجب أن يكون أكبر من صفر');
      }

      // Validate inventory selection
      if (isInventoryCategory && !selectedInventoryItem) {
        throw new Error('يرجى اختيار صنف من المخزون');
      }

      // Validate partial payment
      if (isPartialPayment && paidAmount > totalAmount) {
        throw new Error('المبلغ المدفوع لا يمكن أن يتجاوز المبلغ الإجمالي');
      }

      // Validate debt fields
      const remainingAmount = totalAmount - paidAmount;
      if (createDebt && remainingAmount > 0 && !debtCreditorName.trim()) {
        throw new Error('اسم الدائن مطلوب عند تسجيل دين');
      }

      // Build request
      const requestData: TransactionWithInventoryRequest = {
        type: transactionType,
        totalAmount,
        paidAmount: isPartialPayment ? paidAmount : totalAmount,
        category: data.category,
        paymentMethod: isExpense ? 'CASH' : paymentMethod,
        date: data.date,
        notes: data.notes || undefined,
        branchId: data.branchId,
        createDebtForRemaining: createDebt && remainingAmount > 0,
        debtCreditorName: createDebt && remainingAmount > 0 ? debtCreditorName : undefined,
        debtDueDate: createDebt && debtDueDate ? debtDueDate : undefined,
      };

      // Add inventory item if applicable
      if (isInventoryCategory && selectedInventoryItem && inventoryOperationType) {
        requestData.inventoryItem = {
          itemId: selectedInventoryItem.itemId,
          quantity: selectedInventoryItem.quantity,
          operationType: inventoryOperationType,
          unitPrice: selectedInventoryItem.unitPrice,
          // Include selling price for PURCHASE operations
          sellingPrice: inventoryOperationType === 'PURCHASE' ? selectedInventoryItem.sellingPrice : undefined,
        };
      }

      // Submit
      const result = await createTransaction.mutateAsync(requestData);

      if (addMore) {
        // Reset form for adding more transactions
        resetFormForAddMore();
        toast.success('تم حفظ المعاملة بنجاح، يمكنك إضافة معاملة أخرى');
      } else {
        // Full reset and callback
        reset();
        resetFormState();
        onSuccess?.(result);
      }
    } catch (err: any) {
      console.error('Form submission error:', err);
      setFormError(err.message || 'حدث خطأ أثناء إنشاء المعاملة');
    }
  };

  const onSubmit = (data: FormData) => submitTransaction(data, false);
  const onSubmitAndAddMore = () => handleSubmit((data) => submitTransaction(data, true))();

  // ============================================
  // RENDER
  // ============================================
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" dir="rtl">
      {/* Error Display */}
      {formError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-600 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-200">{formError}</p>
        </div>
      )}

      {/* Branch Selector (Admin only) */}
      {isAdmin ? (
        <Controller
          name="branchId"
          control={control}
          render={({ field }) => (
            <BranchSelector
              value={field.value || null}
              onChange={field.onChange}
              disabled={createTransaction.isPending}
            />
          )}
        />
      ) : user?.branch ? (
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            الفرع
          </label>
          <div className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)]">
            {user.branch.name}
          </div>
        </div>
      ) : null}

      {/* Category Selection - Grid Style */}
      <Controller
        name="category"
        control={control}
        render={({ field }) => (
          <CategorySelector
            categories={categoryOptions}
            value={field.value}
            onChange={field.onChange}
            disabled={createTransaction.isPending}
          />
        )}
      />

      {/* Date */}
      <Controller
        name="date"
        control={control}
        render={({ field }) => (
          <DateInput
            label="التاريخ"
            value={field.value}
            onChange={field.onChange}
            error={errors.date?.message}
            disabled={createTransaction.isPending}
          />
        )}
      />

      {/* Inventory Section (Conditional) */}
      {isInventoryCategory && inventoryOperationType && (
        <InventoryItemSection
          branchId={branchId}
          operationType={inventoryOperationType}
          selectedItem={selectedInventoryItem}
          onItemChange={setSelectedInventoryItem}
          onTotalChange={setInventoryTotal}
          disabled={createTransaction.isPending}
        />
      )}

      {/* Manual Amount (Non-Inventory) */}
      {!isInventoryCategory && (
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            المبلغ <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={manualAmount || ''}
            onChange={(e) => setManualAmount(parseFloat(e.target.value) || 0)}
            min="0.01"
            step="0.01"
            placeholder="أدخل المبلغ"
            disabled={createTransaction.isPending}
            className="w-full px-4 py-3 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-[var(--bg-primary)] text-[var(--text-primary)] disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed"
          />
        </div>
      )}

      {/* Payment Section */}
      <PaymentSection
        totalAmount={totalAmount}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        isPartialPayment={isPartialPayment}
        onPartialPaymentChange={setIsPartialPayment}
        paidAmount={paidAmount}
        onPaidAmountChange={setPaidAmount}
        createDebt={createDebt}
        onCreateDebtChange={setCreateDebt}
        debtCreditorName={debtCreditorName}
        onDebtCreditorNameChange={setDebtCreditorName}
        debtDueDate={debtDueDate}
        onDebtDueDateChange={setDebtDueDate}
        disabled={createTransaction.isPending}
        isExpense={isExpense}
        isDebtCategory={isDebtCategory}
        allowPartialPayment={allowPartialPayment}
      />

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          ملاحظات
        </label>
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <textarea
              {...field}
              rows={3}
              placeholder="أدخل ملاحظات إضافية (اختياري)"
              disabled={createTransaction.isPending}
              className="w-full px-4 py-3 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-[var(--bg-primary)] text-[var(--text-primary)] resize-none disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed"
            />
          )}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[var(--border-color)]">
        {/* Primary Action - Save */}
        <button
          type="submit"
          disabled={createTransaction.isPending || totalAmount <= 0}
          className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createTransaction.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              حفظ المعاملة
            </>
          )}
        </button>

        {/* Secondary Action - Add More */}
        <button
          type="button"
          onClick={onSubmitAndAddMore}
          disabled={createTransaction.isPending || totalAmount <= 0}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createTransaction.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              إضافة المزيد
            </>
          )}
        </button>

        {/* Cancel */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={createTransaction.isPending}
            className="flex-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] px-6 py-3 rounded-lg font-medium hover:bg-[var(--bg-tertiary)] transition-colors border border-[var(--border-color)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إلغاء
          </button>
        )}
      </div>
    </form>
  );
}

export default TransactionFormRedesigned;
