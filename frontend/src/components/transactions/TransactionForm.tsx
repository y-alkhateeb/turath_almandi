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
 * - Employee salary section for EMPLOYEE_SALARIES category
 */

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput } from '@/components/form/FormInput';
import { FormSelect, type SelectOption } from '@/components/form/FormSelect';
import { FormRadioGroup, type RadioOption } from '@/components/form/FormRadioGroup';
import { FormTextarea } from '@/components/form/FormTextarea';
import { BranchSelector, DateInput } from '@/components/form';
import { EmployeeSalarySection } from '@/components/transactions/EmployeeSalarySection';
import { useAuth } from '@/hooks/useAuth';
import { TransactionType, PaymentMethod } from '@/types/enum';
import type { Transaction, CreateTransactionInput, UpdateTransactionInput } from '#/entity';
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  getCategoriesByType,
} from '@/constants/transactionCategories';

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
    .preprocess(
      (val) => {
        // Convert empty string to undefined for proper required validation
        if (val === '' || val === null) return undefined;
        // Convert string numbers to actual numbers
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
  notes: z.string().max(1000, { message: 'الملاحظات يجب ألا تتجاوز 1000 حرف' }).optional(),
  branchId: z.string().optional(),
});

/**
 * Zod schema for updating a transaction
 * All fields optional except those that must remain unchanged
 */
const updateTransactionSchema = z.object({
  amount: z
    .preprocess(
      (val) => {
        // Convert empty string to undefined for optional field
        if (val === '' || val === null) return undefined;
        // Convert string numbers to actual numbers
        if (typeof val === 'string') {
          const num = parseFloat(val);
          return isNaN(num) ? undefined : num;
        }
        return val;
      },
      z.number({
        invalid_type_error: 'المبلغ يجب أن يكون رقمًا',
      })
        .min(0.01, { message: 'المبلغ يجب أن يكون 0.01 على الأقل' })
        .positive({ message: 'المبلغ يجب أن يكون موجبًا' })
        .optional()
    ),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  category: z.string().optional(),
  date: z.string().optional(),
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
const transactionTypeOptions: SelectOption[] = [
  { value: TransactionType.INCOME, label: 'إيراد' },
  { value: TransactionType.EXPENSE, label: 'مصروف' },
];

/**
 * Payment method options (Arabic)
 */
const paymentMethodOptions: SelectOption[] = [
  { value: PaymentMethod.CASH, label: 'نقدي' },
  { value: PaymentMethod.MASTER, label: 'ماستر كارد' },
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
            paymentMethod: initialData.paymentMethod || undefined,
            category: initialData.category || '',
            date: initialData.date.split('T')[0], // YYYY-MM-DD
            notes: initialData.notes || '',
          }
        : {
            type: TransactionType.INCOME,
            amount: undefined,
            paymentMethod: PaymentMethod.CASH,
            category: 'SALES', // Default to first income category
            date: new Date().toISOString().split('T')[0], // Today
            notes: '',
            branchId: isAdmin ? undefined : user?.branchId,
          },
  });

  // Reset form when mode or initialData changes
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset({
        amount: initialData.amount,
        paymentMethod: initialData.paymentMethod || undefined,
        category: initialData.category || '',
        date: initialData.date.split('T')[0],
        notes: initialData.notes || '',
      });
    }
  }, [mode, initialData, reset]);

  // Watch transaction type and category for conditional fields (only in create mode)
  const transactionType = watch('type' as keyof CreateFormData) as TransactionType | undefined;
  const category = watch('category' as keyof CreateFormData) as string | undefined;
  const branchIdValue = watch('branchId' as keyof CreateFormData) as string | undefined;

  // Determine the effective branchId (from form or user's branch)
  const effectiveBranchId = isAdmin ? branchIdValue : user?.branchId;

  // Check if the employee salaries category is selected
  const isEmployeeSalariesCategory = category === 'EMPLOYEE_SALARIES' && transactionType === TransactionType.EXPENSE;

  // Auto-select first category when transaction type changes
  useEffect(() => {
    if (mode === 'create' && transactionType) {
      const defaultCategory = transactionType === TransactionType.INCOME ? 'INVENTORY_SALES' : 'EMPLOYEE_SALARIES';
      reset((formValues) => ({
        ...formValues,
        category: defaultCategory,
      }));
    }
  }, [transactionType, mode, reset]);

  const handleFormSubmit = async (data: CreateFormData | UpdateFormData) => {
    try {
      if (mode === 'create') {
        const createData = data as CreateFormData;
        const submitData: CreateTransactionInput = {
          type: createData.type,
          amount: createData.amount,
          paymentMethod: createData.paymentMethod,
          category: createData.category || undefined,
          date: createData.date,
          notes: createData.notes || undefined,
          branchId: createData.branchId || undefined,
        };
        await onSubmit(submitData);
        // Reset form after successful submission
        reset();
      } else {
        const updateData = data as UpdateFormData;
        const submitData: UpdateTransactionInput = {
          amount: updateData.amount,
          paymentMethod: updateData.paymentMethod,
          category: updateData.category || undefined,
          date: updateData.date,
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
      {/* Transaction Type and Branch - Same line on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Transaction Type - Only in create mode */}
        {mode === 'create' && (
          <FormSelect
            name="type"
            label="نوع العملية"
            options={transactionTypeOptions}
            register={register}
            error={errors.type}
            required
            disabled={isSubmitting}
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
      </div>

      {/* Category Selection */}
      <div className="grid grid-cols-1 gap-4">
        {/* Category - Dynamic based on transaction type */}
        <FormSelect
          name="category"
          label="الفئة"
          options={
            mode === 'edit' && initialData
              ? initialData.type === TransactionType.INCOME
                ? INCOME_CATEGORIES
                : EXPENSE_CATEGORIES
              : transactionType === TransactionType.INCOME
              ? INCOME_CATEGORIES
              : transactionType === TransactionType.EXPENSE
              ? EXPENSE_CATEGORIES
              : INCOME_CATEGORIES // Default to income if not selected yet
          }
          register={register}
          error={errors.category}
          disabled={isSubmitting}
        />
      </div>

      {/* Employee Salaries Section - Shows when EMPLOYEE_SALARIES category is selected */}
      {mode === 'create' && isEmployeeSalariesCategory && (
        <EmployeeSalarySection
          branchId={effectiveBranchId || null}
          onSuccess={() => {
            reset();
            // Call onCancel to go back or refresh
            onCancel?.();
          }}
          disabled={isSubmitting}
        />
      )}

      {/* Regular Transaction Fields - Hidden when EMPLOYEE_SALARIES is selected */}
      {(!isEmployeeSalariesCategory || mode === 'edit') && (
        <>
          {/* Amount and Payment Method - Same line on large screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

            {/* Payment Method */}
            <FormSelect
              name="paymentMethod"
              label="طريقة الدفع"
              options={paymentMethodOptions}
              register={register}
              error={errors.paymentMethod}
              disabled={isSubmitting}
            />
          </div>

          {/* Date */}
          <DateInput
            mode="form"
            name="date"
            label="التاريخ"
            register={register}
            error={errors.date}
            required={mode === 'create'}
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
        </>
      )}

      {/* Form Actions - Hidden when EMPLOYEE_SALARIES is selected in create mode */}
      {(!isEmployeeSalariesCategory || mode === 'edit') && (
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
      )}

      {/* Cancel button only when EMPLOYEE_SALARIES is selected */}
      {mode === 'create' && isEmployeeSalariesCategory && onCancel && (
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-[var(--border-color)]">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-3 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-tertiary)] focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            إلغاء
          </button>
        </div>
      )}
    </form>
  );
}

export default TransactionForm;
