/**
 * Branches List Page - Container Component
 * Admin-only page for managing branches
 *
 * Architecture:
 * - Business logic in hooks (useAllBranches, useUpdateBranch, useDeleteBranch)
 * - Presentational component (BranchList)
 * - This page only orchestrates components (container pattern)
 *
 * Features:
 * - Admin-only access guard (redirect accountants)
 * - List all branches (including inactive)
 * - Toggle branch active/inactive status
 * - Add branch button → navigate to create
 * - Edit branch → navigate to edit page
 * - Delete branch (soft delete/deactivate) with confirmation
 * - Loading states with skeleton
 * - Error and empty states
 * - RTL support
 * - Strict typing
 */

import { useCallback, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from '@/routes/hooks';
import { useAuth } from '@/hooks/useAuth';
import { useAllBranches, useUpdateBranch, useDeleteBranch } from '@/hooks/useBranches';
import { BranchList } from '@/components/branches/BranchList';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { ListSkeleton } from '@/components/skeletons/ListSkeleton';
import { toast } from 'sonner';

// ============================================
// PAGE COMPONENT
// ============================================

export default function BranchesListPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();

  // ============================================
  // ADMIN GUARD
  // ============================================

  /**
   * Redirect non-admin users
   * Only admins can manage branches
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
   * Fetch all branches (including inactive)
   */
  const {
    data: branches = [],
    isLoading,
    error,
    refetch,
  } = useAllBranches();

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Update branch mutation (for toggle active)
   */
  const updateBranch = useUpdateBranch();

  /**
   * Delete branch mutation (soft delete)
   */
  const deleteBranch = useDeleteBranch();

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handle toggle active status
   * Immediately updates isActive state
   */
  const handleToggleActive = useCallback(
    async (id: string) => {
      const branch = branches.find((b) => b.id === id);
      if (!branch) return;

      try {
        await updateBranch.mutateAsync({
          id,
          data: { isActive: !branch.isActive },
        });
        // Success toast shown by mutation
      } catch (error) {
        // Error toast shown by mutation
      }
    },
    [branches, updateBranch]
  );

  /**
   * Handle edit branch
   * Navigate to edit page
   */
  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/management/system/branches/edit/${id}`);
    },
    [router]
  );

  /**
   * Handle delete branch
   * Show confirmation dialog before soft deleting (deactivating)
   */
  const handleDelete = useCallback(
    async (id: string) => {
      const branch = branches.find((b) => b.id === id);
      if (!branch) return;

      // Show confirmation dialog
      const confirmed = window.confirm(
        `هل أنت متأكد من حذف الفرع "${branch.name}"؟\nسيتم إيقاف جميع العمليات المرتبطة بهذا الفرع.`
      );

      if (!confirmed) return;

      try {
        await deleteBranch.mutateAsync(id);
        // Success toast shown by mutation
      } catch (error) {
        // Error toast shown by mutation
      }
    },
    [branches, deleteBranch]
  );

  /**
   * Handle add new branch
   * Navigate to create page
   */
  const handleAddNew = useCallback(() => {
    router.push('/management/system/branches/create');
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
      <div className="space-y-6" dir="rtl">
        {/* Page Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-9 w-48 bg-[var(--bg-tertiary)] rounded animate-pulse" />
            <div className="h-5 w-64 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-[var(--bg-tertiary)] rounded animate-pulse" />
        </div>

        {/* Table Skeleton */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
          <ListSkeleton items={5} variant="default" />
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
        <div className="flex items-center justify-between" dir="rtl">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة الفروع</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              إضافة وإدارة فروع النظام
            </p>
          </div>
        </div>
        <ErrorState error={error} onRetry={handleRetry} />
      </div>
    );
  }

  // ============================================
  // EMPTY STATE
  // ============================================

  if (branches.length === 0) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between" dir="rtl">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة الفروع</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              إضافة وإدارة فروع النظام
            </p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة فرع
          </button>
        </div>

        {/* Empty State */}
        <EmptyState
          icon={<Plus className="w-8 h-8 text-primary-600" />}
          title="لا توجد فروع"
          description="ابدأ بإضافة أول فرع لتنظيم العمليات والمحاسبين."
          action={{
            label: 'إضافة فرع جديد',
            onClick: handleAddNew,
          }}
        />
      </div>
    );
  }

  // ============================================
  // MAIN CONTENT
  // ============================================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between" dir="rtl">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة الفروع</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            إضافة وإدارة فروع النظام ({branches.length} فرع)
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة فرع
        </button>
      </div>

      {/* Branches Table */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden">
        <BranchList
          branches={branches}
          isLoading={false}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4" dir="rtl">
        <p className="text-sm text-blue-800">
          <strong>ملاحظة:</strong> يتم تخصيص محاسب واحد لكل فرع. المحاسب يمكنه الوصول فقط إلى بيانات فرعه المخصص.
        </p>
      </div>

      {/* Loading Overlay - Shown during update/delete operation */}
      {(updateBranch.isPending || deleteBranch.isPending) && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6 shadow-lg flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-[var(--text-primary)] font-medium">
              {updateBranch.isPending ? 'جاري التحديث...' : 'جاري الحذف...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
