import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DateInput } from '@/components/form';
import { useCreateTransaction } from '../hooks/useTransactions';
import { TransactionType, PaymentMethod } from '../types/transactions.types';
import type { IncomeFormData } from '../types/transactions.types';
import { useAuth } from '../hooks/useAuth';

/**
 * Zod Validation Schema for Income Form
 * All validation messages in Arabic
 * Matches backend validation rules: amount must be >= 0.01
 */
const incomeSchema = z.object({
  date: z.string().min(1, { message: 'التاريخ مطلوب' }),
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
  paymentMethod: z.nativeEnum(PaymentMethod, { message: 'طريقة الدفع مطلوبة' }),
  category: z.string(),
  notes: z.string(),
});

interface IncomeFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Income Form Component
 *
 * Features:
 * - Date picker with default to today
 * - Amount validation (> 0)
 * - Payment method radio buttons (نقدي / ماستر كارد)
 * - Optional category and notes
 * - Auto-filled branch from user (read-only for accountant)
 * - Real-time validation
 * - Loading state on submit
 * - Success message and form reset
 * - Error handling
 */
export const IncomeForm = ({ onSuccess, onCancel }: IncomeFormProps) => {
  const { user } = useAuth();
  const createTransaction = useCreateTransaction();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      amount: '',
      paymentMethod: PaymentMethod.CASH,
      category: '',
      notes: '',
    },
  });

  const selectedPaymentMethod = watch('paymentMethod');

  const onSubmit = async (data: IncomeFormData) => {
    try {
      // Convert form data to API format
      const transactionData = {
        type: TransactionType.INCOME,
        amount: parseFloat(data.amount),
        paymentMethod: data.paymentMethod,
        category: data.category || undefined,
        date: data.date, // Already in YYYY-MM-DD format
        notes: data.notes || undefined,
      };

      await createTransaction.mutateAsync(transactionData);

      // Reset form on success
      reset({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        paymentMethod: PaymentMethod.CASH,
        category: '',
        notes: '',
      });

      // Call success callback if provided
      onSuccess?.();
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Failed to create income transaction:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Branch Display (Read-only) */}
      {user?.branch && (
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

      {/* Date */}
      <DateInput
        mode="form"
        name="date"
        label="التاريخ"
        register={register}
        error={errors.date}
        required
        disabled={isSubmitting}
      />

      {/* Amount Input */}
      <div>
        <label
          htmlFor="amount"
          className="block text-sm font-medium text-[var(--text-primary)] mb-2"
        >
          المبلغ <span className="text-red-500">*</span>
        </label>
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
        {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
      </div>

      {/* Payment Method Radio Buttons */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
          طريقة الدفع <span className="text-red-500">*</span>
        </label>
        <div className="space-y-3">
          <label
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedPaymentMethod === PaymentMethod.CASH
                ? 'border-primary-500 bg-primary-50'
                : 'border-[var(--border-color)] hover:border-[var(--border-color)]'
            }`}
          >
            <input
              type="radio"
              value={PaymentMethod.CASH}
              {...register('paymentMethod')}
              className="w-5 h-5 text-primary-600 focus:ring-primary-500"
              disabled={isSubmitting}
            />
            <span className="mr-3 text-[var(--text-primary)] font-medium">نقدي</span>
          </label>

          <label
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedPaymentMethod === PaymentMethod.MASTER
                ? 'border-primary-500 bg-primary-50'
                : 'border-[var(--border-color)] hover:border-[var(--border-color)]'
            }`}
          >
            <input
              type="radio"
              value={PaymentMethod.MASTER}
              {...register('paymentMethod')}
              className="w-5 h-5 text-primary-600 focus:ring-primary-500"
              disabled={isSubmitting}
            />
            <span className="mr-3 text-[var(--text-primary)] font-medium">ماستر كارد</span>
          </label>
        </div>
        {errors.paymentMethod && (
          <p className="mt-1 text-sm text-red-600">{errors.paymentMethod.message}</p>
        )}
      </div>

      {/* Category Input (Optional) */}
      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-[var(--text-primary)] mb-2"
        >
          الفئة
        </label>
        <input
          type="text"
          id="category"
          placeholder="مثال: مبيعات، خدمات، إيجار..."
          {...register('category')}
          className={`w-full px-4 py-3 border ${
            errors.category ? 'border-red-500' : 'border-[var(--border-color)]'
          } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
          disabled={isSubmitting}
        />
        {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
      </div>

      {/* Notes Textarea (Optional) */}
      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-[var(--text-primary)] mb-2"
        >
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
        {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>}
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
            'إضافة إيراد'
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
            <svg className="w-5 h-5 text-green-600 ml-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-green-800 font-medium">تم إضافة الإيراد بنجاح</p>
          </div>
        </div>
      )}
    </form>
  );
};

export default IncomeForm;
