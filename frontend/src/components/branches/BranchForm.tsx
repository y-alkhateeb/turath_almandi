/**
 * BranchForm - Presentational Component
 * Form for creating and editing branches
 *
 * Features:
 * - Create/Edit modes
 * - Fields: name, location, managerName, phone, isActive (edit only)
 * - Phone format validation (Iraqi: 07XXXXXXXXX or International: +964...)
 * - Zod schema matching backend CreateBranchDto and UpdateBranchDto
 * - Arabic labels and error messages
 * - No business logic
 */

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput } from '@/components/form/FormInput';
import type { Branch, CreateBranchInput, UpdateBranchInput } from '#/entity';

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

/**
 * Phone validation regex
 * Accepts:
 * - Iraqi mobile: 07XXXXXXXXX (11 digits)
 * - International: +964XXXXXXXXXX
 * - With optional spaces/dashes
 */
const phoneRegex = /^(\+?964|0)?7\d{9}$|^\+?\d{10,15}$/;

/**
 * Zod schema for creating a branch
 * Matches backend CreateBranchDto validation rules
 */
const createBranchSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'اسم الفرع مطلوب' })
    .min(2, { message: 'اسم الفرع يجب أن يكون حرفين على الأقل' })
    .max(100, { message: 'اسم الفرع يجب ألا يتجاوز 100 حرف' }),
  location: z
    .string()
    .min(1, { message: 'الموقع مطلوب' })
    .min(3, { message: 'الموقع يجب أن يكون 3 أحرف على الأقل' })
    .max(200, { message: 'الموقع يجب ألا يتجاوز 200 حرف' }),
  managerName: z
    .string()
    .min(1, { message: 'اسم المدير مطلوب' })
    .min(2, { message: 'اسم المدير يجب أن يكون حرفين على الأقل' })
    .max(100, { message: 'اسم المدير يجب ألا يتجاوز 100 حرف' }),
  phone: z
    .string()
    .min(1, { message: 'رقم الهاتف مطلوب' })
    .regex(phoneRegex, {
      message: 'رقم الهاتف غير صحيح. استخدم صيغة: 07XXXXXXXXX أو +964XXXXXXXXXX',
    }),
});

/**
 * Zod schema for updating a branch
 * All fields optional except validation rules remain the same
 */
const updateBranchSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'اسم الفرع يجب أن يكون حرفين على الأقل' })
    .max(100, { message: 'اسم الفرع يجب ألا يتجاوز 100 حرف' })
    .optional(),
  location: z
    .string()
    .min(3, { message: 'الموقع يجب أن يكون 3 أحرف على الأقل' })
    .max(200, { message: 'الموقع يجب ألا يتجاوز 200 حرف' })
    .optional(),
  managerName: z
    .string()
    .min(2, { message: 'اسم المدير يجب أن يكون حرفين على الأقل' })
    .max(100, { message: 'اسم المدير يجب ألا يتجاوز 100 حرف' })
    .optional(),
  phone: z
    .string()
    .regex(phoneRegex, {
      message: 'رقم الهاتف غير صحيح. استخدم صيغة: 07XXXXXXXXX أو +964XXXXXXXXXX',
    })
    .optional(),
  isActive: z.boolean().optional(),
});

type CreateFormData = z.infer<typeof createBranchSchema>;
type UpdateFormData = z.infer<typeof updateBranchSchema>;

// ============================================
// TYPES
// ============================================

export interface BranchFormProps {
  mode: 'create' | 'edit';
  initialData?: Branch;
  onSubmit: (data: CreateBranchInput | UpdateBranchInput) => Promise<void>;
  onCancel?: () => void;
  isSubmitting: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function BranchForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: BranchFormProps) {
  // Use appropriate schema based on mode
  const schema = mode === 'create' ? createBranchSchema : updateBranchSchema;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(schema),
    defaultValues:
      mode === 'edit' && initialData
        ? {
            name: initialData.name,
            location: initialData.location,
            managerName: initialData.managerName,
            phone: initialData.phone,
            isActive: initialData.isActive,
          }
        : {
            name: '',
            location: '',
            managerName: '',
            phone: '',
          },
  });

  // Reset form when mode or initialData changes
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset({
        name: initialData.name,
        location: initialData.location,
        managerName: initialData.managerName,
        phone: initialData.phone,
        isActive: initialData.isActive,
      });
    }
  }, [mode, initialData, reset]);

  const handleFormSubmit = async (data: CreateFormData | UpdateFormData) => {
    try {
      if (mode === 'create') {
        const createData = data as CreateFormData;
        const submitData: CreateBranchInput = {
          name: createData.name,
          location: createData.location,
          managerName: createData.managerName,
          phone: createData.phone,
        };
        await onSubmit(submitData);
        // Reset form after successful submission
        reset();
      } else {
        const updateData = data as UpdateFormData;
        const submitData: UpdateBranchInput = {
          name: updateData.name,
          location: updateData.location,
          managerName: updateData.managerName,
          phone: updateData.phone,
          isActive: updateData.isActive,
        };
        await onSubmit(submitData);
        // Reset form after successful submission
        reset();
      }
    } catch (error) {
      // Error handling is done by the parent component
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6" dir="rtl">
      {/* Branch Name */}
      <FormInput
        name="name"
        label="اسم الفرع"
        type="text"
        placeholder="أدخل اسم الفرع"
        register={register}
        error={errors.name}
        required
        disabled={isSubmitting}
      />

      {/* Location */}
      <FormInput
        name="location"
        label="الموقع"
        type="text"
        placeholder="أدخل موقع الفرع"
        register={register}
        error={errors.location}
        required
        disabled={isSubmitting}
        helperText="العنوان الكامل للفرع"
      />

      {/* Manager Name */}
      <FormInput
        name="managerName"
        label="اسم المدير"
        type="text"
        placeholder="أدخل اسم مدير الفرع"
        register={register}
        error={errors.managerName}
        required
        disabled={isSubmitting}
      />

      {/* Phone */}
      <FormInput
        name="phone"
        label="رقم الهاتف"
        type="tel"
        placeholder="07XXXXXXXXX أو +964XXXXXXXXXX"
        register={register}
        error={errors.phone}
        required
        disabled={isSubmitting}
        helperText="رقم الهاتف العراقي (07XXXXXXXXX) أو الدولي (+964XXXXXXXXXX)"
        dir="ltr"
      />

      {/* Is Active Toggle (Edit Only) */}
      {mode === 'edit' && (
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            حالة الفرع
          </label>
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => field.onChange(!field.value)}
                  disabled={isSubmitting}
                  className={`
                    relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                    ${field.value ? 'bg-green-600' : 'bg-gray-300'}
                    ${isSubmitting && 'opacity-50 cursor-not-allowed'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-5 w-5 transform rounded-full bg-white transition-transform
                      ${field.value ? 'translate-x-1' : 'translate-x-8'}
                    `}
                  />
                </button>
                <span className="text-sm text-[var(--text-primary)]">
                  {field.value ? 'نشط' : 'معطل'}
                </span>
              </div>
            )}
          />
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            الفروع المعطلة لن تظهر في قوائم الاختيار
          </p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t border-[var(--border-color)]">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-3 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-tertiary)] focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            إلغاء
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isSubmitting && (
            <svg
              className="animate-spin h-5 w-5 text-white"
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
          )}
          {mode === 'create' ? 'إضافة فرع' : 'تحديث الفرع'}
        </button>
      </div>
    </form>
  );
}

export default BranchForm;
