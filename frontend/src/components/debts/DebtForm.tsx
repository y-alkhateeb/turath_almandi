/**
 * DebtForm - Presentational Component
 * Form for creating debts with validation
 *
 * Features:
 * - react-hook-form with Zod validation
 * - Fields: creditorName, amount, currency, date, dueDate, notes, branchId
 * - Validation: dueDate >= date
 * - BranchSelector for admins
 * - Arabic labels and error messages
 * - Strict typing matching backend DTOs
 *
 * Uses FormField components with forwardRef for proper react-hook-form integration
 */

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BranchSelector, FormFieldInput, FormFieldTextarea, FormFieldDate } from '@/components/form';
import { useAuth } from '@/hooks/useAuth';
import type { CreateDebtInput } from '#/entity';

// ============================================
// ZOD VALIDATION SCHEMA
// ============================================

/**
 * Zod schema for creating a debt
 * Matches backend CreateDebtDto validation rules
 */
const createDebtSchema = z.object({
  creditorName: z
    .string()
    .min(1, { message: 'اسم الدائن مطلوب' })
    .max(200, { message: 'اسم الدائن يجب ألا يتجاوز 200 حرف' }),
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
  date: z.string().min(1, { message: 'تاريخ الدين مطلوب' }),
  dueDate: z.string().min(1, { message: 'تاريخ الاستحقاق مطلوب' }),
  notes: z.string().max(1000, { message: 'الملاحظات يجب ألا تتجاوز 1000 حرف' }).optional(),
  branchId: z.string().optional(),
}).refine(
  (data) => {
    // dueDate must be >= date
    if (!data.date || !data.dueDate) return true;
    return new Date(data.dueDate) >= new Date(data.date);
  },
  {
    message: 'تاريخ الاستحقاق يجب أن يكون بعد أو يساوي تاريخ الدين',
    path: ['dueDate'],
  }
);

type FormData = z.infer<typeof createDebtSchema>;

// ============================================
// TYPES
// ============================================

export interface DebtFormProps {
  mode: 'create';
  onSubmit: (data: CreateDebtInput) => Promise<void>;
  onCancel?: () => void;
  isSubmitting: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function DebtForm({ mode: _mode, onSubmit, onCancel, isSubmitting }: DebtFormProps) {
  const { user, isAdmin } = useAuth();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(createDebtSchema),
    defaultValues: {
      creditorName: '',
      amount: undefined,
      date: new Date().toISOString().split('T')[0], // Today
      dueDate: '',
      notes: '',
      branchId: isAdmin ? undefined : user?.branchId,
    },
  });

  const handleFormSubmit = async (data: FormData) => {
    try {
      const submitData: CreateDebtInput = {
        creditorName: data.creditorName,
        amount: data.amount,
        date: data.date,
        dueDate: data.dueDate,
        notes: data.notes || undefined,
        branchId: data.branchId,
      };
      await onSubmit(submitData);
      // Reset form after successful submission
      reset();
    } catch (error) {
      // Error handling is done by the parent component
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6" dir="rtl">
      {/* Creditor Name */}
      <FormFieldInput
        label="اسم الدائن"
        placeholder="أدخل اسم الدائن"
        error={errors.creditorName}
        required
        disabled={isSubmitting}
        {...register('creditorName')}
      />

      {/* Amount */}
      <FormFieldInput
        label="المبلغ"
        type="number"
        step="0.01"
        min="0.01"
        placeholder="أدخل المبلغ"
        error={errors.amount}
        required
        disabled={isSubmitting}
        {...register('amount')}
      />

      {/* Branch Selector - Only for admins */}
      {isAdmin && (
        <Controller
          name="branchId"
          control={control}
          render={({ field }) => (
            <BranchSelector
              value={field.value || null}
              onChange={(value) => field.onChange(value)}
              disabled={isSubmitting}
            />
          )}
        />
      )}

      {/* Branch Display - Read-only for accountants */}
      {!isAdmin && user?.branch && (
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

      {/* Debt Date */}
      <FormFieldDate
        label="تاريخ الدين"
        error={errors.date}
        required
        disabled={isSubmitting}
        {...register('date')}
      />

      {/* Due Date */}
      <FormFieldDate
        label="تاريخ الاستحقاق"
        error={errors.dueDate}
        required
        disabled={isSubmitting}
        {...register('dueDate')}
      />

      {/* Notes */}
      <FormFieldTextarea
        label="ملاحظات"
        rows={4}
        maxLength={1000}
        placeholder="أدخل ملاحظات إضافية (اختياري)"
        error={errors.notes}
        disabled={isSubmitting}
        {...register('notes')}
      />

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          {isSubmitting ? 'جاري الحفظ...' : 'إضافة الدين'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] px-6 py-3 rounded-lg font-medium hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إلغاء
          </button>
        )}
      </div>
    </form>
  );
}

export default DebtForm;
