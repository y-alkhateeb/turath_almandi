/**
 * TransactionFormWithInventory - Enhanced Form Component
 * Form for creating transactions with inventory operations and partial payment
 *
 * New Features:
 * - Partial payment with debt creation
 * - Inventory operations (purchase/consumption)
 * - Multiple inventory items per transaction
 */

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput } from '@/components/form/FormInput';
import { FormSelect, type SelectOption } from '@/components/form/FormSelect';
import { FormTextarea } from '@/components/form/FormTextarea';
import { BranchSelector, DateInput } from '@/components/form';
import { PartialPaymentSection } from './PartialPaymentSection';
import { InventoryItemsSection } from './InventoryItemsSection';
import { useAuth } from '@/hooks/useAuth';
import { TransactionType, PaymentMethod } from '@/types/enum';
import type { Transaction } from '#/entity';
import type { TransactionWithInventoryRequest, InventoryItemOperation } from '@/types/inventoryOperation.types';
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from '@/constants/transactionCategories';
import { transactionService } from '@/api/services';

// ============================================
// ZOD VALIDATION SCHEMA
// ============================================

const createTransactionWithInventorySchema = z.object({
  type: z.nativeEnum(TransactionType, {
    errorMap: () => ({ message: 'نوع العملية مطلوب' }),
  }),
  totalAmount: z
    .preprocess(
      (val) => {
        if (val === '' || val === null) return undefined;
        if (typeof val === 'string') {
          const num = parseFloat(val);
          return isNaN(num) ? undefined : num;
        }
        return val;
      },
      z.number({
        required_error: 'المبلغ مطلوب',
        invalid_type_error: 'المبلغ يجب أن يكون رقمًا',
      })
        .min(0.01, { message: 'المبلغ يجب أن يكون 0.01 على الأقل' })
        .positive({ message: 'المبلغ يجب أن يكون موجبًا' })
    ),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  category: z.string().optional(),
  date: z.string().min(1, { message: 'التاريخ مطلوب' }),
  employeeVendorName: z.string().min(1, { message: 'الاسم مطلوب' }),
  notes: z.string().max(1000, { message: 'الملاحظات يجب ألا تتجاوز 1000 حرف' }).optional(),
  branchId: z.string().optional(),
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

const paymentMethodOptions: SelectOption[] = [
  { value: PaymentMethod.CASH, label: 'نقدي' },
  { value: PaymentMethod.MASTER, label: 'ماستر كارد' },
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

  // Partial payment state
  const [paidAmount, setPaidAmount] = useState(0);
  const [createDebt, setCreateDebt] = useState(false);
  const [debtCreditorName, setDebtCreditorName] = useState('');
  const [debtDueDate, setDebtDueDate] = useState('');
  const [debtNotes, setDebtNotes] = useState('');

  // Inventory state
  const [inventoryItems, setInventoryItems] = useState<InventoryItemOperation[]>([]);

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
      totalAmount: undefined,
      paymentMethod: PaymentMethod.CASH,
      category: 'INVENTORY',
      date: new Date().toISOString().split('T')[0],
      employeeVendorName: '',
      notes: '',
      branchId: isAdmin ? undefined : user?.branchId,
    },
  });

  const transactionType = watch('type');
  const category = watch('category');
  const totalAmount = watch('totalAmount') || 0;
  const selectedBranchId = watch('branchId') || user?.branchId || null;

  // Auto-update paid amount when total changes
  useEffect(() => {
    if (!paidAmount || paidAmount === 0) {
      setPaidAmount(totalAmount);
    }
  }, [totalAmount]);

  // Auto-select first category when transaction type changes
  useEffect(() => {
    if (transactionType) {
      const defaultCategory = transactionType === TransactionType.INCOME ? 'SALES' : 'INVENTORY';
      setValue('category', defaultCategory);
    }
  }, [transactionType, setValue]);

  const showInventorySection = category === 'INVENTORY' && transactionType === TransactionType.EXPENSE;
  const showPartialPayment = transactionType === TransactionType.EXPENSE;

  const handleFormSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate partial payment
      if (showPartialPayment && paidAmount > totalAmount) {
        throw new Error('المبلغ المدفوع لا يمكن أن يتجاوز المبلغ الإجمالي');
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
        totalAmount: data.totalAmount,
        paidAmount: showPartialPayment ? paidAmount : data.totalAmount,
        category: data.category,
        paymentMethod: data.paymentMethod,
        employeeVendorName: data.employeeVendorName,
        date: data.date,
        notes: data.notes,
        branchId: data.branchId,
        inventoryItems: showInventorySection ? inventoryItems : undefined,
        createDebtForRemaining: createDebt && remainingAmount > 0,
        debtCreditorName: createDebt && remainingAmount > 0 ? debtCreditorName : undefined,
        debtDueDate: createDebt && debtDueDate ? debtDueDate : undefined,
        debtNotes: createDebt ? debtNotes : undefined,
      };

      // Call API
      const result = await transactionService.createWithInventory(requestData);

      // Reset form
      reset();
      setPaidAmount(0);
      setCreateDebt(false);
      setDebtCreditorName('');
      setDebtDueDate('');
      setDebtNotes('');
      setInventoryItems([]);

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
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">الفرع</label>
            <div className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
              {user.branch.name}
            </div>
          </div>
        )}
      </div>

      {/* Total Amount and Payment Method */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FormInput
          name="totalAmount"
          label="المبلغ الإجمالي"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="أدخل المبلغ"
          register={register}
          error={errors.totalAmount}
          required
          disabled={isSubmitting}
        />

        <FormSelect
          name="paymentMethod"
          label="طريقة الدفع"
          options={paymentMethodOptions}
          register={register}
          error={errors.paymentMethod}
          disabled={isSubmitting}
        />
      </div>

      {/* Category and Date */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FormSelect
          name="category"
          label="الفئة"
          options={
            transactionType === TransactionType.INCOME
              ? INCOME_CATEGORIES
              : EXPENSE_CATEGORIES
          }
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

      {/* Employee/Vendor Name */}
      <FormInput
        name="employeeVendorName"
        label="اسم الموظف أو البائع"
        type="text"
        placeholder="أدخل الاسم"
        register={register}
        error={errors.employeeVendorName}
        required
        disabled={isSubmitting}
      />

      {/* Notes */}
      <FormTextarea
        name="notes"
        label="ملاحظات"
        placeholder="أدخل ملاحظات إضافية (اختياري)"
        rows={3}
        maxLength={1000}
        register={register}
        error={errors.notes}
        disabled={isSubmitting}
      />

      {/* Inventory Section */}
      {showInventorySection && (
        <InventoryItemsSection
          branchId={selectedBranchId}
          items={inventoryItems}
          onItemsChange={setInventoryItems}
        />
      )}

      {/* Partial Payment Section */}
      {showPartialPayment && (
        <PartialPaymentSection
          totalAmount={totalAmount}
          paidAmount={paidAmount}
          onPaidAmountChange={setPaidAmount}
          createDebt={createDebt}
          onCreateDebtChange={setCreateDebt}
          debtCreditorName={debtCreditorName}
          onDebtCreditorNameChange={setDebtCreditorName}
          debtDueDate={debtDueDate}
          onDebtDueDateChange={setDebtDueDate}
          debtNotes={debtNotes}
          onDebtNotesChange={setDebtNotes}
        />
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إلغاء
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
