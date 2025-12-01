/**
 * ReceivableForm - Presentational Component
 * Form for creating and editing receivables (accounts receivable)
 *
 * Features:
 * - react-hook-form with Zod validation
 * - Fields: contactId, amount, date, dueDate, description, invoiceNumber, notes, branchId
 * - ContactSelector for customers
 * - BranchSelector for admins
 * - Validation: dueDate >= date
 * - Arabic labels and error messages
 * - Strict typing matching backend DTOs
 *
 * Uses FormField components with forwardRef for proper react-hook-form integration
 */

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  BranchSelector,
  ContactSelector,
  FormFieldInput,
  FormFieldTextarea,
  FormFieldDate,
} from '@/components/form';
import { useAuth } from '@/hooks/useAuth';
import type { CreateReceivableInput, UpdateReceivableInput, Receivable } from '#/entity';

// ============================================
// ZOD VALIDATION SCHEMA
// ============================================

/**
 * Zod schema for creating/updating a receivable
 * Matches backend CreateReceivableDto/UpdateReceivableDto validation rules
 */
const receivableSchema = z
  .object({
    contactId: z.string().min(1, { message: 'العميل مطلوب' }),
    amount: z.preprocess(
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
          required_error: 'المبلغ مطلوب',
          invalid_type_error: 'المبلغ يجب أن يكون رقمًا',
        })
        .min(0.01, { message: 'المبلغ يجب أن يكون 0.01 على الأقل' })
        .positive({ message: 'المبلغ يجب أن يكون موجبًا' })
    ),
    date: z.string().min(1, { message: 'تاريخ الفاتورة مطلوب' }),
    dueDate: z.string().optional(),
    description: z
      .string()
      .max(500, { message: 'الوصف يجب ألا يتجاوز 500 حرف' })
      .optional(),
    invoiceNumber: z
      .string()
      .max(50, { message: 'رقم الفاتورة يجب ألا يتجاوز 50 حرف' })
      .optional(),
    notes: z.string().max(1000, { message: 'الملاحظات يجب ألا تتجاوز 1000 حرف' }).optional(),
    branchId: z.string().optional(),
  })
  .refine(
    (data) => {
      // dueDate must be >= date if provided
      if (!data.date || !data.dueDate) return true;
      return new Date(data.dueDate) >= new Date(data.date);
    },
    {
      message: 'تاريخ الاستحقاق يجب أن يكون بعد أو يساوي تاريخ الفاتورة',
      path: ['dueDate'],
    }
  );

type FormData = z.infer<typeof receivableSchema>;

// ============================================
// TYPES
// ============================================

export interface ReceivableFormProps {
  mode: 'create' | 'edit';
  initialData?: Receivable;
  onSubmit: (data: CreateReceivableInput | UpdateReceivableInput) => Promise<void>;
  onCancel?: () => void;
  isSubmitting: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function ReceivableForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: ReceivableFormProps) {
  const { user, isAdmin } = useAuth();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(receivableSchema),
    defaultValues: {
      contactId: initialData?.contactId || '',
      amount: initialData?.originalAmount ? Number(initialData.originalAmount) : undefined,
      date: initialData?.date
        ? new Date(initialData.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      dueDate: initialData?.dueDate
        ? new Date(initialData.dueDate).toISOString().split('T')[0]
        : '',
      description: initialData?.description || '',
      invoiceNumber: initialData?.invoiceNumber || '',
      notes: initialData?.notes || '',
      branchId: initialData?.branchId || user?.branchId || '',
    },
  });

  const onSubmitForm = async (data: FormData) => {
    try {
      // Clean up empty strings to undefined
      const cleanData = {
        ...data,
        dueDate: data.dueDate || undefined,
        description: data.description || undefined,
        invoiceNumber: data.invoiceNumber || undefined,
        notes: data.notes || undefined,
        branchId: data.branchId || undefined,
      };

      await onSubmit(cleanData);

      // Reset form on successful create
      if (mode === 'create') {
        reset();
      }
    } catch (error) {
      // Error handling done by parent component
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      {/* Contact Selector */}
      <Controller
        name="contactId"
        control={control}
        render={({ field }) => (
          <ContactSelector
            mode="form"
            name="contactId"
            register={register}
            error={errors.contactId}
            contactType="CUSTOMER"
            required
          />
        )}
      />

      {/* Amount */}
      <FormFieldInput
        name="amount"
        label="المبلغ"
        type="number"
        register={register}
        error={errors.amount}
        required
        placeholder="أدخل المبلغ المستحق"
        step="0.01"
      />

      {/* Invoice Number */}
      <FormFieldInput
        name="invoiceNumber"
        label="رقم الفاتورة"
        type="text"
        register={register}
        error={errors.invoiceNumber}
        placeholder="رقم الفاتورة (اختياري)"
      />

      {/* Date */}
      <FormFieldDate
        name="date"
        label="تاريخ الفاتورة"
        register={register}
        error={errors.date}
        required
      />

      {/* Due Date */}
      <FormFieldDate
        name="dueDate"
        label="تاريخ الاستحقاق"
        register={register}
        error={errors.dueDate}
      />

      {/* Description */}
      <FormFieldTextarea
        name="description"
        label="الوصف"
        register={register}
        error={errors.description}
        placeholder="وصف الفاتورة (اختياري)"
        rows={2}
      />

      {/* Branch Selector (Admin only) */}
      {isAdmin && (
        <Controller
          name="branchId"
          control={control}
          render={({ field }) => (
            <BranchSelector
              mode="form"
              name="branchId"
              register={register}
              error={errors.branchId}
              required={false}
            />
          )}
        />
      )}

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
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              {mode === 'create' ? 'جاري الحفظ...' : 'جاري التحديث...'}
            </span>
          ) : mode === 'create' ? (
            'إضافة حساب مدين'
          ) : (
            'تحديث الحساب المدين'
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
