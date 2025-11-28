/**
 * UserForm - Presentational Component
 * Form for creating and editing users
 *
 * Features:
 * - Create/Edit modes with separate forms for better type safety
 * - Fields: username, password, role, branchId (conditional), isActive (edit only)
 * - Conditional branchId: required if role=ACCOUNTANT, hidden if role=ADMIN
 * - Password complexity validation
 * - All fields use Controller for reliable value handling
 * - Arabic labels and error messages
 */

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BranchSelector } from '@/components/form/BranchSelector';
import { UserRole } from '@/types/enum';
import type { User } from '@/types/auth.types';
import type { CreateUserInput, UpdateUserInput } from '#/entity';

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

/**
 * Schema for creating a user
 */
const createUserSchema = z
  .object({
    username: z
      .string({ required_error: 'اسم المستخدم مطلوب' })
      .min(3, { message: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' })
      .max(50, { message: 'اسم المستخدم يجب ألا يتجاوز 50 حرف' })
      .regex(/^[a-zA-Z0-9_]+$/, {
        message: 'اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام فقط',
      }),
    password: z
      .string({ required_error: 'كلمة المرور مطلوبة' })
      .min(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
      .max(100, { message: 'كلمة المرور يجب ألا تتجاوز 100 حرف' })
      .regex(passwordRegex, {
        message: 'كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم ورمز خاص (@$!%*?&)',
      }),
    role: z.enum([UserRole.ADMIN, UserRole.ACCOUNTANT], {
      required_error: 'الدور مطلوب',
      invalid_type_error: 'الدور غير صالح',
    }),
    branchId: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
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
 * Schema for updating a user
 */
const updateUserSchema = z
  .object({
    role: z.enum([UserRole.ADMIN, UserRole.ACCOUNTANT]).optional(),
    branchId: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    password: z
      .string()
      .optional()
      .refine((val) => !val || val.length >= 8, {
        message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
      })
      .refine((val) => !val || passwordRegex.test(val), {
        message: 'كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم ورمز خاص (@$!%*?&)',
      }),
  })
  .refine(
    (data) => {
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
// ROLE OPTIONS
// ============================================

const roleOptions = [
  { value: UserRole.ADMIN, label: 'مدير' },
  { value: UserRole.ACCOUNTANT, label: 'محاسب' },
] as const;

// ============================================
// INPUT STYLES
// ============================================

const inputBaseClasses = `
  w-full px-4 py-3 rounded-lg transition-colors
  bg-[var(--bg-tertiary)] text-[var(--text-primary)]
  focus:outline-none focus:ring-2 focus:ring-primary-500
  disabled:opacity-50 disabled:cursor-not-allowed
  placeholder:text-[var(--text-tertiary)]
`;

const getInputClasses = (hasError: boolean) => `
  ${inputBaseClasses}
  border ${hasError ? 'border-red-500' : 'border-[var(--border-color)]'}
`;

// ============================================
// COMPONENT
// ============================================

export function UserForm({ mode, initialData, onSubmit, onCancel, isSubmitting }: UserFormProps) {
  const isCreateMode = mode === 'create';

  // Create mode form
  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: '',
      password: '',
      role: UserRole.ACCOUNTANT,
      branchId: null,
    },
  });

  // Edit mode form
  const editForm = useForm<UpdateFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      role: (initialData?.role as UserRole) ?? UserRole.ACCOUNTANT,
      branchId: initialData?.branchId ?? null,
      isActive: initialData?.isActive ?? true,
      password: '',
    },
  });

  // Use appropriate form based on mode
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = isCreateMode ? createForm : editForm;

  // Watch role for conditional branchId
  const selectedRole = watch('role') as UserRole | undefined;

  // Reset edit form when initialData changes
  useEffect(() => {
    if (!isCreateMode && initialData) {
      editForm.reset({
        role: initialData.role as UserRole,
        branchId: initialData.branchId ?? null,
        isActive: initialData.isActive,
        password: '',
      });
    }
  }, [initialData, isCreateMode, editForm]);

  // Clear branchId when role changes to ADMIN
  useEffect(() => {
    if (selectedRole === UserRole.ADMIN) {
      setValue('branchId', null);
    }
  }, [selectedRole, setValue]);

  const handleFormSubmit = async (data: CreateFormData | UpdateFormData) => {
    try {
      if (isCreateMode) {
        const createData = data as CreateFormData;
        const submitData: CreateUserInput = {
          username: createData.username.trim(),
          password: createData.password,
          role: createData.role,
          branchId: createData.role === UserRole.ACCOUNTANT ? createData.branchId : null,
        };
        await onSubmit(submitData);
        reset();
      } else {
        const updateData = data as UpdateFormData;
        const submitData: UpdateUserInput = {
          role: updateData.role,
          branchId: updateData.role === UserRole.ACCOUNTANT ? updateData.branchId : null,
          isActive: updateData.isActive,
        };
        // Only include password if provided
        if (updateData.password) {
          submitData.password = updateData.password;
        }
        await onSubmit(submitData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6" dir="rtl">
      {/* Username (Create Only) */}
      {isCreateMode && (
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            اسم المستخدم <span className="text-red-500">*</span>
          </label>
          <Controller
            name="username"
            control={control as typeof createForm.control}
            render={({ field }) => (
              <input
                {...field}
                id="username"
                type="text"
                placeholder="أدخل اسم المستخدم"
                disabled={isSubmitting}
                className={getInputClasses(!!errors.username)}
                dir="ltr"
              />
            )}
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-600" dir="rtl">{errors.username.message}</p>
          )}
          <p className="mt-1 text-xs text-[var(--text-secondary)]" dir="rtl">
            3-50 حرف، أحرف إنجليزية وأرقام فقط
          </p>
        </div>
      )}

      {/* Username Display (Edit Only) */}
      {!isCreateMode && initialData && (
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            اسم المستخدم
          </label>
          <div className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)]">
            {initialData.username}
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]" dir="rtl">لا يمكن تغيير اسم المستخدم</p>
        </div>
      )}

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          {isCreateMode ? 'كلمة المرور' : 'كلمة المرور الجديدة (اختياري)'}
          {isCreateMode && <span className="text-red-500"> *</span>}
        </label>
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              value={field.value ?? ''}
              id="password"
              type="password"
              placeholder={isCreateMode ? 'أدخل كلمة المرور' : 'اتركها فارغة للإبقاء على كلمة المرور الحالية'}
              disabled={isSubmitting}
              className={getInputClasses(!!errors.password)}
              dir="ltr"
            />
          )}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600" dir="rtl">{errors.password.message}</p>
        )}
        <p className="mt-1 text-xs text-[var(--text-secondary)]" dir="rtl">
          8 أحرف على الأقل، حرف كبير، حرف صغير، رقم، ورمز خاص (@$!%*?&)
        </p>
      </div>

      {/* Role */}
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          الدور <span className="text-red-500">*</span>
        </label>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              id="role"
              value={field.value ?? UserRole.ACCOUNTANT}
              onChange={(e) => field.onChange(e.target.value as UserRole)}
              disabled={isSubmitting}
              className={getInputClasses(!!errors.role)}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        />
        {errors.role && (
          <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
        )}
      </div>

      {/* Branch Selector (Only for ACCOUNTANT) */}
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
                showLabel={false}
              />
            )}
          />
          {errors.branchId && (
            <p className="mt-1 text-sm text-red-600" dir="rtl">{errors.branchId.message}</p>
          )}
          <p className="mt-1 text-xs text-[var(--text-secondary)]" dir="rtl">الفرع الذي سيعمل فيه المحاسب</p>
        </div>
      )}

      {/* Branch Info (For ADMIN) */}
      {selectedRole === UserRole.ADMIN && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>ملاحظة:</strong> المدير لديه صلاحيات الوصول لجميع الفروع ولا يتم تعيينه لفرع محدد.
          </p>
        </div>
      )}

      {/* Is Active Toggle (Edit Only) */}
      {!isCreateMode && (
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            حالة الحساب
          </label>
          <Controller
            name="isActive"
            control={control as typeof editForm.control}
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => field.onChange(!field.value)}
                  disabled={isSubmitting}
                  className={`
                    relative inline-flex h-7 w-14 items-center rounded-full transition-colors
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                    ${field.value ? 'bg-green-600' : 'bg-gray-300'}
                    ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
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
          <p className="mt-1 text-xs text-[var(--text-secondary)]" dir="rtl">
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
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {isCreateMode ? 'إضافة مستخدم' : 'تحديث المستخدم'}
        </button>
      </div>
    </form>
  );
}

export default UserForm;
