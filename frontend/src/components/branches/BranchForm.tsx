/**
 * BranchForm - Presentational Component
 * Form for creating and editing branches
 *
 * Features:
 * - Create/Edit modes
 * - Fields: name, location, managerName, isActive (edit only)
 * - Zod schema matching backend CreateBranchDto and UpdateBranchDto
 * - Arabic labels and error messages
 * - No business logic
 */

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Switch } from '@/components/ui/Switch';
import type { Branch, CreateBranchInput, UpdateBranchInput } from '#/entity';

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

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
            isActive: initialData.isActive,
          }
        : {
            name: '',
            location: '',
            managerName: '',
          },
  });

  // Reset form when mode or initialData changes
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset({
        name: initialData.name,
        location: initialData.location,
        managerName: initialData.managerName,
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

  // Common input classes
  const inputClasses = `
    w-full px-4 py-3
    border border-[var(--border-color)] rounded-lg
    focus:ring-2 focus:ring-primary-500 focus:border-primary-500
    bg-[var(--bg-primary)] text-[var(--text-primary)]
    transition-colors
    disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed
  `;

  const errorInputClasses = `
    w-full px-4 py-3
    border border-red-500 rounded-lg
    focus:ring-2 focus:ring-red-500 focus:border-red-500
    bg-[var(--bg-primary)] text-[var(--text-primary)]
    transition-colors
    disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed
  `;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6" dir="rtl">
      {/* Branch Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          اسم الفرع <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          placeholder="أدخل اسم الفرع"
          disabled={isSubmitting}
          className={errors.name ? errorInputClasses : inputClasses}
          {...register('name')}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          الموقع <span className="text-red-500">*</span>
        </label>
        <input
          id="location"
          type="text"
          placeholder="أدخل موقع الفرع"
          disabled={isSubmitting}
          className={errors.location ? errorInputClasses : inputClasses}
          {...register('location')}
        />
        {errors.location && (
          <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
        )}
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          العنوان الكامل للفرع
        </p>
      </div>

      {/* Manager Name */}
      <div>
        <label htmlFor="managerName" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          اسم المدير <span className="text-red-500">*</span>
        </label>
        <input
          id="managerName"
          type="text"
          placeholder="أدخل اسم مدير الفرع"
          disabled={isSubmitting}
          className={errors.managerName ? errorInputClasses : inputClasses}
          {...register('managerName')}
        />
        {errors.managerName && (
          <p className="mt-1 text-sm text-red-600">{errors.managerName.message}</p>
        )}
      </div>

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
              <Switch
                checked={field.value ?? false}
                onChange={field.onChange}
                disabled={isSubmitting}
                label={field.value ? 'نشط' : 'معطل'}
                labelPosition="end"
                size="lg"
              />
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
