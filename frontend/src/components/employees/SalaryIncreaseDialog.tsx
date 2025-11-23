import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/Dialog';
import { DateInput } from '@/components/form';
import { useRecordSalaryIncrease } from '@/hooks/useEmployees';
import type { CreateSalaryIncreaseInput } from '@/types';

const salaryIncreaseSchema = z.object({
  newSalary: z
    .number({ invalid_type_error: 'الراتب الجديد يجب أن يكون رقم' })
    .positive({ message: 'الراتب الجديد يجب أن يكون رقم موجب' })
    .max(999999999, { message: 'الراتب الجديد كبير جداً' }),
  effectiveDate: z.string().min(1, { message: 'تاريخ السريان مطلوب' }),
  reason: z
    .string()
    .min(2, { message: 'السبب يجب أن يكون حرفين على الأقل' })
    .max(200, { message: 'السبب يجب ألا يتجاوز 200 حرف' })
    .optional(),
});

type SalaryIncreaseFormData = z.infer<typeof salaryIncreaseSchema>;

interface SalaryIncreaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  currentSalary: number;
}

export const SalaryIncreaseDialog: React.FC<SalaryIncreaseDialogProps> = ({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  currentSalary,
}) => {
  const recordIncrease = useRecordSalaryIncrease();
  const [newSalary, setNewSalary] = useState<number>(currentSalary);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<SalaryIncreaseFormData>({
    resolver: zodResolver(salaryIncreaseSchema),
    defaultValues: {
      newSalary: currentSalary,
      effectiveDate: new Date().toISOString().split('T')[0],
      reason: '',
    },
  });

  const watchNewSalary = watch('newSalary');

  const handleFormSubmit = async (data: SalaryIncreaseFormData) => {
    const increaseData: CreateSalaryIncreaseInput = {
      previousSalary: currentSalary,
      newSalary: Number(data.newSalary),
      effectiveDate: data.effectiveDate,
      reason: data.reason || null,
    };

    await recordIncrease.mutateAsync({ employeeId, data: increaseData });
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    setNewSalary(currentSalary);
    onClose();
  };

  // Calculate increase amount and percentage
  const increaseAmount = Number(watchNewSalary || currentSalary) - Number(currentSalary);
  const increasePercentage = Number(currentSalary) > 0 ? (increaseAmount / Number(currentSalary)) * 100 : 0;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="تسجيل زيادة راتب"
      description={`تسجيل زيادة راتب للموظف: ${employeeName}`}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Current Salary Display */}
        <div className="bg-gray-50 dark:bg-gray-800 border border-[var(--border-color)] rounded-lg p-4">
          <div className="text-sm text-[var(--text-secondary)] mb-1">الراتب الحالي</div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {currentSalary.toLocaleString()}
          </div>
        </div>

        {/* New Salary */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            الراتب الجديد <span className="text-red-500">*</span>
          </label>
          <input
            {...register('newSalary', {
              valueAsNumber: true,
              onChange: (e) => setNewSalary(Number(e.target.value)),
            })}
            type="number"
            step="0.01"
            min={currentSalary}
            disabled={recordIncrease.isPending}
            className={`w-full px-4 py-3 border ${
              errors.newSalary ? 'border-red-500' : 'border-[var(--border-color)]'
            } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed`}
            placeholder="0.00"
          />
          {errors.newSalary && (
            <p className="mt-1 text-sm text-red-600">{errors.newSalary.message}</p>
          )}
        </div>

        {/* Increase Summary */}
        {increaseAmount !== 0 && (
          <div
            className={`rounded-lg p-4 border ${
              increaseAmount > 0
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">مقدار الزيادة:</span>
              <span
                className={`text-lg font-bold ${
                  increaseAmount > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {increaseAmount > 0 ? '+' : ''}
                {increaseAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-medium">النسبة المئوية:</span>
              <span
                className={`text-lg font-bold ${
                  increaseAmount > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {increaseAmount > 0 ? '+' : ''}
                {increasePercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* Effective Date */}
        <DateInput
          mode="form"
          name="effectiveDate"
          label="تاريخ السريان"
          register={register}
          error={errors.effectiveDate}
          required
          disabled={recordIncrease.isPending}
          max={new Date().toISOString().split('T')[0]}
        />

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            سبب الزيادة
          </label>
          <input
            {...register('reason')}
            type="text"
            disabled={recordIncrease.isPending}
            className={`w-full px-4 py-3 border ${
              errors.reason ? 'border-red-500' : 'border-[var(--border-color)]'
            } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed`}
            placeholder="مثال: ترقية، تقييم سنوي، زيادة أداء"
          />
          {errors.reason && <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>ملاحظة:</strong> سيتم تحديث الراتب الأساسي للموظف فوراً بعد حفظ هذه الزيادة.
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={recordIncrease.isPending || increaseAmount <= 0}
            className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {recordIncrease.isPending ? 'جاري التسجيل...' : 'تسجيل الزيادة'}
          </button>
          <button
            type="button"
            onClick={handleClose}
            disabled={recordIncrease.isPending}
            className="flex-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] px-6 py-3 rounded-lg font-medium hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إلغاء
          </button>
        </div>
      </form>
    </Dialog>
  );
};
