/**
 * Users List Page - Container Component
 * Admin-only page for managing system users
 *
 * Architecture:
 * - Business logic in hooks (useUsers, useUpdateUser, useDeleteUser)
 * - Presentational component (UserList)
 * - This page only orchestrates components (container pattern)
 *
 * Features:
 * - Admin-only access guard (redirect accountants)
 * - List all users with roles and status
 * - Toggle user active/inactive status
 * - Add user button → navigate to create
 * - Edit user → navigate to edit page
 * - Delete user (soft delete/deactivate) with confirmation
 * - Loading states with skeleton
 * - Error and empty states
 * - RTL support
 * - Strict typing
 */

import { useCallback, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from '@/routes/hooks';
import { useAuth } from '@/hooks/useAuth';
import { useUsers, useUpdateUser, useDeleteUser } from '@/hooks/useUsers';
import { UserList } from '@/components/users/UserList';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { ListSkeleton } from '@/components/skeletons/ListSkeleton';
import { toast } from 'sonner';

// ============================================
// PAGE COMPONENT
// ============================================

export default function UsersListPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();

  // ============================================
  // ADMIN GUARD
  // ============================================

  /**
   * Redirect non-admin users
   * Only admins can manage users
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
   * Fetch all users
   */
  const { data: users = [], isLoading, error, refetch } = useUsers();

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Update user mutation (for toggle active)
   */
  const updateUser = useUpdateUser();

  /**
   * Delete user mutation (soft delete)
   */
  const deleteUser = useDeleteUser();

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handle toggle active status
   * Immediately updates isActive state
   */
  const handleToggleActive = useCallback(
    async (id: string) => {
      const user = users.find((u) => u.id === id);
      if (!user) return;

      try {
        await updateUser.mutateAsync({
          id,
          data: { isActive: !user.isActive },
        });
        // Success toast shown by mutation
      } catch (_error) {
        // Error toast shown by mutation
      }
    },
    [users, updateUser]
  );

  /**
   * Handle edit user
   * Navigate to edit page
   */
  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/management/system/users/edit/${id}`);
    },
    [router]
  );

  /**
   * Handle delete user
   * Show confirmation dialog before soft deleting (deactivating)
   */
  const handleDelete = useCallback(
    async (id: string) => {
      const user = users.find((u) => u.id === id);
      if (!user) return;

      // Prevent deleting yourself
      // Note: This would be better checked with current user ID
      // For now, we'll just show a confirmation

      // Show confirmation dialog
      const confirmed = window.confirm(
        `هل أنت متأكد من تعطيل المستخدم "${user.username}"؟\nسيتم إيقاف وصوله إلى النظام.`
      );

      if (!confirmed) return;

      try {
        await deleteUser.mutateAsync(id);
        // Success toast shown by mutation
      } catch (_error) {
        // Error toast shown by mutation
      }
    },
    [users, deleteUser]
  );

  /**
   * Handle add new user
   * Navigate to create page
   */
  const handleAddNew = useCallback(() => {
    router.push('/management/system/users/create');
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
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة المستخدمين</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              إضافة وإدارة مستخدمي النظام (مدراء ومحاسبين)
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

  if (users.length === 0) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between" dir="rtl">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة المستخدمين</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              إضافة وإدارة مستخدمي النظام (مدراء ومحاسبين)
            </p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة مستخدم
          </button>
        </div>

        {/* Empty State */}
        <EmptyState
          icon={<Plus className="w-8 h-8 text-primary-600" />}
          title="لا يوجد مستخدمون"
          description="ابدأ بإضافة أول مستخدم لإدارة النظام."
          action={{
            label: 'إضافة مستخدم جديد',
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
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة المستخدمين</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            إضافة وإدارة مستخدمي النظام ({users.length} مستخدم)
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة مستخدم
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden">
        <UserList
          users={users}
          isLoading={false}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4" dir="rtl">
        <p className="text-sm text-blue-800">
          <strong>ملاحظة:</strong> المحاسبون يمكنهم الوصول فقط إلى بيانات الفرع المخصص لهم. المدراء
          يمكنهم الوصول إلى جميع البيانات في جميع الفروع.
        </p>
      </div>

      {/* Loading Overlay - Shown during update/delete operation */}
      {(updateUser.isPending || deleteUser.isPending) && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6 shadow-lg flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-[var(--text-primary)] font-medium">
              {updateUser.isPending ? 'جاري التحديث...' : 'جاري التعطيل...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
