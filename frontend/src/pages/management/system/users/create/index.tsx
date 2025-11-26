/**
 * Create User Page - Container Component
 * Admin-only page for creating new system users
 *
 * Architecture:
 * - Business logic in useCreateUser hook
 * - Presentational component (UserForm)
 * - This page only orchestrates flow (container pattern)
 *
 * Features:
 * - Admin-only access guard (redirect accountants)
 * - Create new user (admin or accountant)
 * - Navigate to list on success
 * - Handle errors with toast (global interceptor)
 * - Breadcrumb navigation
 * - Loading state during submission
 * - Cancel navigation
 * - Strict typing
 */

import { useCallback, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { useRouter } from '@/routes/hooks';
import { useAuth } from '@/hooks/useAuth';
import { useCreateUser } from '@/hooks/useUsers';
import { UserForm } from '@/components/users/UserForm';
import type { CreateUserInput } from '#/entity';
import { toast } from 'sonner';

// ============================================
// PAGE COMPONENT
// ============================================

export default function CreateUserPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();

  // ============================================
  // ADMIN GUARD
  // ============================================

  /**
   * Redirect non-admin users
   * Only admins can create users
   */
  useEffect(() => {
    if (!isAdmin) {
      toast.error('ليس لديك صلاحية للوصول إلى هذه الصفحة');
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Create user mutation
   */
  const createUser = useCreateUser();

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handle form submission
   * Creates user and navigates to list on success
   */
  const handleSubmit = useCallback(
    async (data: CreateUserInput) => {
      try {
        await createUser.mutateAsync(data);
        // Success toast shown by mutation
        // Navigate to users list
        router.push('/management/system/users/list');
      } catch (error) {
        // Error toast shown by global API interceptor
        // Error is re-thrown so form can handle it if needed
        throw error;
      }
    },
    [createUser, router]
  );

  /**
   * Handle cancel
   * Navigate back to list
   */
  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  // ============================================
  // EARLY RETURN - GUARD NOT MET
  // ============================================

  // Don't render anything if user is not admin
  if (!isAdmin) {
    return null;
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm" dir="rtl">
        <button
          onClick={() => router.push('/management/system/users/list')}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          إدارة المستخدمين
        </button>
        <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
        <span className="text-[var(--text-primary)] font-medium">إضافة مستخدم جديد</span>
      </nav>

      {/* Page Header */}
      <div dir="rtl">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">إضافة مستخدم جديد</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          قم بإضافة مستخدم جديد (مدير أو محاسب) للوصول إلى النظام
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
        <UserForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={createUser.isPending}
        />
      </div>
    </div>
  );
}
