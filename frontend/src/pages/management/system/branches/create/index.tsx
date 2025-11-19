/**
 * Create Branch Page - Container Component
 * Admin-only page for creating new branches
 *
 * Architecture:
 * - Business logic in useCreateBranch hook
 * - Presentational component (BranchForm)
 * - This page only orchestrates flow (container pattern)
 *
 * Features:
 * - Admin-only access guard (redirect accountants)
 * - Create new branch
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
import { useCreateBranch } from '@/hooks/useBranches';
import { BranchForm } from '@/components/branches/BranchForm';
import type { CreateBranchInput } from '#/entity';
import { toast } from 'sonner';

// ============================================
// PAGE COMPONENT
// ============================================

export default function CreateBranchPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();

  // ============================================
  // ADMIN GUARD
  // ============================================

  /**
   * Redirect non-admin users
   * Only admins can create branches
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
   * Create branch mutation
   */
  const createBranch = useCreateBranch();

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handle form submission
   * Creates branch and navigates to list on success
   */
  const handleSubmit = useCallback(
    async (data: CreateBranchInput) => {
      try {
        await createBranch.mutateAsync(data);
        // Success toast shown by mutation
        // Navigate to branches list
        router.push('/management/system/branches/list');
      } catch (error) {
        // Error toast shown by global API interceptor
        // Error is re-thrown so form can handle it if needed
        throw error;
      }
    },
    [createBranch, router]
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
          onClick={() => router.push('/management/system/branches/list')}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          إدارة الفروع
        </button>
        <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
        <span className="text-[var(--text-primary)] font-medium">إضافة فرع جديد</span>
      </nav>

      {/* Page Header */}
      <div dir="rtl">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">إضافة فرع جديد</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          قم بإضافة فرع جديد لتنظيم العمليات وتخصيص المحاسبين
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
        <BranchForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={createBranch.isPending}
        />
      </div>
    </div>
  );
}
