import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { UserWithBranch, CreateUserDto } from '@/types';
import { useBranches } from '@/hooks/useBranches';

// Zod schema with Arabic validation messages
const userSchema = z.object({
  username: z
    .string()
    .min(3, { message: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' })
    .max(50, { message: 'اسم المستخدم يجب ألا يتجاوز 50 حرف' }),
  password: z
    .string()
    .min(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
    .max(100, { message: 'كلمة المرور يجب ألا يتجاوز 100 حرف' })
    .optional()
    .or(z.literal('')),
  role: z.enum(['ADMIN', 'ACCOUNTANT'], {
    errorMap: () => ({ message: 'الدور مطلوب' })
  }),
  branchId: z.string().optional().nullable(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  onSubmit: (data: CreateUserDto) => void;
  onCancel: () => void;
  initialData?: UserWithBranch | null;
  isLoading?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}) => {
  const { data: branches = [], isLoading: isBranchesLoading } = useBranches();
  const isEditMode = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: initialData?.username || '',
      password: '',
      role: initialData?.role || 'ACCOUNTANT',
      branchId: initialData?.branchId || null,
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        username: initialData.username,
        password: '',
        role: initialData.role,
        branchId: initialData.branchId || null,
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data: UserFormData) => {
    const submitData: CreateUserDto = {
      username: data.username,
      password: data.password || '',
      role: data.role,
      branchId: data.branchId || null,
    };
    onSubmit(submitData);
  };

  const selectedRole = watch('role');

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Username */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          اسم المستخدم <span className="text-red-500">*</span>
        </label>
        <input
          {...register('username')}
          type="text"
          disabled={isLoading || isEditMode}
          className={`w-full px-4 py-3 border ${
            errors.username ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed`}
          placeholder="أدخل اسم المستخدم"
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
        )}
        {isEditMode && (
          <p className="mt-1 text-xs text-gray-500">لا يمكن تعديل اسم المستخدم</p>
        )}
      </div>

      {/* Password */}
      {!isEditMode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            كلمة المرور <span className="text-red-500">*</span>
          </label>
          <input
            {...register('password')}
            type="password"
            disabled={isLoading}
            className={`w-full px-4 py-3 border ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed`}
            placeholder="أدخل كلمة المرور"
            dir="ltr"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
      )}

      {/* Role */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          الدور <span className="text-red-500">*</span>
        </label>
        <select
          {...register('role')}
          disabled={isLoading}
          className={`w-full px-4 py-3 border ${
            errors.role ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed`}
        >
          <option value="ACCOUNTANT">محاسب</option>
          <option value="ADMIN">مدير</option>
        </select>
        {errors.role && (
          <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
        )}
      </div>

      {/* Branch - only for ACCOUNTANT role */}
      {selectedRole === 'ACCOUNTANT' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الفرع
          </label>
          <select
            {...register('branchId')}
            disabled={isLoading || isBranchesLoading}
            className={`w-full px-4 py-3 border ${
              errors.branchId ? 'border-red-500' : 'border-gray-300'
            } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed`}
          >
            <option value="">بدون فرع</option>
            {branches
              .filter(branch => branch.isActive)
              .map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} - {branch.location}
                </option>
              ))}
          </select>
          {errors.branchId && (
            <p className="mt-1 text-sm text-red-600">{errors.branchId.message}</p>
          )}
          {isBranchesLoading && (
            <p className="mt-1 text-xs text-gray-500">جاري تحميل الفروع...</p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
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
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              جاري الحفظ...
            </span>
          ) : initialData ? (
            'تحديث'
          ) : (
            'إضافة'
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
};
