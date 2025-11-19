/**
 * TransactionForm - Presentational Component
 * Form for creating and editing transactions with validation
 *
 * Features:
 * - Create/Edit modes
 * - react-hook-form with Zod validation
 * - Conditional fields based on transaction type
 * - Branch selector for admins
 * - Arabic labels and error messages
 * - Strict typing matching backend DTOs
 */

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput } from '@/components/form/FormInput';
import { FormSelect, type SelectOption } from '@/components/form/FormSelect';
import { FormRadioGroup, type RadioOption } from '@/components/form/FormRadioGroup';
import { FormTextarea } from '@/components/form/FormTextarea';
import { BranchSelector } from '@/components/BranchSelector';
import { useAuth } from '@/hooks/useAuth';
import { TransactionType, PaymentMethod, Currency } from '@/types/enum';
import type { Transaction, CreateTransactionInput, UpdateTransactionInput } from '#/entity';

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

/**
 * Zod schema for creating a transaction
 * Matches backend CreateTransactionDto validation rules
 */
const createTransactionSchema = z.object({
  type: z.nativeEnum(TransactionType, {
    errorMap: () => ({ message: 'نوع العملية مطلوب' }),
  }),
  amount: z
    .number({
      required_error: 'المبلغ مطلوب',
      invalid_type_error: 'المبلغ يجب أن يكون رقمًا',
    })
    .min(0.01, { message: 'المبلغ يجب أن يكون 0.01 على الأقل' })
    .positive({ message: 'المبلغ يجب أن يكون موجبًا' }),
  currency: z.nativeEnum(Currency).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  category: z.string().optional(),
  date: z.string().min(1, { message: 'التاريخ مطلوب' }),
  employeeVendorName: z.string().optional(),
  notes: z.string().max(1000, { message: 'الملاحظات يجب ألا تتجاوز 1000 حرف' }).optional(),
  branchId: z.string().optional(),
});

/**
 * Zod schema for updating a transaction
 * All fields optional except those that must remain unchanged
 */
const updateTransactionSchema = z.object({
  amount: z
    .number({
      invalid_type_error: 'المبلغ يجب أن يكون رقمًا',
    })
    .min(0.01, { message: 'المبلغ يجب أن يكون 0.01 على الأقل' })
    .positive({ message: 'المبلغ يجب أن يكون موجبًا' })
    .optional(),
  currency: z.nativeEnum(Currency).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  category: z.string().optional(),
  date: z.string().optional(),
  employeeVendorName: z.string().optional(),
  notes: z.string().max(1000, { message: 'الملاحظات يجب ألا تتجاوز 1000 حرف' }).optional(),
});

type CreateFormData = z.infer<typeof createTransactionSchema>;
type UpdateFormData = z.infer<typeof updateTransactionSchema>;

// ============================================
// TYPES
// ============================================

export interface TransactionFormProps {
  mode: 'create' | 'edit';
  initialData?: Transaction;
  onSubmit: (data: CreateTransactionInput | UpdateTransactionInput) => Promise<void>;
  onCancel?: () => void;
  isSubmitting: boolean;
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Transaction type options (Arabic)
 */
const transactionTypeOptions: RadioOption[] = [
  { value: TransactionType.INCOME, label: 'إيراد', description: 'دخل أو إيراد مالي' },
  { value: TransactionType.EXPENSE, label: 'مصروف', description: 'مصروف أو نفقة' },
];

/**
 * Payment method options (Arabic)
 */
const paymentMethodOptions: RadioOption[] = [
  { value: PaymentMethod.CASH, label: 'نقدي' },
  { value: PaymentMethod.MASTER, label: 'ماستر كارد' },
];

/**
 * Category options (Arabic)
 */
const categoryOptions: SelectOption[] = [
  { value: '', label: 'اختر الفئة...' },
  { value: 'SALE', label: 'بيع' },
  { value: 'PURCHASE', label: 'شراء' },
  { value: 'EXPENSE', label: 'مصروف' },
  { value: 'SALARY', label: 'راتب' },
  { value: 'DEBT_PAYMENT', label: 'دفع دين' },
  { value: 'OTHER', label: 'أخرى' },
];

/**
 * Currency options (Arabic)
 */
const currencyOptions: SelectOption[] = [
  { value: Currency.IQD, label: 'دينار عراقي (IQD)' },
  { value: Currency.USD, label: 'دولار أمريكي (USD)' },
];

// ============================================
// COMPONENT
// ============================================

export function TransactionForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: TransactionFormProps) {
  const { user, isAdmin } = useAuth();

  // Use appropriate schema based on mode
  const schema = mode === 'create' ? createTransactionSchema : updateTransactionSchema;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(schema),
    defaultValues:
      mode === 'edit' && initialData
        ? {
            amount: initialData.amount,
            currency: initialData.currency,
            paymentMethod: initialData.paymentMethod || undefined,
            category: initialData.category || '',
            date: initialData.date.split('T')[0], // YYYY-MM-DD
            employeeVendorName: initialData.employeeVendorName || '',
            notes: initialData.notes || '',
          }
        : {
            type: TransactionType.INCOME,
            amount: undefined,
            currency: Currency.IQD,
            paymentMethod: PaymentMethod.CASH,
            category: '',
            date: new Date().toISOString().split('T')[0], // Today
            employeeVendorName: '',
            notes: '',
            branchId: isAdmin ? undefined : user?.branchId,
          },
  });

  // Reset form when mode or initialData changes
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset({
        amount: initialData.amount,
        currency: initialData.currency,
        paymentMethod: initialData.paymentMethod || undefined,
        category: initialData.category || '',
        date: initialData.date.split('T')[0],
        employeeVendorName: initialData.employeeVendorName || '',
        notes: initialData.notes || '',
      });
    }
  }, [mode, initialData, reset]);

  // Watch transaction type for conditional fields (only in create mode)
  const transactionType = watch('type' as keyof CreateFormData) as TransactionType | undefined;

  const handleFormSubmit = async (data: CreateFormData | UpdateFormData) => {
    try {
      if (mode === 'create') {
        const createData = data as CreateFormData;
        const submitData: CreateTransactionInput = {
          type: createData.type,
          amount: createData.amount,
          currency: createData.currency,
          paymentMethod: createData.paymentMethod,
          category: createData.category || undefined,
          date: createData.date,
          employeeVendorName: createData.employeeVendorName || undefined,
          notes: createData.notes || undefined,
        };
        await onSubmit(submitData);
        // Reset form after successful submission
        reset();
      } else {
        const updateData = data as UpdateFormData;
        const submitData: UpdateTransactionInput = {
          amount: updateData.amount,
          currency: updateData.currency,
          paymentMethod: updateData.paymentMethod,
          category: updateData.category || undefined,
          date: updateData.date,
          employeeVendorName: updateData.employeeVendorName || undefined,
          notes: updateData.notes || undefined,
        };
        await onSubmit(submitData);
        // Reset form after successful submission
        reset();
      }
    } catch (error) {
      // Error handling is done by the parent component
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6" dir="rtl">
      {/* Transaction Type - Only in create mode */}
      {mode === 'create' && (
        <FormRadioGroup
          name="type"
          label="نوع العملية"
          options={transactionTypeOptions}
          register={register}
          error={errors.type}
          required
          disabled={isSubmitting}
          inline
        />
      )}

      {/* Transaction Type Display - Only in edit mode */}
      {mode === 'edit' && initialData && (
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            نوع العملية
          </label>
          <div className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)]">
            {initialData.type === TransactionType.INCOME ? 'إيراد' : 'مصروف'}
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            لا يمكن تغيير نوع العملية بعد الإنشاء
          </p>
        </div>
      )}

      {/* Branch Selector - Only for admins */}
      {mode === 'create' && isAdmin && (
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

      {/* Branch Display - Read-only for accountants */}
      {mode === 'create' && !isAdmin && user?.branch && (
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">الفرع</label>
          <div className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)]">
            {user.branch.name}
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            يتم تعبئة الفرع تلقائيًا من حسابك
          </p>
        </div>
      )}

      {/* Amount */}
      <FormInput
        name="amount"
        label="المبلغ"
        type="number"
        step="0.01"
        min="0.01"
        placeholder="أدخل المبلغ"
        register={register}
        error={errors.amount}
        required
        disabled={isSubmitting}
      />

      {/* Currency */}
      <FormSelect
        name="currency"
        label="العملة"
        options={currencyOptions}
        register={register}
        error={errors.currency}
        disabled={isSubmitting}
      />

      {/* Payment Method */}
      <FormRadioGroup
        name="paymentMethod"
        label="طريقة الدفع"
        options={paymentMethodOptions}
        register={register}
        error={errors.paymentMethod}
        disabled={isSubmitting}
        inline
      />

      {/* Category */}
      <FormSelect
        name="category"
        label="الفئة"
        options={categoryOptions}
        register={register}
        error={errors.category}
        disabled={isSubmitting}
      />

      {/* Date */}
      <FormInput
        name="date"
        label="التاريخ"
        type="date"
        register={register}
        error={errors.date}
        required={mode === 'create'}
        disabled={isSubmitting}
      />

      {/* Employee/Vendor Name - Show for expenses or if type not selected */}
      {(mode === 'edit' ||
        transactionType === TransactionType.EXPENSE ||
        transactionType === undefined) && (
        <FormInput
          name="employeeVendorName"
          label={
            transactionType === TransactionType.EXPENSE
              ? 'اسم الموظف أو البائع'
              : 'اسم الموظف/البائع'
          }
          type="text"
          placeholder="أدخل الاسم (اختياري)"
          register={register}
          error={errors.employeeVendorName}
          disabled={isSubmitting}
        />
      )}

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

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t border-[var(--border-color)]">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-3 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-tertiary)] focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            إلغاء
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isSubmitting && (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {mode === 'create' ? 'إضافة عملية' : 'تحديث العملية'}
        </button>
      </div>
    </form>
  );
}

export default TransactionForm;
