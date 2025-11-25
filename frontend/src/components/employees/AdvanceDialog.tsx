/**
 * AdvanceDialog Component
 * Dialog for creating new employee advances (سلفة)
 *
 * Features:
 * - Create new advance with amount, monthly deduction, date, reason
 * - Shows warning if advance exceeds 2 months salary
 * - Arabic labels and validation messages
 * - Loading state during submission
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/Modal';
import { DateInput } from '@/components/form';
import { useCreateAdvance } from '@/hooks/useEmployees';
import type { CreateAdvanceInput } from '@/types';
import { formatCurrency } from '@/utils/format';

const advanceSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'مبلغ السلفة يجب أن يكون رقم' })
    .positive({ message: 'مبلغ السلفة يجب أن يكون رقم موجب' })
    .max(999999999, { message: 'المبلغ كبير جداً' }),
  monthlyDeduction: z
    .number({ invalid_type_error: 'مبلغ الخصم الشهري يجب أن يكون رقم' })
    .positive({ message: 'مبلغ الخصم الشهري يجب أن يكون رقم موجب' })
    .max(999999999, { message: 'المبلغ كبير جداً' }),
  advanceDate: z.string().min(1, { message: 'تاريخ السلفة مطلوب' }),
  reason: z.string().max(500, { message: 'السبب يجب ألا يتجاوز 500 حرف' }).optional(),
});

type AdvanceFormData = z.infer<typeof advanceSchema>;

interface AdvanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  baseSalary: number;
  allowance: number;
}

export const AdvanceDialog: React.FC<AdvanceDialogProps> = ({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  baseSalary,
  allowance,
}) => {
  const createAdvance = useCreateAdvance();
  const totalSalary = baseSalary + allowance;
  const twoMonthsSalary = totalSalary * 2;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<AdvanceFormData>({
    resolver: zodResolver(advanceSchema),
    defaultValues: {
      amount: 0,
      monthlyDeduction: 0,
      advanceDate: new Date().toISOString().split('T')[0],
      reason: '',
    },
  });

  const watchedAmount = watch('amount');
  const watchedMonthlyDeduction = watch('monthlyDeduction');
  const exceedsTwoMonths = watchedAmount > twoMonthsSalary;
  const estimatedMonths = watchedMonthlyDeduction > 0
    ? Math.ceil(watchedAmount / watchedMonthlyDeduction)
    : 0;

  const handleFormSubmit = async (data: AdvanceFormData) => {
    const advanceData: CreateAdvanceInput = {
      employeeId,
      amount: Number(data.amount),
      monthlyDeduction: Number(data.monthlyDeduction),
      advanceDate: data.advanceDate,
      reason: data.reason || undefined,
    };

    await createAdvance.mutateAsync(advanceData);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`تسجيل سلفة جديدة - ${employeeName}`}
      size="md"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            مبلغ السلفة <span className="text-red-500">*</span>
          </label>
          <input
            {...register('amount', { valueAsNumber: true })}
            type="number"
            step="1"
            min="0"
            disabled={createAdvance.isPending}
            className={`w-full px-4 py-3 border ${
              errors.amount ? 'border-red-500' : 'border-[var(--border-color)]'
            } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed`}
            placeholder="0"
          />
          {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
        </div>

        {/* Monthly Deduction */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            مبلغ الخصم الشهري <span className="text-red-500">*</span>
          </label>
          <input
            {...register('monthlyDeduction', { valueAsNumber: true })}
            type="number"
            step="1"
            min="0"
            disabled={createAdvance.isPending}
            className={`w-full px-4 py-3 border ${
              errors.monthlyDeduction ? 'border-red-500' : 'border-[var(--border-color)]'
            } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed`}
            placeholder="0"
          />
          {errors.monthlyDeduction && (
            <p className="mt-1 text-sm text-red-600">{errors.monthlyDeduction.message}</p>
          )}
          {estimatedMonths > 0 && (
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              عدد الأشهر المتوقعة للسداد: {estimatedMonths} شهر
            </p>
          )}
        </div>

        {/* Advance Date */}
        <DateInput
          mode="form"
          name="advanceDate"
          label="تاريخ السلفة"
          register={register}
          error={errors.advanceDate}
          required
          disabled={createAdvance.isPending}
          max={new Date().toISOString().split('T')[0]}
        />

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            السبب (اختياري)
          </label>
          <textarea
            {...register('reason')}
            disabled={createAdvance.isPending}
            rows={3}
            className={`w-full px-4 py-3 border ${
              errors.reason ? 'border-red-500' : 'border-[var(--border-color)]'
            } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed resize-none`}
            placeholder="مثال: سلفة شخصية، مصاريف طبية..."
          />
          {errors.reason && <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>}
        </div>

        {/* Salary Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>معلومات الراتب:</strong>
          </p>
          <div className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-300">
            <p>الراتب الشهري: {formatCurrency(totalSalary)}</p>
            <p>قيمة راتب شهرين: {formatCurrency(twoMonthsSalary)}</p>
          </div>
        </div>

        {/* Warning if exceeds 2 months */}
        {exceedsTwoMonths && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
              تحذير: مبلغ السلفة يتجاوز راتب شهرين!
            </p>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              الفرق: {formatCurrency(watchedAmount - twoMonthsSalary)}
            </p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={createAdvance.isPending}
            className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createAdvance.isPending ? 'جاري التسجيل...' : 'تسجيل السلفة'}
          </button>
          <button
            type="button"
            onClick={handleClose}
            disabled={createAdvance.isPending}
            className="flex-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] px-6 py-3 rounded-lg font-medium hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إلغاء
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AdvanceDialog;
