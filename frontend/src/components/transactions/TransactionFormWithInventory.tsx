/**
 * TransactionFormWithInventory - نموذج إضافة معاملة جديدة
 *
 * السيناريوهات:
 * 1. مصروف + مشتريات مخزون = شراء وإضافة للمخزون (PURCHASE)
 * 2. إيراد + مبيعات المخزون = بيع من المخزون (CONSUMPTION)
 * 3. باقي الفئات = إدخال مبلغ يدوي
 *
 * قواعد الدفع:
 * - جميع الفئات تدعم الدفع الجزئي وإنشاء دين
 * - الإيرادات: نقدي أو ماستر كارد
 * - المصروفات: نقدي فقط
 */

import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BranchSelector, DateInput } from '@/components/form';
import { PaymentSection } from './PaymentSection';
import { InventoryItemSection, type SelectedInventoryItem } from './InventoryItemSection';
import { useAuth } from '@/hooks/useAuth';
import { useCreateTransactionWithInventory } from '@/hooks/useTransactions';
import type { Transaction } from '#/entity';
import type { TransactionWithInventoryRequest } from '@/types/inventoryOperation.types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/constants/transactionCategories';

// ============================================
// VALIDATION SCHEMA
// ============================================

const formSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1, 'الفئة مطلوبة'),
  date: z.string().min(1, 'التاريخ مطلوب'),
  notes: z.string().max(1000).optional(),
  branchId: z.string().optional(),
  // Manual amount - only used for non-inventory categories
  manualAmount: z.number().min(0).optional(),
});

type FormData = z.infer<typeof formSchema>;

// ============================================
// COMPONENT
// ============================================

interface TransactionFormWithInventoryProps {
  onSuccess?: (transaction: Transaction) => void;
  onCancel?: () => void;
}

export function TransactionFormWithInventory({
  onSuccess,
  onCancel,
}: TransactionFormWithInventoryProps) {
  const { user, isAdmin } = useAuth();
  const createTransaction = useCreateTransactionWithInventory();

  // ============================================
  // FORM STATE
  // ============================================
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'EXPENSE',
      category: 'INVENTORY',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      branchId: isAdmin ? undefined : user?.branchId,
      manualAmount: 0,
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
  const transactionType = watch('type');
  const category = watch('category');
  const branchId = watch('branchId') || user?.branchId || null;

  // ============================================
  // COMPUTED VALUES
  // ============================================

  // Category options based on transaction type
  // Filter out DEBT_PAYMENT from income (it's auto-created when paying debts)
  const categoryOptions = useMemo(() => {
    if (transactionType === 'INCOME') {
      return INCOME_CATEGORIES.filter(cat => cat.value !== 'DEBT_PAYMENT');
    }
    return EXPENSE_CATEGORIES;
  }, [transactionType]);

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

  // Is expense? (affects payment method options)
  const isExpense = transactionType === 'EXPENSE';

  // Is this a DEBT category? (auto-enable debt registration)
  const isDebtCategory = category === 'DEBT';

  // Categories that allow partial payment (expenses only)
  // مستلزمات, صيانة, مشتريات مخزون, دين, مصروفات أخرى
  const PARTIAL_PAYMENT_ALLOWED_CATEGORIES = ['SUPPLIES', 'MAINTENANCE', 'INVENTORY', 'DEBT', 'OTHER_EXPENSE'];
  const allowPartialPayment = useMemo(() => {
    if (transactionType === 'INCOME') {
      // Income categories don't allow partial payment
      return false;
    }
    return PARTIAL_PAYMENT_ALLOWED_CATEGORIES.includes(category);
  }, [transactionType, category]);

  // ============================================
  // EFFECTS
  // ============================================

  // Reset category when transaction type changes
  useEffect(() => {
    const defaultCategory = transactionType === 'INCOME' ? 'INVENTORY_SALES' : 'INVENTORY';
    setValue('category', defaultCategory);

    // Reset payment method for expenses
    if (transactionType === 'EXPENSE') {
      setPaymentMethod('CASH');
    }
  }, [transactionType, setValue]);

  // Auto-enable debt registration for DEBT category
  useEffect(() => {
    if (isDebtCategory) {
      // For DEBT category: no payment, full amount as debt
      setIsPartialPayment(false);
      setPaidAmount(0);
      setCreateDebt(true);
    } else {
      // Reset when switching away from DEBT
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

  const onSubmit = async (data: FormData) => {
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
        type: data.type as 'INCOME' | 'EXPENSE',
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
        };
      }

      // Submit
      const result = await createTransaction.mutateAsync(requestData);

      // Reset form
      resetForm();

      // Callback
      onSuccess?.(result);
    } catch (err: any) {
      console.error('Form submission error:', err);
      setFormError(err.message || 'حدث خطأ أثناء إنشاء المعاملة');
    }
  };

  const resetForm = () => {
    reset();
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
  };

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

      {/* Transaction Type and Branch */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            نوع الفاتورة <span className="text-red-500">*</span>
          </label>
          <select
            {...register('type')}
            disabled={createTransaction.isPending}
            dir="rtl"
            className="w-full px-4 py-3 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-[var(--bg-primary)] text-[var(--text-primary)] disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed"
          >
            <option value="EXPENSE">صرفيات الصندوق</option>
            <option value="INCOME">واردات صندوق</option>
          </select>
        </div>

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
      </div>

      {/* Category and Date */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            الفئة <span className="text-red-500">*</span>
          </label>
          <select
            {...register('category')}
            disabled={createTransaction.isPending}
            dir="rtl"
            className="w-full px-4 py-3 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-[var(--bg-primary)] text-[var(--text-primary)] disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed"
          >
            {categoryOptions.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

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
      </div>

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
        <textarea
          {...register('notes')}
          rows={4}
          placeholder="أدخل ملاحظات إضافية (اختياري)"
          disabled={createTransaction.isPending}
          className="w-full px-4 py-3 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-[var(--bg-primary)] text-[var(--text-primary)] resize-none disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={createTransaction.isPending || totalAmount <= 0}
          className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createTransaction.isPending ? 'جاري الحفظ...' : 'حفظ المعاملة'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={createTransaction.isPending}
            className="flex-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] px-6 py-3 rounded-lg font-medium hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إلغاء
          </button>
        )}
      </div>
    </form>
  );
}

export default TransactionFormWithInventory;
