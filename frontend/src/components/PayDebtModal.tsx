import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from './Modal';
import { usePayDebt } from '../hooks/useDebts';
import { FormInput } from '@/components/form/FormInput';
import { FormTextarea } from '@/components/form/FormTextarea';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Debt, PayDebtFormData } from '../types/debts.types';

/**
 * Zod Validation Schema for Pay Debt Form
 * All validation messages in Arabic
 */
const createPayDebtSchema = (maxAmount: number) =>
  z.object({
    amountPaid: z
      .string()
      .min(1, { message: 'المبلغ المدفوع مطلوب' })
      .refine(
        (val) => {
          const num = parseFloat(val);
          return !isNaN(num) && num > 0;
        },
        { message: 'المبلغ يجب أن يكون رقم أكبر من صفر' }
      )
      .refine(
        (val) => {
          const num = parseFloat(val);
          return num <= maxAmount;
        },
        { message: `المبلغ المدفوع لا يمكن أن يتجاوز المبلغ المتبقي (${maxAmount})` }
      ),
    paymentDate: z.date({ message: 'تاريخ الدفع مطلوب' }),
    notes: z.string(),
  });

interface PayDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt | null;
}

/**
 * Pay Debt Modal Component
 *
 * Features:
 * - Display debt details (creditor, original amount, remaining amount)
 * - Amount to pay input (validate <= remaining amount)
 * - Payment date (default: today)
 * - Optional notes
 * - Submit button
 * - Real-time validation
 * - Loading state on submit
 * - Error handling
 * - Arabic interface
 */
export const PayDebtModal = ({ isOpen, onClose, debt }: PayDebtModalProps) => {
  const payDebt = usePayDebt();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PayDebtFormData>({
    resolver: debt ? zodResolver(createPayDebtSchema(debt.remainingAmount)) : undefined,
    defaultValues: {
      amountPaid: '',
      paymentDate: new Date(),
      notes: '',
    },
  });

  const onSubmit = async (data: PayDebtFormData) => {
    if (!debt) return;

    try {
      // Convert form data to API format
      const paymentData = {
        amountPaid: parseFloat(data.amountPaid),
        paymentDate: data.paymentDate.toISOString().split('T')[0], // Format: YYYY-MM-DD
        notes: data.notes || undefined,
      };

      await payDebt.mutateAsync({ debtId: debt.id, data: paymentData });

      // Reset form and close modal on success
      reset({
        amountPaid: '',
        paymentDate: new Date(),
        notes: '',
      });
      onClose();
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Failed to pay debt:', error);
    }
  };

  const handleClose = () => {
    reset({
      amountPaid: '',
      paymentDate: new Date(),
      notes: '',
    });
    onClose();
  };

  if (!debt) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="دفع دين" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Debt Details Card */}
        <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">تفاصيل الدين</h3>

          <div className="grid grid-cols-2 gap-3">
            {/* Creditor Name */}
            <div>
              <p className="text-xs text-[var(--text-secondary)]">اسم الدائن</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">{debt.creditorName}</p>
            </div>

            {/* Status */}
            <div>
              <p className="text-xs text-[var(--text-secondary)]">الحالة</p>
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  debt.status === 'PAID'
                    ? 'bg-green-100 text-green-800'
                    : debt.status === 'PARTIAL'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {debt.status === 'PAID'
                  ? 'مدفوع'
                  : debt.status === 'PARTIAL'
                  ? 'مدفوع جزئياً'
                  : 'نشط'}
              </span>
            </div>

            {/* Original Amount */}
            <div>
              <p className="text-xs text-[var(--text-secondary)]">المبلغ الأصلي</p>
              <p className="text-sm font-medium text-[var(--text-primary)]" dir="ltr">
                ${debt.originalAmount.toLocaleString()}
              </p>
            </div>

            {/* Remaining Amount */}
            <div>
              <p className="text-xs text-[var(--text-secondary)]">المبلغ المتبقي</p>
              <p className="text-sm font-bold text-red-600" dir="ltr">
                ${debt.remainingAmount.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Due Date */}
          {debt.dueDate && (
            <div className="pt-2 border-t border-[var(--border-color)]">
              <p className="text-xs text-[var(--text-secondary)]">تاريخ الاستحقاق</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {new Date(debt.dueDate).toLocaleDateString('ar-SA')}
              </p>
            </div>
          )}
        </div>

        {/* Amount to Pay Input */}
        <div>
          <FormInput
            name="amountPaid"
            label="المبلغ المراد دفعه"
            type="number"
            register={register}
            error={errors.amountPaid}
            required
            disabled={isSubmitting}
            placeholder="0.00"
            step="0.01"
            min="0"
            max={debt.remainingAmount}
          />
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            الحد الأقصى: ${debt.remainingAmount.toLocaleString()}
          </p>
        </div>

        {/* Payment Date Picker */}
        <div>
          <label htmlFor="paymentDate" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            تاريخ الدفع <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="paymentDate"
            {...register('paymentDate', {
              valueAsDate: true,
            })}
            defaultValue={new Date().toISOString().split('T')[0]}
            className={`w-full px-4 py-3 border ${
              errors.paymentDate ? 'border-red-500' : 'border-[var(--border-color)]'
            } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
            disabled={isSubmitting}
          />
          {errors.paymentDate && (
            <p className="mt-1 text-sm text-red-600">{errors.paymentDate.message}</p>
          )}
        </div>

        <FormTextarea
          name="notes"
          label="ملاحظات"
          register={register}
          error={errors.notes}
          disabled={isSubmitting}
          placeholder="أضف أي ملاحظات إضافية هنا..."
          rows={3}
        />

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || payDebt.isPending}
            className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {(isSubmitting || payDebt.isPending) && (
              <LoadingSpinner size="sm" color="white" />
            )}
            {isSubmitting || payDebt.isPending ? 'جاري الدفع...' : 'دفع الدين'}
          </button>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting || payDebt.isPending}
            className="px-6 py-3 border border-[var(--border-color)] rounded-lg font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            إلغاء
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PayDebtModal;
