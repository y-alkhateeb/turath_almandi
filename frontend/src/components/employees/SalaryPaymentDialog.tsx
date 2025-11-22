import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/Dialog';
import { useRecordSalaryPayment } from '@/hooks/useEmployees';
import type { CreateSalaryPaymentInput } from '@/types';

const salaryPaymentSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'المبلغ يجب أن يكون رقم' })
    .positive({ message: 'المبلغ يجب أن يكون رقم موجب' })
    .max(999999999, { message: 'المبلغ كبير جداً' }),
  paymentDate: z.string().min(1, { message: 'تاريخ الدفع مطلوب' }),
  notes: z.string().max(500, { message: 'الملاحظات يجب ألا تتجاوز 500 حرف' }).optional(),
});

type SalaryPaymentFormData = z.infer<typeof salaryPaymentSchema>;

interface SalaryPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  currentSalary: number;
}

export const SalaryPaymentDialog: React.FC<SalaryPaymentDialogProps> = ({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  currentSalary,
}) => {
  const recordPayment = useRecordSalaryPayment();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SalaryPaymentFormData>({
    resolver: zodResolver(salaryPaymentSchema),
    defaultValues: {
      amount: currentSalary,
      paymentDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const handleFormSubmit = async (data: SalaryPaymentFormData) => {
    const paymentData: CreateSalaryPaymentInput = {
      amount: Number(data.amount),
      paymentDate: data.paymentDate,
      notes: data.notes || null,
    };

    await recordPayment.mutateAsync({ employeeId, data: paymentData });
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="تسجيل دفع راتب"
      description={`تسجيل دفعة راتب للموظف: ${employeeName}`}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            المبلغ المدفوع <span className="text-red-500">*</span>
          </label>
          <input
            {...register('amount', { valueAsNumber: true })}
            type="number"
            step="0.01"
            min="0"
            disabled={recordPayment.isPending}
            className={`w-full px-4 py-3 border ${
              errors.amount ? 'border-red-500' : 'border-[var(--border-color)]'
            } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed`}
            placeholder="0.00"
          />
          {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            الراتب الحالي: {currentSalary.toLocaleString()}
          </p>
        </div>

        {/* Payment Date */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            تاريخ الدفع <span className="text-red-500">*</span>
          </label>
          <input
            {...register('paymentDate')}
            type="date"
            disabled={recordPayment.isPending}
            max={new Date().toISOString().split('T')[0]}
            className={`w-full px-4 py-3 border ${
              errors.paymentDate ? 'border-red-500' : 'border-[var(--border-color)]'
            } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed`}
          />
          {errors.paymentDate && (
            <p className="mt-1 text-sm text-red-600">{errors.paymentDate.message}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            ملاحظات
          </label>
          <textarea
            {...register('notes')}
            disabled={recordPayment.isPending}
            rows={3}
            className={`w-full px-4 py-3 border ${
              errors.notes ? 'border-red-500' : 'border-[var(--border-color)]'
            } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed resize-none`}
            placeholder="مثال: راتب شهر نوفمبر 2025"
          />
          {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>ملاحظة:</strong> سيتم إنشاء معاملة مالية تلقائياً (مصروف) لهذه الدفعة.
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={recordPayment.isPending}
            className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {recordPayment.isPending ? 'جاري التسجيل...' : 'تسجيل الدفع'}
          </button>
          <button
            type="button"
            onClick={handleClose}
            disabled={recordPayment.isPending}
            className="flex-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] px-6 py-3 rounded-lg font-medium hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إلغاء
          </button>
        </div>
      </form>
    </Dialog>
  );
};
