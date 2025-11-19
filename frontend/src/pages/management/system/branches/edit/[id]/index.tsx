/**
 * Edit Branch Page - Container Component
 * Admin-only page for editing existing branches
 *
 * Architecture:
 * - Business logic in useBranch and useUpdateBranch hooks
 * - Presentational component (BranchForm)
 * - This page only orchestrates flow (container pattern)
 *
 * Features:
 * - Admin-only access guard (redirect accountants)
 * - Fetch branch by ID
 * - Edit branch details (name, location, managerName, phone, isActive)
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
import { useBranch, useUpdateBranch } from '@/hooks/useBranches';
import { BranchForm } from '@/components/branches/BranchForm';
import { ErrorState } from '@/components/common/ErrorState';
import type { UpdateBranchInput } from '#/entity';
import { toast } from 'sonner';

// ============================================
// PAGE COMPONENT
// ============================================

export default function EditBranchPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();

  // ============================================
  // ADMIN GUARD
  // ============================================

  /**
   * Redirect non-admin users
   * Only admins can edit branches
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
   * Fetch branch by ID
   */
  const {
    data: branch,
    isLoading,
    error,
    refetch,
  } = useBranch(id || '', {
    enabled: !!id && isAdmin,
  });

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Update branch mutation
   */
  const updateBranch = useUpdateBranch();

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handle form submission
   * Updates branch and navigates to list on success
   */
  const handleSubmit = useCallback(
    async (data: UpdateBranchInput) => {
      if (!id) return;

      await updateBranch.mutateAsync({
        id,
        data,
      });
      // Success toast shown by mutation
      // Navigate to branches list
      router.push('/management/system/branches/list');
    },
    [id, updateBranch, router]
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
    router.push('/management/system/branches/list');
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
            إدارة الفروع
          </button>
          <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
          <span className="text-[var(--text-primary)] font-medium">تعديل فرع</span>
        </nav>

        {/* Page Header */}
        <div dir="rtl">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">تعديل فرع</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {error.statusCode === 404 ? 'الفرع المطلوب غير موجود' : 'حدث خطأ أثناء تحميل الفرع'}
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

  if (!branch) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm" dir="rtl">
          <button
            onClick={handleBack}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            إدارة الفروع
          </button>
          <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
          <span className="text-[var(--text-primary)] font-medium">تعديل فرع</span>
        </nav>

        {/* Page Header */}
        <div dir="rtl">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">تعديل فرع</h1>
          <p className="text-[var(--text-secondary)] mt-1">الفرع المطلوب غير موجود</p>
        </div>

        {/* Not Found Message */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-12">
          <div className="text-center">
            <p className="text-[var(--text-secondary)] mb-4">
              لم يتم العثور على الفرع المطلوب. قد يكون محذوفاً أو غير موجود.
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
          إدارة الفروع
        </button>
        <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
        <span className="text-[var(--text-primary)] font-medium">تعديل فرع: {branch.name}</span>
      </nav>

      {/* Page Header */}
      <div dir="rtl">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">تعديل فرع</h1>
        <p className="text-[var(--text-secondary)] mt-1">قم بتعديل بيانات الفرع: {branch.name}</p>
      </div>

      {/* Form Card */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
        <BranchForm
          mode="edit"
          initialData={branch}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={updateBranch.isPending}
        />
      </div>
    </div>
  );
}
