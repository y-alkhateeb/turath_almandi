import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateTransaction } from '../hooks/useTransactions';
import { TransactionType } from '../types/transactions.types';
import type { SalaryExpenseFormData } from '../types/transactions.types';
import { useAuth } from '../hooks/useAuth';

/**
 * Zod Validation Schema for Salary Expense Form
 * All validation messages in Arabic
 * Matches backend validation rules: amount must be >= 0.01
 */
const salaryExpenseSchema = z.object({
  date: z.date({ message: 'التاريخ مطلوب' }),
  amount: z
    .string()
    .min(1, { message: 'المبلغ مطلوب' })
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0.01;
      },
      { message: 'المبلغ يجب أن يكون 0.01 على الأقل' }
    ),
  employee_name: z
    .string()
    .min(1, { message: 'اسم الموظف مطلوب' })
    .min(2, { message: 'اسم الموظف يجب أن يكون حرفين على الأقل' }),
  notes: z.string(),
});

interface SalaryExpenseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Salary Expense Form Component
 *
 * Features:
 * - Date picker with default to today
 * - Amount validation (> 0)
 * - Employee name field (required)
 * - Optional notes
 * - Auto-filled branch from user (read-only for accountant)
 * - Real-time validation
 * - Loading state on submit
 * - Success message and form reset
 * - Error handling
 * - Arabic interface with RTL layout
 */
export const SalaryExpenseForm = ({ onSuccess, onCancel }: SalaryExpenseFormProps) => {
  const { user } = useAuth();
  const createTransaction = useCreateTransaction();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SalaryExpenseFormData>({
    resolver: zodResolver(salaryExpenseSchema),
    defaultValues: {
      date: new Date(),
      amount: '',
      employee_name: '',
      notes: '',
    },
  });

  const onSubmit = async (data: SalaryExpenseFormData) => {
    try {
      // Convert form data to API format
      const transactionData = {
        type: TransactionType.EXPENSE,
        amount: parseFloat(data.amount),
        employeeVendorName: data.employee_name,
        date: data.date.toISOString().split('T')[0], // Format: YYYY-MM-DD
        notes: data.notes || undefined,
      };

      await createTransaction.mutateAsync(transactionData);

      // Reset form on success
      reset({
        date: new Date(),
        amount: '',
        employee_name: '',
        notes: '',
      });

      // Call success callback if provided
      onSuccess?.();
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Failed to create salary expense transaction:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Branch Display (Read-only) */}
      {user?.branch && (
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            الفرع
          </label>
          <div className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)]">
            {user.branch.name}
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            يتم تعبئة الفرع تلقائيًا من حسابك
          </p>
        </div>
      )}

      {/* Date Picker */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          التاريخ <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="date"
          {...register('date', {
            valueAsDate: true,
          })}
          defaultValue={new Date().toISOString().split('T')[0]}
          className={`w-full px-4 py-3 border ${
            errors.date ? 'border-red-500' : 'border-[var(--border-color)]'
          } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
          disabled={isSubmitting}
        />
        {errors.date && (
          <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
        )}
      </div>

      {/* Amount Input */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          المبلغ <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="number"
            id="amount"
            step="0.01"
            min="0"
            placeholder="0.00"
            {...register('amount')}
            className={`w-full px-4 py-3 border ${
              errors.amount ? 'border-red-500' : 'border-[var(--border-color)]'
            } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
            disabled={isSubmitting}
            dir="ltr"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-sm">
            IQD
          </div>
        </div>
        {errors.amount && (
          <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
        )}
      </div>

      {/* Employee Name Input */}
      <div>
        <label htmlFor="employee_name" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          اسم الموظف <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="employee_name"
          placeholder="أدخل اسم الموظف"
          {...register('employee_name')}
          className={`w-full px-4 py-3 border ${
            errors.employee_name ? 'border-red-500' : 'border-[var(--border-color)]'
          } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
          disabled={isSubmitting}
        />
        {errors.employee_name && (
          <p className="mt-1 text-sm text-red-600">{errors.employee_name.message}</p>
        )}
      </div>

      {/* Notes Textarea (Optional) */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          ملاحظات
        </label>
        <textarea
          id="notes"
          rows={4}
          placeholder="أضف أي ملاحظات إضافية هنا..."
          {...register('notes')}
          className={`w-full px-4 py-3 border ${
            errors.notes ? 'border-red-500' : 'border-[var(--border-color)]'
          } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none`}
          disabled={isSubmitting}
        />
        {errors.notes && (
          <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || createTransaction.isPending}
          className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting || createTransaction.isPending ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 ml-3 h-5 w-5 text-white"
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
              جاري الإضافة...
            </span>
          ) : (
            'إضافة مصروف راتب'
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting || createTransaction.isPending}
            className="px-6 py-3 border border-[var(--border-color)] rounded-lg font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            إلغاء
          </button>
        )}
      </div>

      {/* Success Message (shown via toast in mutation) */}
      {createTransaction.isSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-green-600 ml-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-green-800 font-medium">تم إضافة مصروف الراتب بنجاح</p>
          </div>
        </div>
      )}
    </form>
  );
};

export default SalaryExpenseForm;
