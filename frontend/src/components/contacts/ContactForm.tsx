/**
 * ContactForm - Presentational Component
 * Form for creating and editing contacts (suppliers and customers)
 *
 * Features:
 * - react-hook-form with Zod validation
 * - Fields: name, type, phone, email, address, creditLimit, notes, branchId
 * - BranchSelector for admins
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
  FormFieldInput,
  FormFieldTextarea,
  FormFieldSelect,
} from '@/components/form';
import { useAuth } from '@/hooks/useAuth';
import type { CreateContactInput, UpdateContactInput, Contact } from '#/entity';

// ============================================
// ZOD VALIDATION SCHEMA
// ============================================

/**
 * Zod schema for creating/updating a contact
 * Matches backend CreateContactDto/UpdateContactDto validation rules
 */
const contactSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'اسم جهة الاتصال مطلوب' })
    .max(200, { message: 'الاسم يجب ألا يتجاوز 200 حرف' }),
  type: z.enum(['SUPPLIER', 'CUSTOMER'], {
    required_error: 'نوع جهة الاتصال مطلوب',
    invalid_type_error: 'نوع غير صالح',
  }),
  phone: z
    .string()
    .min(1, { message: 'رقم الهاتف مطلوب' })
    .max(20, { message: 'رقم الهاتف يجب ألا يتجاوز 20 حرف' }),
  email: z
    .string()
    .email({ message: 'البريد الإلكتروني غير صالح' })
    .max(100, { message: 'البريد الإلكتروني يجب ألا يتجاوز 100 حرف' })
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .max(500, { message: 'العنوان يجب ألا يتجاوز 500 حرف' })
    .optional(),
  creditLimit: z
    .preprocess(
      (val) => {
        // Allow empty string or null
        if (val === '' || val === null || val === undefined) return undefined;
        // Convert string numbers to actual numbers
        if (typeof val === 'string') {
          const num = parseFloat(val);
          return isNaN(num) ? undefined : num;
        }
        return val;
      },
      z
        .number({
          invalid_type_error: 'حد الائتمان يجب أن يكون رقمًا',
        })
        .min(0, { message: 'حد الائتمان يجب أن يكون 0 أو أكثر' })
        .optional()
    ),
  notes: z.string().max(1000, { message: 'الملاحظات يجب ألا تتجاوز 1000 حرف' }).optional(),
  branchId: z.string().optional(),
});

type FormData = z.infer<typeof contactSchema>;

// ============================================
// TYPES
// ============================================

export interface ContactFormProps {
  mode: 'create' | 'edit';
  initialData?: Contact;
  onSubmit: (data: CreateContactInput | UpdateContactInput) => Promise<void>;
  onCancel?: () => void;
  isSubmitting: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function ContactForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: ContactFormProps) {
  const { user, isAdmin } = useAuth();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || 'SUPPLIER',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      address: initialData?.address || '',
      creditLimit: initialData?.creditLimit ? Number(initialData.creditLimit) : undefined,
      notes: initialData?.notes || '',
      branchId: initialData?.branchId || user?.branchId || '',
    },
  });

  const onSubmitForm = async (data: FormData) => {
    try {
      // Clean up empty strings to undefined
      const cleanData = {
        ...data,
        email: data.email || undefined,
        address: data.address || undefined,
        notes: data.notes || undefined,
        creditLimit: data.creditLimit || undefined,
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

  const contactTypeOptions = [
    { value: 'SUPPLIER', label: 'مورد' },
    { value: 'CUSTOMER', label: 'عميل' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      {/* Contact Type */}
      <FormFieldSelect
        name="type"
        label="نوع جهة الاتصال"
        options={contactTypeOptions}
        register={register}
        error={errors.type}
        required
      />

      {/* Name */}
      <FormFieldInput
        name="name"
        label="الاسم"
        type="text"
        register={register}
        error={errors.name}
        required
        placeholder="أدخل اسم المورد أو العميل"
      />

      {/* Phone */}
      <FormFieldInput
        name="phone"
        label="رقم الهاتف"
        type="tel"
        register={register}
        error={errors.phone}
        required
        placeholder="+964 770 123 4567"
      />

      {/* Email */}
      <FormFieldInput
        name="email"
        label="البريد الإلكتروني"
        type="email"
        register={register}
        error={errors.email}
        placeholder="example@email.com"
      />

      {/* Address */}
      <FormFieldTextarea
        name="address"
        label="العنوان"
        register={register}
        error={errors.address}
        placeholder="أدخل العنوان الكامل"
        rows={2}
      />

      {/* Credit Limit */}
      <FormFieldInput
        name="creditLimit"
        label="حد الائتمان"
        type="number"
        register={register}
        error={errors.creditLimit}
        placeholder="أدخل حد الائتمان (اختياري)"
        step="0.01"
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
            'إضافة جهة اتصال'
          ) : (
            'تحديث جهة الاتصال'
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
