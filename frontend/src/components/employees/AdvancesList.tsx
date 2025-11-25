/**
 * AdvancesList Component
 * Displays list of employee advances with status and allows deductions
 *
 * Features:
 * - Shows all advances with status badges
 * - Displays deduction history per advance
 * - Allows recording new deductions
 * - Shows summary (total, paid, remaining)
 * - Cancel advance option (if no deductions made)
 */

import { useState } from 'react';
import { useEmployeeAdvances, useRecordAdvanceDeduction, useCancelAdvance } from '@/hooks/useEmployees';
import { formatCurrency, formatDate } from '@/utils/format';
import { AdvanceStatus } from '@/types/enum';
import type { EmployeeAdvance, RecordDeductionInput } from '@/types';
import { Modal } from '@/components/Modal';
import { DateInput } from '@/components/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface AdvancesListProps {
  employeeId: string;
  employeeName: string;
}

const deductionSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'مبلغ الخصم يجب أن يكون رقم' })
    .positive({ message: 'مبلغ الخصم يجب أن يكون رقم موجب' }),
  deductionDate: z.string().min(1, { message: 'تاريخ الخصم مطلوب' }),
  notes: z.string().max(500, { message: 'الملاحظات يجب ألا تتجاوز 500 حرف' }).optional(),
});

type DeductionFormData = z.infer<typeof deductionSchema>;

export const AdvancesList: React.FC<AdvancesListProps> = ({
  employeeId,
  employeeName,
}) => {
  const { data, isLoading, error } = useEmployeeAdvances(employeeId);
  const recordDeduction = useRecordAdvanceDeduction();
  const cancelAdvance = useCancelAdvance();

  const [selectedAdvance, setSelectedAdvance] = useState<EmployeeAdvance | null>(null);
  const [isDeductionDialogOpen, setIsDeductionDialogOpen] = useState(false);
  const [expandedAdvance, setExpandedAdvance] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<DeductionFormData>({
    resolver: zodResolver(deductionSchema),
    defaultValues: {
      amount: 0,
      deductionDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const handleOpenDeductionDialog = (advance: EmployeeAdvance) => {
    setSelectedAdvance(advance);
    // Default to monthly deduction amount or remaining amount, whichever is smaller
    const defaultAmount = Math.min(advance.monthlyDeduction, advance.remainingAmount);
    setValue('amount', defaultAmount);
    setIsDeductionDialogOpen(true);
  };

  const handleCloseDeductionDialog = () => {
    setSelectedAdvance(null);
    setIsDeductionDialogOpen(false);
    reset();
  };

  const handleDeductionSubmit = async (formData: DeductionFormData) => {
    if (!selectedAdvance) return;

    const deductionData: RecordDeductionInput & { employeeId: string } = {
      employeeId,
      advanceId: selectedAdvance.id,
      amount: Number(formData.amount),
      deductionDate: formData.deductionDate,
      notes: formData.notes || undefined,
    };

    await recordDeduction.mutateAsync(deductionData);
    handleCloseDeductionDialog();
  };

  const handleCancelAdvance = async (advance: EmployeeAdvance) => {
    if (advance.deductions && advance.deductions.length > 0) {
      return; // Can't cancel if deductions exist
    }

    if (window.confirm('هل أنت متأكد من إلغاء هذه السلفة؟')) {
      await cancelAdvance.mutateAsync({
        advanceId: advance.id,
        employeeId,
      });
    }
  };

  const getStatusBadge = (status: AdvanceStatus) => {
    const styles = {
      [AdvanceStatus.ACTIVE]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      [AdvanceStatus.PAID]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      [AdvanceStatus.CANCELLED]: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    };
    const labels = {
      [AdvanceStatus.ACTIVE]: 'نشطة',
      [AdvanceStatus.PAID]: 'مسددة',
      [AdvanceStatus.CANCELLED]: 'ملغاة',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-[var(--bg-tertiary)] rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center py-4">
        حدث خطأ في تحميل السلف
      </div>
    );
  }

  if (!data || data.advances.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-secondary)]">
        لا توجد سلف مسجلة لهذا الموظف
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)]">
        <h4 className="font-medium text-[var(--text-primary)] mb-3">ملخص السلف</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-[var(--text-secondary)]">إجمالي السلف</p>
            <p className="text-lg font-bold text-[var(--text-primary)]">
              {formatCurrency(data.summary.totalAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-secondary)]">المبلغ المسدد</p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(data.summary.paidAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-secondary)]">المبلغ المتبقي</p>
            <p className="text-lg font-bold text-amber-600">
              {formatCurrency(data.summary.remainingAmount)}
            </p>
          </div>
        </div>
        {data.summary.activeCount > 0 && (
          <p className="mt-3 text-xs text-[var(--text-secondary)]">
            عدد السلف النشطة: {data.summary.activeCount}
          </p>
        )}
      </div>

      {/* Advances List */}
      <div className="space-y-4">
        {data.advances.map((advance) => (
          <div
            key={advance.id}
            className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] overflow-hidden"
          >
            {/* Advance Header */}
            <div
              className="p-4 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
              onClick={() => setExpandedAdvance(expandedAdvance === advance.id ? null : advance.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusBadge(advance.status)}
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">
                      {formatCurrency(advance.amount)}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {formatDate(advance.advanceDate)}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm text-[var(--text-secondary)]">المتبقي</p>
                  <p className="font-medium text-amber-600">
                    {formatCurrency(advance.remainingAmount)}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${((advance.amount - advance.remainingAmount) / advance.amount) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-[var(--text-secondary)]">
                    الخصم الشهري: {formatCurrency(advance.monthlyDeduction)}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {Math.round(((advance.amount - advance.remainingAmount) / advance.amount) * 100)}%
                  </span>
                </div>
              </div>

              {advance.reason && (
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  السبب: {advance.reason}
                </p>
              )}

              {/* Warning Badge */}
              {advance.exceedsTwoMonthsSalary && (
                <span className="mt-2 inline-block px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded text-xs">
                  تتجاوز راتب شهرين
                </span>
              )}
            </div>

            {/* Expanded Details */}
            {expandedAdvance === advance.id && (
              <div className="border-t border-[var(--border-color)] p-4 bg-[var(--bg-tertiary)]">
                {/* Actions */}
                {advance.status === AdvanceStatus.ACTIVE && (
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => handleOpenDeductionDialog(advance)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
                    >
                      تسجيل خصم
                    </button>
                    {(!advance.deductions || advance.deductions.length === 0) && (
                      <button
                        onClick={() => handleCancelAdvance(advance)}
                        disabled={cancelAdvance.isPending}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        إلغاء السلفة
                      </button>
                    )}
                  </div>
                )}

                {/* Deductions History */}
                <div>
                  <h5 className="font-medium text-[var(--text-primary)] mb-2">سجل الخصومات</h5>
                  {advance.deductions && advance.deductions.length > 0 ? (
                    <div className="space-y-2">
                      {advance.deductions.map((deduction) => (
                        <div
                          key={deduction.id}
                          className="flex items-center justify-between p-2 bg-[var(--bg-secondary)] rounded"
                        >
                          <div>
                            <p className="text-sm font-medium text-[var(--text-primary)]">
                              {formatCurrency(deduction.amount)}
                            </p>
                            {deduction.notes && (
                              <p className="text-xs text-[var(--text-secondary)]">{deduction.notes}</p>
                            )}
                          </div>
                          <p className="text-xs text-[var(--text-secondary)]">
                            {formatDate(deduction.deductionDate)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--text-secondary)]">لا توجد خصومات مسجلة</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Deduction Modal */}
      <Modal
        isOpen={isDeductionDialogOpen}
        onClose={handleCloseDeductionDialog}
        title={`تسجيل خصم من السلفة - ${employeeName}`}
        size="md"
      >
        <form onSubmit={handleSubmit(handleDeductionSubmit)} className="space-y-4">
          {selectedAdvance && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                المبلغ المتبقي من السلفة: <strong>{formatCurrency(selectedAdvance.remainingAmount)}</strong>
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                الخصم الشهري المعتاد: {formatCurrency(selectedAdvance.monthlyDeduction)}
              </p>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              مبلغ الخصم <span className="text-red-500">*</span>
            </label>
            <input
              {...register('amount', { valueAsNumber: true })}
              type="number"
              step="1"
              min="0"
              max={selectedAdvance?.remainingAmount}
              disabled={recordDeduction.isPending}
              className={`w-full px-4 py-3 border ${
                errors.amount ? 'border-red-500' : 'border-[var(--border-color)]'
              } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed`}
              placeholder="0"
            />
            {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
          </div>

          {/* Deduction Date */}
          <DateInput
            mode="form"
            name="deductionDate"
            label="تاريخ الخصم"
            register={register}
            error={errors.deductionDate}
            required
            disabled={recordDeduction.isPending}
            max={new Date().toISOString().split('T')[0]}
          />

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              ملاحظات (اختياري)
            </label>
            <textarea
              {...register('notes')}
              disabled={recordDeduction.isPending}
              rows={2}
              className={`w-full px-4 py-3 border ${
                errors.notes ? 'border-red-500' : 'border-[var(--border-color)]'
              } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed resize-none`}
              placeholder="مثال: خصم شهر نوفمبر"
            />
            {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>}
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={recordDeduction.isPending}
              className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {recordDeduction.isPending ? 'جاري التسجيل...' : 'تسجيل الخصم'}
            </button>
            <button
              type="button"
              onClick={handleCloseDeductionDialog}
              disabled={recordDeduction.isPending}
              className="flex-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] px-6 py-3 rounded-lg font-medium hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إلغاء
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdvancesList;
