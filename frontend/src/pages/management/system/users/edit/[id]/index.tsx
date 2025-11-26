/**
 * Edit User Page - Container Component
 * Admin-only page for editing existing system users
 *
 * Architecture:
 * - Business logic in useUser and useUpdateUser hooks
 * - Presentational component (UserForm)
 * - This page only orchestrates flow (container pattern)
 *
 * Features:
 * - Admin-only access guard (redirect accountants)
 * - Fetch user by ID
 * - Edit user details (username, role, branch, password, isActive)
 * - Navigate to list on success
 * - Handle not found (404) error
 * - Breadcrumb navigation
 * - Loading state during fetch and submission
 * - Cancel navigation
 * - Strict typing
 */

import { useCallback, useEffect } from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useRouter } from '@/routes/hooks';
import { useParams } from '@/routes/hooks';
import { useAuth } from '@/hooks/useAuth';
import { useUser, useUpdateUser } from '@/hooks/useUsers';
import { UserForm } from '@/components/users/UserForm';
import { ErrorState } from '@/components/common/ErrorState';
import type { UpdateUserInput } from '#/entity';
import { toast } from 'sonner';

// ============================================
// PAGE COMPONENT
// ============================================

export default function EditUserPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();

  // ============================================
  // ADMIN GUARD
  // ============================================

  /**
   * Redirect non-admin users
   * Only admins can edit users
   */
  useEffect(() => {
    if (!isAdmin) {
      toast.error('ليس لديك صلاحية للوصول إلى هذه الصفحة');
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  // ============================================
  // DATA FETCHING
  // ============================================

  /**
   * Fetch user by ID
   */
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useUser(id || '');

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Update user mutation
   */
  const updateUser = useUpdateUser();

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handle form submission
   * Updates user and navigates to list on success
   */
  const handleSubmit = useCallback(
    async (data: UpdateUserInput) => {
      if (!id) return;

      await updateUser.mutateAsync({
        id,
        data,
      });
      // Success toast shown by mutation
      // Navigate to users list
      router.push('/management/system/users/list');
    },
    [id, updateUser, router]
  );

  /**
   * Handle cancel
   * Navigate back to list
   */
  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  /**
   * Handle back
   * Navigate to list
   */
  const handleBack = useCallback(() => {
    router.push('/management/system/users/list');
  }, [router]);

  /**
   * Handle retry on error
   */
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // ============================================
  // EARLY RETURN - GUARD NOT MET
  // ============================================

  // Don't render anything if user is not admin
  if (!isAdmin) {
    return null;
  }

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb Skeleton */}
        <div className="h-5 w-64 bg-[var(--bg-tertiary)] rounded animate-pulse" />

        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-9 w-48 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          <div className="h-5 w-96 bg-[var(--bg-tertiary)] rounded animate-pulse" />
        </div>

        {/* Form Skeleton */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
          <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse" />
                <div className="h-10 w-full bg-[var(--bg-tertiary)] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================

  if (error) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm" dir="rtl">
          <button
            onClick={handleBack}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            إدارة المستخدمين
          </button>
          <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
          <span className="text-[var(--text-primary)] font-medium">تعديل مستخدم</span>
        </nav>

        {/* Page Header */}
        <div dir="rtl">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">تعديل مستخدم</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {error.statusCode === 404
              ? 'المستخدم المطلوب غير موجود'
              : 'حدث خطأ أثناء تحميل المستخدم'}
          </p>
        </div>

        {/* Error State */}
        <ErrorState error={error} onRetry={handleRetry} />

        {/* Back Button */}
        <div>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة إلى القائمة
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // NOT FOUND STATE
  // ============================================

  if (!user) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm" dir="rtl">
          <button
            onClick={handleBack}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            إدارة المستخدمين
          </button>
          <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
          <span className="text-[var(--text-primary)] font-medium">تعديل مستخدم</span>
        </nav>

        {/* Page Header */}
        <div dir="rtl">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">تعديل مستخدم</h1>
          <p className="text-[var(--text-secondary)] mt-1">المستخدم المطلوب غير موجود</p>
        </div>

        {/* Not Found Message */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-12">
          <div className="text-center">
            <p className="text-[var(--text-secondary)] mb-4">
              لم يتم العثور على المستخدم المطلوب. قد يكون محذوفاً أو غير موجود.
            </p>
            <button
              onClick={handleBack}
              className="px-6 py-3 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            >
              العودة إلى القائمة
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN CONTENT
  // ============================================

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm" dir="rtl">
        <button
          onClick={handleBack}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          إدارة المستخدمين
        </button>
        <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
        <span className="text-[var(--text-primary)] font-medium">
          تعديل مستخدم: {user.username}
        </span>
      </nav>

      {/* Page Header */}
      <div dir="rtl">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">تعديل مستخدم</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          قم بتعديل بيانات المستخدم: {user.username}
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
        <UserForm
          mode="edit"
          initialData={user}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={updateUser.isPending}
        />
      </div>
    </div>
  );
}
