/**
 * TransactionFormWithInventory - Refactored Form Component
 * Form for creating transactions with inventory operations and payment
 *
 * Features:
 * - Single inventory item per transaction
 * - Auto-calculated total for inventory items
 * - Unified payment section with partial payment and debt creation for ALL transactions
 * - Inventory section shows for:
 *   - "مشتريات المخزن" (EXPENSE + INVENTORY = PURCHASE) - شراء وإضافة للمخزون
 *   - "مبيعات المخزون" (INCOME + INVENTORY_SALES = CONSUMPTION) - بيع من المخزون
 * - For other categories, manual amount input is used
 */

import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput } from '@/components/form/FormInput';
import { FormSelect, type SelectOption } from '@/components/form/FormSelect';
import { FormTextarea } from '@/components/form/FormTextarea';
import { BranchSelector, DateInput } from '@/components/form';
import { PaymentSection } from './PaymentSection';
import { InventoryItemSection } from './InventoryItemSection';
import { useAuth } from '@/hooks/useAuth';
import { TransactionType, PaymentMethod } from '@/types/enum';
import type { Transaction } from '#/entity';
import type { TransactionWithInventoryRequest, SingleInventoryItem } from '@/types/inventoryOperation.types';
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from '@/constants/transactionCategories';
import transactionService from '@/api/services/transactionService';

// ============================================
// ZOD VALIDATION SCHEMA
// ============================================

const createTransactionWithInventorySchema = z.object({
  type: z.nativeEnum(TransactionType, {
    errorMap: () => ({ message: 'نوع العملية مطلوب' }),
  }),
  category: z.string().optional(),
  date: z.string().min(1, { message: 'التاريخ مطلوب' }),
  notes: z.string().max(1000, { message: 'الملاحظات يجب ألا تتجاوز 1000 حرف' }).optional(),
  branchId: z.string().optional(),
  // Manual total amount (only for non-INVENTORY categories)
  manualTotalAmount: z.number().optional(),
});

type FormData = z.infer<typeof createTransactionWithInventorySchema>;

// ============================================
// TYPES
// ============================================

export interface TransactionFormWithInventoryProps {
  onSuccess?: (transaction: Transaction) => void;
  onCancel?: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const transactionTypeOptions: SelectOption[] = [
  { value: TransactionType.INCOME, label: 'إيراد' },
  { value: TransactionType.EXPENSE, label: 'مصروف' },
];

// ============================================
// COMPONENT
// ============================================

export function TransactionFormWithInventory({
  onSuccess,
  onCancel,
}: TransactionFormWithInventoryProps) {
  const { user, isAdmin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MASTER'>('CASH');
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [createDebt, setCreateDebt] = useState(false);
  const [debtCreditorName, setDebtCreditorName] = useState('');
  const [debtDueDate, setDebtDueDate] = useState('');

  // Inventory state
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<SingleInventoryItem | null>(null);
  const [inventoryCalculatedTotal, setInventoryCalculatedTotal] = useState(0);

  // Manual total amount for non-inventory categories
  const [manualTotalAmount, setManualTotalAmount] = useState<number>(0);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(createTransactionWithInventorySchema),
    defaultValues: {
      type: TransactionType.EXPENSE,
      category: 'OTHER_EXPENSE', // Default to OTHER_EXPENSE, not INVENTORY
      date: new Date().toISOString().split('T')[0],
      notes: '',
      branchId: isAdmin ? undefined : user?.branchId,
    },
  });

  const transactionType = watch('type');
  const category = watch('category');
  const selectedBranchId = watch('branchId') || user?.branchId || null;

  // Debug: Log values to understand the issue
  console.log('🔍 Debug TransactionForm:', {
    transactionType,
    category,
    categoryIsInventory: category === 'INVENTORY',
    typeIsExpense: transactionType === TransactionType.EXPENSE,
  });

  // Compute category options based on transaction type (memoized)
  const categoryOptions = useMemo(() => {
    const options = transactionType === TransactionType.INCOME
      ? INCOME_CATEGORIES
      : EXPENSE_CATEGORIES;
    console.log('📋 Categories for', transactionType, ':', options.map(c => ({ value: c.value, label: c.label })));
    return options;
  }, [transactionType]);

  // Auto-determine inventory operation type based on transaction type and category
  const inventoryOperationType = useMemo(() => {
    // EXPENSE + INVENTORY = PURCHASE (شراء وإضافة للمخزون)
    if (category === 'INVENTORY' && transactionType === TransactionType.EXPENSE) {
      return 'PURCHASE';
    }
    // INCOME + INVENTORY_SALES = CONSUMPTION (بيع من المخزون)
    if (category === 'INVENTORY_SALES' && transactionType === TransactionType.INCOME) {
      return 'CONSUMPTION';
    }
    return null;
  }, [transactionType, category]);

  // Determine if we should show inventory section or manual amount input
  // Show inventory section for:
  // - EXPENSE + INVENTORY (مشتريات المخزن) = شراء
  // - INCOME + INVENTORY_SALES (مبيعات المخزون) = بيع
  const showInventorySection = useMemo(() => {
    const isPurchase = category === 'INVENTORY' && transactionType === TransactionType.EXPENSE;
    const isSale = category === 'INVENTORY_SALES' && transactionType === TransactionType.INCOME;
    const result = isPurchase || isSale;
    console.log('🔍 Show Inventory Section:', { category, transactionType, isPurchase, isSale, result });
    return result;
  }, [category, transactionType]);

  const showManualAmountInput = !showInventorySection;

  // Show partial payment section for ALL transactions (both INCOME and EXPENSE)
  const showPartialPayment = true;

  // Calculate the actual total amount based on category
  const totalAmount = useMemo(() => {
    if (showInventorySection) {
      return inventoryCalculatedTotal;
    }
    return manualTotalAmount;
  }, [showInventorySection, inventoryCalculatedTotal, manualTotalAmount]);

  // Auto-select first category when transaction type changes
  useEffect(() => {
    if (transactionType) {
      // For INCOME, default to SALES
      // For EXPENSE, default to OTHER_EXPENSE (not INVENTORY)
      // User must explicitly choose INVENTORY to see inventory section
      const defaultCategory = transactionType === TransactionType.INCOME ? 'SALES' : 'OTHER_EXPENSE';
      setValue('category', defaultCategory);
    }
  }, [transactionType, setValue]);

  // Auto-update paid amount when total changes and not in partial payment mode
  useEffect(() => {
    if (!isPartialPayment) {
      setPaidAmount(totalAmount);
    }
  }, [totalAmount, isPartialPayment]);

  // Note: Partial payment is now enabled for all transactions (INCOME and EXPENSE)

  // Reset inventory item when category changes away from inventory categories
  useEffect(() => {
    if (!showInventorySection) {
      setSelectedInventoryItem(null);
      setInventoryCalculatedTotal(0);
    }
  }, [showInventorySection]);

  // Reset inventory item when transaction type changes (operation type changes)
  useEffect(() => {
    // Reset when switching between PURCHASE and CONSUMPTION modes
    if (showInventorySection && selectedInventoryItem) {
      setSelectedInventoryItem(null);
      setInventoryCalculatedTotal(0);
    }
  }, [inventoryOperationType]);

  const handleFormSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate total amount
      if (totalAmount <= 0) {
        throw new Error('المبلغ الإجمالي يجب أن يكون أكبر من صفر');
      }

      // Validate inventory item for INVENTORY category
      if (showInventorySection && !selectedInventoryItem) {
        throw new Error('يرجى اختيار صنف من المخزون');
      }

      if (showInventorySection && selectedInventoryItem) {
        if (selectedInventoryItem.quantity <= 0) {
          throw new Error('الكمية يجب أن تكون أكبر من صفر');
        }
        if (selectedInventoryItem.unitPrice <= 0) {
          throw new Error('سعر الوحدة يجب أن يكون أكبر من صفر');
        }
      }

      // Validate partial payment
      if (isPartialPayment) {
        if (paidAmount < 0) {
          throw new Error('المبلغ المدفوع لا يمكن أن يكون سالباً');
        }
        if (paidAmount > totalAmount) {
          throw new Error('المبلغ المدفوع لا يمكن أن يتجاوز المبلغ الإجمالي');
        }
      }

      // Validate debt fields if creating debt
      const remainingAmount = totalAmount - paidAmount;
      if (createDebt && remainingAmount > 0) {
        if (!debtCreditorName.trim()) {
          throw new Error('اسم الدائن مطلوب عند تسجيل دين');
        }
      }

      // Build request payload
      const requestData: TransactionWithInventoryRequest = {
        type: data.type,
        totalAmount: totalAmount,
        paidAmount: isPartialPayment ? paidAmount : totalAmount,
        category: data.category,
        paymentMethod: paymentMethod,
        date: data.date,
        notes: data.notes,
        branchId: data.branchId,
        createDebtForRemaining: createDebt && remainingAmount > 0,
        debtCreditorName: createDebt && remainingAmount > 0 ? debtCreditorName : undefined,
        debtDueDate: createDebt && debtDueDate ? debtDueDate : undefined,
      };

      // Add inventory item if applicable
      if (showInventorySection && selectedInventoryItem && inventoryOperationType) {
        requestData.inventoryItem = {
          itemId: selectedInventoryItem.itemId,
          quantity: selectedInventoryItem.quantity,
          operationType: inventoryOperationType,
          unitPrice: selectedInventoryItem.unitPrice,
        };
      }

      // Call API
      const result = await transactionService.createWithInventory(requestData);

      // Reset form
      reset();
      setPaymentMethod('CASH');
      setIsPartialPayment(false);
      setPaidAmount(0);
      setCreateDebt(false);
      setDebtCreditorName('');
      setDebtDueDate('');
      setSelectedInventoryItem(null);
      setInventoryCalculatedTotal(0);
      setManualTotalAmount(0);

      // Success callback
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err: any) {
      console.error('Form submission error:', err);
      setError(err.message || 'حدث خطأ أثناء إنشاء المعاملة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6" dir="rtl">
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Transaction Type and Branch */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FormSelect
          name="type"
          label="نوع العملية"
          options={transactionTypeOptions}
          register={register}
          error={errors.type}
          required
          disabled={isSubmitting}
        />

        {isAdmin && (
          <Controller
            name="branchId"
            control={control}
            render={({ field }) => (
              <BranchSelector
                value={field.value || null}
                onChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />
        )}

        {!isAdmin && user?.branch && (
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">الفرع</label>
            <div className="px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)]">
              {user.branch.name}
            </div>
          </div>
        )}
      </div>

      {/* Category and Date */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FormSelect
          name="category"
          label="الفئة"
          options={categoryOptions}
          register={register}
          error={errors.category}
          disabled={isSubmitting}
        />

        <DateInput
          mode="form"
          name="date"
          label="التاريخ"
          register={register}
          error={errors.date}
          required
          disabled={isSubmitting}
        />
      </div>

      {/* Inventory Section (if category is INVENTORY) */}
      {showInventorySection && inventoryOperationType && (
        <InventoryItemSection
          branchId={selectedBranchId}
          operationType={inventoryOperationType}
          selectedItem={selectedInventoryItem}
          onItemChange={setSelectedInventoryItem}
          onTotalChange={setInventoryCalculatedTotal}
          disabled={isSubmitting}
        />
      )}

      {/* Manual Total Amount Input (for non-INVENTORY categories) */}
      {showManualAmountInput && (
        <FormInput
          label="المبلغ الإجمالي"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="أدخل المبلغ"
          value={manualTotalAmount || ''}
          onChange={(e) => setManualTotalAmount(parseFloat(e.target.value) || 0)}
          required
          disabled={isSubmitting}
        />
      )}

      {/* Payment Section (always shown) */}
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
        showPartialPaymentOption={showPartialPayment}
        disabled={isSubmitting}
      />

      {/* Notes */}
      <FormTextarea
        name="notes"
        label="ملاحظات (اختياري)"
        placeholder="أدخل ملاحظات إضافية"
        rows={3}
        maxLength={1000}
        register={register}
        error={errors.notes}
        disabled={isSubmitting}
      />

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t border-[var(--border-color)]">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-3 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            إلغاء
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 text-sm font-medium text-white bg-brand-gold-500 rounded-lg hover:bg-brand-gold-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:ring-offset-2"
        >
          {isSubmitting && (
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          إضافة معاملة
        </button>
      </div>
    </form>
  );
}

export default TransactionFormWithInventory;
