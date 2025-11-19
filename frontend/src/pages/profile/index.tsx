/**
 * Profile Page - Container Component
 * User profile page with account details and password change
 *
 * Architecture:
 * - Business logic in useAuth hook
 * - Form state with react-hook-form
 * - Zod validation for password complexity
 * - This page orchestrates components (container pattern)
 *
 * Features:
 * - Display user details (read-only): username, role, branch
 * - Password change form: currentPassword, newPassword, confirmPassword
 * - Zod validation for password complexity (min 8 chars, uppercase, lowercase, number)
 * - Loading states
 * - Error handling
 * - RTL support
 * - Strict typing
 *
 * Note: Password change requires backend endpoint /auth/change-password
 *       Currently not implemented - shows user-friendly message
 */

import { useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Shield, MapPin, Save, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { FormInput } from '@/components/form/FormInput';
import { toast } from 'sonner';
import { UserRole } from '@/types/enum';

// ============================================
// ZOD VALIDATION SCHEMA
// ============================================

/**
 * Password validation regex
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * Zod schema for password change form
 * Validates password complexity and confirmation match
 */
const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: 'كلمة المرور الحالية مطلوبة' }),
    newPassword: z
      .string()
      .min(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
      .regex(passwordRegex, {
        message:
          'كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم واحد على الأقل',
      }),
    confirmPassword: z
      .string()
      .min(1, { message: 'تأكيد كلمة المرور مطلوب' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'كلمات المرور غير متطابقة',
    path: ['confirmPassword'],
  });

type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get role label in Arabic
 */
const getRoleLabel = (role: string): string => {
  const roleLabels: Record<string, string> = {
    [UserRole.ADMIN]: 'مدير',
    [UserRole.ACCOUNTANT]: 'محاسب',
  };
  return roleLabels[role] || role;
};

/**
 * Get role badge styling
 */
const getRoleBadge = (role: string): React.ReactNode => {
  const isAdmin = role === UserRole.ADMIN;

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
        isAdmin
          ? 'bg-blue-100 text-blue-800 border-blue-300'
          : 'bg-green-100 text-green-800 border-green-300'
      }`}
    >
      {getRoleLabel(role)}
    </span>
  );
};

// ============================================
// PAGE COMPONENT
// ============================================

export default function ProfilePage() {
  const { user, isLoading } = useAuth();

  // ============================================
  // FORM STATE
  // ============================================

  /**
   * Password change form with Zod validation
   */
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handle password change form submission
   *
   * Note: This requires backend endpoint POST /auth/change-password
   * Currently not implemented - shows user-friendly message
   */
  const handlePasswordChange = useCallback(
    async (data: PasswordChangeFormData) => {
      try {
        // TODO: Implement backend endpoint POST /auth/change-password
        // Expected request body: { currentPassword: string, newPassword: string }
        // Expected response: { message: string }

        // For now, show a message that this feature is not yet available
        toast.error('تغيير كلمة المرور غير متاح حالياً. يرجى الاتصال بالمسؤول.');

        // Example implementation once backend endpoint is ready:
        /*
        await authService.changePassword({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        });

        toast.success('تم تغيير كلمة المرور بنجاح');
        reset();
        */
      } catch (error) {
        // Error toast shown by global API interceptor
        toast.error('حدث خطأ أثناء تغيير كلمة المرور');
      }
    },
    [reset]
  );

  /**
   * Handle cancel password change
   */
  const handleCancel = useCallback(() => {
    reset();
  }, [reset]);

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    return (
      <div className="space-y-6" dir="rtl">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-9 w-48 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          <div className="h-5 w-64 bg-[var(--bg-tertiary)] rounded animate-pulse" />
        </div>

        {/* Profile Card Skeleton */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse" />
                <div className="h-10 w-full bg-[var(--bg-tertiary)] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Password Form Skeleton */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
          <div className="h-6 w-32 bg-[var(--bg-tertiary)] rounded mb-4 animate-pulse" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-32 bg-[var(--bg-tertiary)] rounded animate-pulse" />
                <div className="h-10 w-full bg-[var(--bg-tertiary)] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // NO USER STATE
  // ============================================

  if (!user) {
    return (
      <div className="space-y-6">
        <div dir="rtl">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">الملف الشخصي</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            لم يتم تحميل بيانات المستخدم
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800">فشل تحميل بيانات المستخدم. يرجى تسجيل الدخول مرة أخرى.</p>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN CONTENT
  // ============================================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div dir="rtl">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">الملف الشخصي</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          عرض وإدارة معلومات حسابك
        </p>
      </div>

      {/* User Details Card */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6" dir="rtl">
          معلومات الحساب
        </h2>

        <div className="space-y-4" dir="rtl">
          {/* Username */}
          <div className="flex items-center gap-4 p-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-[var(--text-secondary)]">
                اسم المستخدم
              </label>
              <p className="text-lg font-medium text-[var(--text-primary)] mt-1">
                {user.username}
              </p>
            </div>
          </div>

          {/* Role */}
          <div className="flex items-center gap-4 p-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-[var(--text-secondary)]">
                الدور الوظيفي
              </label>
              <div className="mt-2">{getRoleBadge(user.role)}</div>
            </div>
          </div>

          {/* Branch (if accountant) */}
          {user.branchId && (
            <div className="flex items-center gap-4 p-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  الفرع
                </label>
                <p className="text-lg font-medium text-[var(--text-primary)] mt-1">
                  {user.branchId}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Card */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4" dir="rtl">
          <Lock className="w-5 h-5 text-[var(--text-primary)]" />
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            تغيير كلمة المرور
          </h2>
        </div>

        {/* Not Implemented Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6" dir="rtl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900">ميزة قيد التطوير</p>
              <p className="text-sm text-yellow-700 mt-1">
                تغيير كلمة المرور غير متاح حالياً. يتطلب تنفيذ نقطة نهاية الخادم (POST /auth/change-password).
                يرجى الاتصال بمسؤول النظام إذا كنت بحاجة إلى تغيير كلمة المرور.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(handlePasswordChange)} className="space-y-4">
          {/* Current Password */}
          <Controller
            name="currentPassword"
            control={control}
            render={({ field }) => (
              <FormInput
                {...field}
                type="password"
                label="كلمة المرور الحالية"
                placeholder="أدخل كلمة المرور الحالية"
                error={errors.currentPassword?.message}
                disabled
                dir="rtl"
              />
            )}
          />

          {/* New Password */}
          <Controller
            name="newPassword"
            control={control}
            render={({ field }) => (
              <FormInput
                {...field}
                type="password"
                label="كلمة المرور الجديدة"
                placeholder="أدخل كلمة المرور الجديدة"
                error={errors.newPassword?.message}
                disabled
                dir="rtl"
                helpText="8 أحرف على الأقل، حرف كبير، حرف صغير، ورقم"
              />
            )}
          />

          {/* Confirm Password */}
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <FormInput
                {...field}
                type="password"
                label="تأكيد كلمة المرور"
                placeholder="أعد إدخال كلمة المرور الجديدة"
                error={errors.confirmPassword?.message}
                disabled
                dir="rtl"
              />
            )}
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4" dir="rtl">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="غير متاح حالياً - يتطلب تنفيذ نقطة نهاية الخادم"
            >
              <Save className="w-4 h-4" />
              حفظ التغييرات
            </button>
          </div>
        </form>
      </div>

      {/* Security Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4" dir="rtl">
        <p className="text-sm text-blue-800">
          <strong>نصيحة أمنية:</strong> استخدم كلمة مرور قوية تحتوي على مزيج من الأحرف الكبيرة والصغيرة والأرقام. لا تشارك كلمة المرور الخاصة بك مع أي شخص.
        </p>
      </div>
    </div>
  );
}
