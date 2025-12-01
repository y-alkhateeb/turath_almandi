/**
 * CollectionForm - Presentational Component
 * Form for recording collections on receivables (accounts receivable)
 *
 * Features:
 * - react-hook-form with Zod validation
 * - Fields: amountPaid, paymentDate, paymentMethod, referenceNumber, notes
 * - Amount validation against remaining amount
 * - Arabic labels and error messages
 * - Strict typing matching backend DTOs
 *
 * Uses FormField components with forwardRef for proper react-hook-form integration
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormFieldInput, FormFieldTextarea, FormFieldDate, FormFieldSelect } from '@/components/form';
import { PaymentMethod } from '@/types/enum';
import type { CollectReceivableDto, AccountReceivable } from '@/types/receivables.types';

// ============================================
// ZOD VALIDATION SCHEMA
// ============================================

/**
 * Zod schema for recording a collection on a receivable
 * Matches backend CollectReceivableDto validation rules
 */
const createCollectionSchema = (maxAmount: number) =>
  z.object({
    amountPaid: z.preprocess(
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
      z
        .number({
          required_error: 'المبلغ المحصل مطلوب',
          invalid_type_error: 'المبلغ يجب أن يكون رقمًا',
        })
        .min(0.01, { message: 'المبلغ يجب أن يكون 0.01 على الأقل' })
        .max(maxAmount, { message: `المبلغ لا يمكن أن يتجاوز المبلغ المتبقي (${maxAmount})` })
        .positive({ message: 'المبلغ يجب أن يكون موجبًا' })
    ),
    paymentDate: z.string().min(1, { message: 'تاريخ التحصيل مطلوب' }),
    paymentMethod: z.nativeEnum(PaymentMethod, {
      required_error: 'طريقة التحصيل مطلوبة',
      invalid_type_error: 'طريقة تحصيل غير صالحة',
    }),
    referenceNumber: z.string().max(100, { message: 'رقم المرجع يجب ألا يتجاوز 100 حرف' }).optional(),
    notes: z.string().max(500, { message: 'الملاحظات يجب ألا تتجاوز 500 حرف' }).optional(),
  });

type FormData = z.infer<ReturnType<typeof createCollectionSchema>>;

// ============================================
// TYPES
// ============================================

export interface CollectionFormProps {
  receivable: AccountReceivable;
  onSubmit: (data: CollectReceivableDto) => Promise<void>;
  onCancel?: () => void;
  isSubmitting: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function CollectionForm({
  receivable,
  onSubmit,
  onCancel,
  isSubmitting,
}: CollectionFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(createCollectionSchema(receivable.remainingAmount)),
    defaultValues: {
      amountPaid: receivable.remainingAmount, // Default to full remaining amount
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: PaymentMethod.CASH,
      referenceNumber: '',
      notes: '',
    },
  });

  const onSubmitForm = async (data: FormData) => {
    try {
      // Clean up empty strings to undefined
      const cleanData: CollectReceivableDto = {
        amountPaid: data.amountPaid,
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber || undefined,
        notes: data.notes || undefined,
      };

      await onSubmit(cleanData);
      reset();
    } catch (error) {
      // Error handling done by parent component
      console.error('Collection form submission error:', error);
    }
  };

  const paymentMethodOptions = [
    { value: PaymentMethod.CASH, label: 'نقدي' },
    { value: PaymentMethod.MASTER, label: 'شبكة' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      {/* Receivable Info Display */}
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="font-medium text-gray-700">المبلغ الأصلي:</span>
            <span className="mr-2 text-gray-900">{receivable.originalAmount.toLocaleString('en-US')} IQD</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">المبلغ المتبقي:</span>
            <span className="mr-2 text-gray-900 font-semibold">
              {receivable.remainingAmount.toLocaleString('en-US')} IQD
            </span>
          </div>
          {receivable.contact && (
            <div className="col-span-2">
              <span className="font-medium text-gray-700">العميل:</span>
              <span className="mr-2 text-gray-900">{receivable.contact.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Amount Paid */}
      <FormFieldInput
        name="amountPaid"
        label="المبلغ المحصل"
        type="number"
        register={register}
        error={errors.amountPaid}
        required
        placeholder="أدخل المبلغ المحصل"
        step="0.01"
      />

      {/* Payment Date */}
      <FormFieldDate
        name="paymentDate"
        label="تاريخ التحصيل"
        register={register}
        error={errors.paymentDate}
        required
      />

      {/* Payment Method */}
      <FormFieldSelect
        name="paymentMethod"
        label="طريقة التحصيل"
        options={paymentMethodOptions}
        register={register}
        error={errors.paymentMethod}
        required
      />

      {/* Reference Number */}
      <FormFieldInput
        name="referenceNumber"
        label="رقم المرجع"
        type="text"
        register={register}
        error={errors.referenceNumber}
        placeholder="رقم الشيك أو التحويل (اختياري)"
      />

      {/* Notes */}
      <FormFieldTextarea
        name="notes"
        label="ملاحظات"
        register={register}
        error={errors.notes}
        placeholder="أضف أي ملاحظات إضافية"
        rows={3}
      />

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              جاري تسجيل التحصيل...
            </span>
          ) : (
            'تسجيل التحصيل'
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            إلغاء
          </button>
        )}
      </div>
    </form>
  );
}
