/**
 * AddCurrencyModal - Presentational Component
 * Modal form for adding new currencies
 *
 * Features:
 * - Form fields: code, name_ar, name_en, symbol
 * - react-hook-form with Zod validation
 * - Code auto-uppercase (3 letters, ISO 4217 format)
 * - Validation messages in Arabic
 * - RTL layout
 * - Loading state on submit
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/Button';
import { FormFieldInput } from '@/components/form';
import type { CreateCurrencyInput } from '#/settings.types';

// ============================================
// ZOD VALIDATION SCHEMA
// ============================================

/**
 * Zod schema for creating a currency
 * Matches backend CreateCurrencyDto validation rules
 */
const createCurrencySchema = z.object({
  code: z
    .string()
    .min(1, { message: 'رمز العملة مطلوب' })
    .length(3, { message: 'رمز العملة يجب أن يكون 3 أحرف بالضبط' })
    .regex(/^[A-Z]{3}$/, {
      message: 'رمز العملة يجب أن يحتوي على 3 أحرف إنجليزية كبيرة فقط (مثال: USD, IQD)',
    })
    .transform((val) => val.toUpperCase()),
  nameAr: z
    .string()
    .min(1, { message: 'الاسم بالعربية مطلوب' })
    .min(2, { message: 'الاسم بالعربية يجب أن يكون حرفين على الأقل' })
    .max(100, { message: 'الاسم بالعربية يجب ألا يتجاوز 100 حرف' }),
  nameEn: z
    .string()
    .min(1, { message: 'الاسم بالإنجليزية مطلوب' })
    .min(2, { message: 'الاسم بالإنجليزية يجب أن يكون حرفين على الأقل' })
    .max(100, { message: 'الاسم بالإنجليزية يجب ألا يتجاوز 100 حرف' }),
  symbol: z
    .string()
    .min(1, { message: 'رمز العملة مطلوب' })
    .max(10, { message: 'رمز العملة يجب ألا يتجاوز 10 أحرف' }),
});

type FormData = z.infer<typeof createCurrencySchema>;

// ============================================
// TYPES
// ============================================

export interface AddCurrencyModalProps {
  /** Modal open state */
  isOpen: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Callback to submit new currency */
  onSubmit: (data: CreateCurrencyInput) => Promise<void>;
  /** Submitting state */
  isSubmitting: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function AddCurrencyModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: AddCurrencyModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(createCurrencySchema),
    defaultValues: {
      code: '',
      nameAr: '',
      nameEn: '',
      symbol: '',
    },
  });

  const handleFormSubmit = async (data: FormData) => {
    try {
      await onSubmit(data);
      // Reset form and close modal on success
      reset();
      onClose();
    } catch (error) {
      // Error handling is done by the parent component via mutation hook
      console.error('Failed to add currency:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="إضافة عملة جديدة" size="lg">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6" dir="rtl">
        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">ملاحظة:</p>
              <p>
                استخدم رموز العملات القياسية ISO 4217 (مثل: USD للدولار الأمريكي، IQD للدينار
                العراقي، EUR لليورو)
              </p>
            </div>
          </div>
        </div>

        {/* Currency Code */}
        <FormFieldInput
          label="رمز العملة (ISO 4217)"
          placeholder="مثال: USD, EUR, IQD"
          error={errors.code}
          required
          disabled={isSubmitting}
          inputClassName="uppercase"
          {...register('code')}
        />

        {/* Currency Symbol */}
        <FormFieldInput
          label="رمز العملة"
          placeholder="مثال: $, €, د.ع"
          error={errors.symbol}
          required
          disabled={isSubmitting}
          {...register('symbol')}
        />

        {/* Arabic Name */}
        <FormFieldInput
          label="الاسم بالعربية"
          placeholder="مثال: دولار أمريكي"
          error={errors.nameAr}
          required
          disabled={isSubmitting}
          {...register('nameAr')}
        />

        {/* English Name */}
        <FormFieldInput
          label="الاسم بالإنجليزية"
          placeholder="Example: US Dollar"
          error={errors.nameEn}
          required
          disabled={isSubmitting}
          {...register('nameEn')}
        />

        {/* Warning about non-default */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              العملة الجديدة <span className="font-semibold">لن يتم تعيينها كافتراضية</span> تلقائياً.
              لتعيينها كعملة افتراضية، استخدم زر "تعيين كافتراضي" من القائمة بعد الإضافة.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-[var(--border-color)]">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            fullWidth
          >
            {isSubmitting ? 'جاري الإضافة...' : 'إضافة'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleClose}
            disabled={isSubmitting}
            fullWidth
          >
            إلغاء
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default AddCurrencyModal;
