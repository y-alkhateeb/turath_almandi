/**
 * UserForm - Presentational Component
 * Form for creating and editing users
 *
 * Features:
 * - Create/Edit modes
 * - Fields: username, password (create only), role, branchId (conditional), isActive (edit only)
 * - Conditional branchId: required if role=ACCOUNTANT, hidden if role=ADMIN
 * - Password complexity validation (min 8 chars, uppercase, lowercase, number)
 * - Zod schema matching backend CreateUserDto and UpdateUserDto
 * - Arabic labels and error messages
 * - Admin only
 * - No business logic
 */

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput } from '@/components/form/FormInput';
import { FormSelect, type SelectOption } from '@/components/form/FormSelect';
import { BranchSelector } from '@/components/form/BranchSelector';
import { UserRole } from '@/types/enum';
import type { User } from '@/types/auth.types';
import type { CreateUserInput, UpdateUserInput } from '#/entity';

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

/**
 * Password validation regex
 * Matches backend CreateUserDto validation rules exactly
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (@$!%*?&)
 */
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

/**
 * Zod schema for creating a user
 * Matches backend CreateUserDto validation rules
 */
const createUserSchema = z
  .object({
    username: z
      .string()
      .min(1, { message: 'اسم المستخدم مطلوب' })
      .min(3, { message: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' })
      .max(50, { message: 'اسم المستخدم يجب ألا يتجاوز 50 حرف' })
      .regex(/^[a-zA-Z0-9_]+$/, {
        message: 'اسم المستخدم يجب أن يحتوي على أحرف وأرقام فقط',
      }),
    password: z
      .string()
      .min(1, { message: 'كلمة المرور مطلوبة' })
      .min(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
      .max(100, { message: 'كلمة المرور يجب ألا تتجاوز 100 حرف' })
      .regex(passwordRegex, {
        message: 'كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم ورمز خاص (@$!%*?&)',
      }),
    role: z.nativeEnum(UserRole, {
      errorMap: () => ({ message: 'الدور مطلوب' }),
    }),
    branchId: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      // branchId is required if role is ACCOUNTANT
      if (data.role === UserRole.ACCOUNTANT) {
        return !!data.branchId;
      }
      return true;
    },
    {
      message: 'الفرع مطلوب للمحاسبين',
      path: ['branchId'],
    }
  );

/**
 * Zod schema for updating a user
 * All fields optional except validation rules remain the same
 */
const updateUserSchema = z
  .object({
    role: z.nativeEnum(UserRole).optional(),
    branchId: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // branchId is required if role is ACCOUNTANT
      if (data.role === UserRole.ACCOUNTANT) {
        return !!data.branchId;
      }
      return true;
    },
    {
      message: 'الفرع مطلوب للمحاسبين',
      path: ['branchId'],
    }
  );

type CreateFormData = z.infer<typeof createUserSchema>;
type UpdateFormData = z.infer<typeof updateUserSchema>;

// ============================================
// TYPES
// ============================================

export interface UserFormProps {
  mode: 'create' | 'edit';
  initialData?: User;
  onSubmit: (data: CreateUserInput | UpdateUserInput) => Promise<void>;
  onCancel?: () => void;
  isSubmitting: boolean;
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Role options (Arabic)
 */
const roleOptions: SelectOption[] = [
  { value: UserRole.ADMIN, label: 'مدير' },
  { value: UserRole.ACCOUNTANT, label: 'محاسب' },
];

// ============================================
// COMPONENT
// ============================================

export function UserForm({ mode, initialData, onSubmit, onCancel, isSubmitting }: UserFormProps) {
  // Use appropriate schema based on mode
  const schema = mode === 'create' ? createUserSchema : updateUserSchema;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(schema),
    defaultValues:
      mode === 'edit' && initialData
        ? {
            role: initialData.role as UserRole,
            branchId: initialData.branchId,
            isActive: initialData.isActive,
          }
        : {
            username: '',
            password: '',
            role: UserRole.ACCOUNTANT,
            branchId: null,
          },
  });

  // Watch role to conditionally show/hide branchId
  const selectedRole = watch('role' as keyof CreateFormData) as UserRole | undefined;

  // Reset form when mode or initialData changes
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset({
        role: initialData.role as UserRole,
        branchId: initialData.branchId,
        isActive: initialData.isActive,
      });
    }
  }, [mode, initialData, reset]);

  // Clear branchId when role changes to ADMIN
  useEffect(() => {
    if (selectedRole === UserRole.ADMIN) {
      setValue('branchId' as keyof CreateFormData, null as never);
    }
  }, [selectedRole, setValue]);

  const handleFormSubmit = async (data: CreateFormData | UpdateFormData) => {
    try {
      if (mode === 'create') {
        const createData = data as CreateFormData;
        const submitData: CreateUserInput = {
          username: createData.username,
          password: createData.password,
          role: createData.role,
          branchId: createData.role === UserRole.ACCOUNTANT ? createData.branchId || null : null,
        };
        await onSubmit(submitData);
        // Reset form after successful submission
        reset();
      } else {
        const updateData = data as UpdateFormData;
        const submitData: UpdateUserInput = {
          role: updateData.role,
          branchId: updateData.role === UserRole.ACCOUNTANT ? updateData.branchId || null : null,
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
      {/* Username (Create Only) */}
      {mode === 'create' && (
        <FormInput
          name="username"
          label="اسم المستخدم"
          type="text"
          placeholder="أدخل اسم المستخدم"
          register={register}
          error={errors.username}
          required
          disabled={isSubmitting}
          helperText="3-50 حرف، أحرف إنجليزية وأرقام فقط"
        />
      )}

      {/* Username Display (Edit Only) */}
      {mode === 'edit' && initialData && (
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            اسم المستخدم
          </label>
          <div className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)]">
            {initialData.username}
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">لا يمكن تغيير اسم المستخدم</p>
        </div>
      )}

      {/* Password (Create Only) */}
      {mode === 'create' && (
        <FormInput
          name="password"
          label="كلمة المرور"
          type="password"
          placeholder="أدخل كلمة المرور"
          register={register}
          error={errors.password}
          required
          disabled={isSubmitting}
          helperText="8 أحرف على الأقل، حرف كبير، حرف صغير، رقم، ورمز خاص (@$!%*?&)"
        />
      )}

      {/* Role */}
      <FormSelect
        name="role"
        label="الدور"
        options={roleOptions}
        register={register}
        error={errors.role}
        required
        disabled={isSubmitting}
      />

      {/* Branch Selector (Conditional - Only for ACCOUNTANT) */}
      {selectedRole === UserRole.ACCOUNTANT && (
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            الفرع <span className="text-red-500">*</span>
          </label>
          <Controller
            name="branchId"
            control={control}
            render={({ field }) => (
              <BranchSelector
                value={field.value as string | null}
                onChange={(value) => field.onChange(value)}
                disabled={isSubmitting}
                required
              />
            )}
          />
          {errors.branchId && (
            <p className="mt-1 text-sm text-red-600">{errors.branchId.message as string}</p>
          )}
          <p className="mt-1 text-xs text-[var(--text-secondary)]">الفرع الذي سيعمل فيه المحاسب</p>
        </div>
      )}

      {/* Branch Info (For ADMIN) */}
      {selectedRole === UserRole.ADMIN && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>ملاحظة:</strong> المدير لديه صلاحيات الوصول لجميع الفروع ولا يتم تعيينه لفرع
            محدد.
          </p>
        </div>
      )}

      {/* Is Active Toggle (Edit Only) */}
      {mode === 'edit' && (
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            حالة الحساب
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
            الحسابات المعطلة لا يمكنها تسجيل الدخول
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
          {mode === 'create' ? 'إضافة مستخدم' : 'تحديث المستخدم'}
        </button>
      </div>
    </form>
  );
}

export default UserForm;
