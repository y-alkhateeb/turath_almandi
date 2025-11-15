import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from './Modal';
import { usePayDebt } from '../hooks/useDebts';
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
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">تفاصيل الدين</h3>

          <div className="grid grid-cols-2 gap-3">
            {/* Creditor Name */}
            <div>
              <p className="text-xs text-gray-500">اسم الدائن</p>
              <p className="text-sm font-medium text-gray-900">{debt.creditorName}</p>
            </div>

            {/* Status */}
            <div>
              <p className="text-xs text-gray-500">الحالة</p>
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
              <p className="text-xs text-gray-500">المبلغ الأصلي</p>
              <p className="text-sm font-medium text-gray-900" dir="ltr">
                ${debt.originalAmount.toLocaleString()}
              </p>
            </div>

            {/* Remaining Amount */}
            <div>
              <p className="text-xs text-gray-500">المبلغ المتبقي</p>
              <p className="text-sm font-bold text-red-600" dir="ltr">
                ${debt.remainingAmount.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Due Date */}
          {debt.dueDate && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">تاريخ الاستحقاق</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(debt.dueDate).toLocaleDateString('ar-SA')}
              </p>
            </div>
          )}
        </div>

        {/* Amount to Pay Input */}
        <div>
          <label htmlFor="amountPaid" className="block text-sm font-medium text-gray-700 mb-2">
            المبلغ المراد دفعه <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              id="amountPaid"
              step="0.01"
              min="0"
              max={debt.remainingAmount}
              placeholder="0.00"
              {...register('amountPaid')}
              className={`w-full px-4 py-3 border ${
                errors.amountPaid ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
              disabled={isSubmitting}
              dir="ltr"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              USD
            </div>
          </div>
          {errors.amountPaid && (
            <p className="mt-1 text-sm text-red-600">{errors.amountPaid.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            الحد الأقصى: ${debt.remainingAmount.toLocaleString()}
          </p>
        </div>

        {/* Payment Date Picker */}
        <div>
          <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-2">
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
              errors.paymentDate ? 'border-red-500' : 'border-gray-300'
            } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
            disabled={isSubmitting}
          />
          {errors.paymentDate && (
            <p className="mt-1 text-sm text-red-600">{errors.paymentDate.message}</p>
          )}
        </div>

        {/* Notes Textarea (Optional) */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            ملاحظات
          </label>
          <textarea
            id="notes"
            rows={3}
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
            disabled={isSubmitting || payDebt.isPending}
            className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting || payDebt.isPending ? (
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
                جاري الدفع...
              </span>
            ) : (
              'دفع الدين'
            )}
          </button>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting || payDebt.isPending}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            إلغاء
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PayDebtModal;
