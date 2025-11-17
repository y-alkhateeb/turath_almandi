import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateDebt } from '../hooks/useDebts';
import type { DebtFormData } from '../types/debts.types';
import { useAuth } from '../hooks/useAuth';
import { FormInput } from '@/components/form/FormInput';
import { FormTextarea } from '@/components/form/FormTextarea';
import { BranchSelector } from '@/components/form/BranchSelector';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';

/**
 * Zod Validation Schema for Debt Form
 * All validation messages in Arabic
 * Matches backend validation rules: amount >= 0.01, dueDate >= date
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
          return !isNaN(num) && num >= 0.01;
        },
        { message: 'المبلغ يجب أن يكون 0.01 على الأقل' }
      ),
    date: z.date({ message: 'التاريخ مطلوب' }),
    dueDate: z.date({ message: 'تاريخ الاستحقاق مطلوب' }),
    notes: z.string(),
    branchId: z.string().optional(),
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
  const { user, isAdmin } = useAuth();
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
      branchId: isAdmin() ? '' : user?.branchId,
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
        branchId: data.branchId,
      };

      await createDebt.mutateAsync(debtData);

      // Reset form on success
      reset({
        creditorName: '',
        amount: '',
        date: new Date(),
        dueDate: new Date(),
        notes: '',
        branchId: isAdmin() ? '' : user?.branchId,
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
      {/* Branch Selection using reusable BranchSelector component */}
      <BranchSelector
        name="branchId"
        register={register}
        error={errors.branchId}
        required
      />

      <FormInput
        name="creditorName"
        label="اسم الدائن"
        register={register}
        error={errors.creditorName}
        required
        disabled={isSubmitting}
        placeholder="أدخل اسم الدائن"
      />

      <FormInput
        name="amount"
        label="المبلغ"
        type="number"
        register={register}
        error={errors.amount}
        required
        disabled={isSubmitting}
        placeholder="0.00"
        step="0.01"
        min="0"
      />

      {/* Date Picker - Note: Uses valueAsDate for Date object conversion */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
          التاريخ <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="date"
          {...register('date', { valueAsDate: true })}
          defaultValue={new Date().toISOString().split('T')[0]}
          className={`w-full px-4 py-3 border ${
            errors.date ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
          disabled={isSubmitting}
        />
        {errors.date && (
          <p className="mt-2 text-sm text-red-600">{errors.date.message}</p>
        )}
      </div>

      {/* Due Date Picker - Note: Uses valueAsDate for Date object conversion */}
      <div>
        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
          تاريخ الاستحقاق <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="dueDate"
          {...register('dueDate', { valueAsDate: true })}
          defaultValue={new Date().toISOString().split('T')[0]}
          className={`w-full px-4 py-3 border ${
            errors.dueDate ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
          disabled={isSubmitting}
        />
        {errors.dueDate && (
          <p className="mt-2 text-sm text-red-600">{errors.dueDate.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          تاريخ الاستحقاق يجب أن يكون أكبر من أو يساوي التاريخ
        </p>
      </div>

      <FormTextarea
        name="notes"
        label="ملاحظات"
        register={register}
        error={errors.notes}
        disabled={isSubmitting}
        placeholder="أضف أي ملاحظات إضافية هنا..."
        rows={4}
      />

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || createDebt.isPending}
          className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {(isSubmitting || createDebt.isPending) && (
            <LoadingSpinner size="sm" color="white" />
          )}
          {isSubmitting || createDebt.isPending ? 'جاري الإضافة...' : 'إضافة دين'}
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

      {/* Success Message */}
      {createDebt.isSuccess && (
        <Alert variant="success">تم إضافة الدين بنجاح</Alert>
      )}
    </form>
  );
};

export default DebtForm;
