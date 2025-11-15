import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateDebt } from '../hooks/useDebts';
import type { DebtFormData } from '../types/debts.types';
import { useAuth } from '../hooks/useAuth';

/**
 * Zod Validation Schema for Debt Form
 * All validation messages in Arabic
 */
const debtSchema = z
  .object({
    creditorName: z.string().min(1, { message: 'اسم الدائن مطلوب' }),
    amount: z
      .string()
      .min(1, { message: 'المبلغ مطلوب' })
      .refine(
        (val) => {
          const num = parseFloat(val);
          return !isNaN(num) && num > 0;
        },
        { message: 'المبلغ يجب أن يكون رقم أكبر من صفر' }
      ),
    date: z.date({ message: 'التاريخ مطلوب' }),
    dueDate: z.date({ message: 'تاريخ الاستحقاق مطلوب' }),
    notes: z.string(),
  })
  .refine((data) => data.dueDate >= data.date, {
    message: 'تاريخ الاستحقاق يجب أن يكون أكبر من أو يساوي التاريخ',
    path: ['dueDate'],
  });

interface DebtFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Debt Form Component
 *
 * Features:
 * - Creditor name input (required)
 * - Amount validation (> 0, required)
 * - Date picker with default to today
 * - Due date picker (required, must be >= date)
 * - Optional notes textarea
 * - Auto-filled branch from user (read-only for accountant)
 * - Real-time validation
 * - Loading state on submit
 * - Success message and form reset
 * - Error handling
 * - Arabic interface
 */
export const DebtForm = ({ onSuccess, onCancel }: DebtFormProps) => {
  const { user } = useAuth();
  const createDebt = useCreateDebt();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<DebtFormData>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      creditorName: '',
      amount: '',
      date: new Date(),
      dueDate: new Date(),
      notes: '',
    },
  });

  const onSubmit = async (data: DebtFormData) => {
    try {
      // Convert form data to API format
      const debtData = {
        creditorName: data.creditorName,
        amount: parseFloat(data.amount),
        date: data.date.toISOString().split('T')[0], // Format: YYYY-MM-DD
        dueDate: data.dueDate.toISOString().split('T')[0], // Format: YYYY-MM-DD
        notes: data.notes || undefined,
      };

      await createDebt.mutateAsync(debtData);

      // Reset form on success
      reset({
        creditorName: '',
        amount: '',
        date: new Date(),
        dueDate: new Date(),
        notes: '',
      });

      // Call success callback if provided
      onSuccess?.();
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Failed to create debt:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Branch Display (Read-only) */}
      {user?.branch && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الفرع
          </label>
          <div className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-600">
            {user.branch.name}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            يتم تعبئة الفرع تلقائيًا من حسابك
          </p>
        </div>
      )}

      {/* Creditor Name Input */}
      <div>
        <label htmlFor="creditorName" className="block text-sm font-medium text-gray-700 mb-2">
          اسم الدائن <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="creditorName"
          placeholder="أدخل اسم الدائن"
          {...register('creditorName')}
          className={`w-full px-4 py-3 border ${
            errors.creditorName ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
          disabled={isSubmitting}
        />
        {errors.creditorName && (
          <p className="mt-1 text-sm text-red-600">{errors.creditorName.message}</p>
        )}
      </div>

      {/* Amount Input */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
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
              errors.amount ? 'border-red-500' : 'border-gray-300'
            } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
            disabled={isSubmitting}
            dir="ltr"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
            USD
          </div>
        </div>
        {errors.amount && (
          <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
        )}
      </div>

      {/* Date Picker */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
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
            errors.date ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
          disabled={isSubmitting}
        />
        {errors.date && (
          <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
        )}
      </div>

      {/* Due Date Picker */}
      <div>
        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
          تاريخ الاستحقاق <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="dueDate"
          {...register('dueDate', {
            valueAsDate: true,
          })}
          defaultValue={new Date().toISOString().split('T')[0]}
          className={`w-full px-4 py-3 border ${
            errors.dueDate ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
          disabled={isSubmitting}
        />
        {errors.dueDate && (
          <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          تاريخ الاستحقاق يجب أن يكون أكبر من أو يساوي التاريخ
        </p>
      </div>

      {/* Notes Textarea (Optional) */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          ملاحظات
        </label>
        <textarea
          id="notes"
          rows={4}
          placeholder="أضف أي ملاحظات إضافية هنا..."
          {...register('notes')}
          className={`w-full px-4 py-3 border ${
            errors.notes ? 'border-red-500' : 'border-gray-300'
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
          disabled={isSubmitting || createDebt.isPending}
          className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting || createDebt.isPending ? (
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
            'إضافة دين'
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting || createDebt.isPending}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            إلغاء
          </button>
        )}
      </div>

      {/* Success Message (shown via toast in mutation) */}
      {createDebt.isSuccess && (
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
            <p className="text-green-800 font-medium">تم إضافة الدين بنجاح</p>
          </div>
        </div>
      )}
    </form>
  );
};

export default DebtForm;
