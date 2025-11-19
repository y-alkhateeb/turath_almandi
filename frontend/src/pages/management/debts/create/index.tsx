/**
 * Create Debt Page - Container Component
 * Handles debt creation flow
 *
 * Architecture:
 * - Business logic in useCreateDebt hook
 * - Presentational component (DebtForm)
 * - This page only orchestrates flow (container pattern)
 *
 * Features:
 * - Create new debt
 * - Navigate to list on success
 * - Handle errors with toast (global interceptor)
 * - Breadcrumb navigation
 * - Loading state during submission
 * - Cancel navigation
 * - Strict typing
 */

import { useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import { useRouter } from '@/routes/hooks';
import { useCreateDebt } from '@/hooks/useDebts';
import { DebtForm } from '@/components/debts/DebtForm';
import type { CreateDebtInput } from '#/entity';

// ============================================
// PAGE COMPONENT
// ============================================

export default function CreateDebtPage() {
  const router = useRouter();

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Create debt mutation
   */
  const createDebt = useCreateDebt();

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handle form submission
   * Creates debt and navigates to list on success
   */
  const handleSubmit = useCallback(
    async (data: CreateDebtInput) => {
      try {
        await createDebt.mutateAsync(data);
        // Success toast shown by mutation
        // Navigate to debts list
        router.push('/management/debts/list');
      } catch (error) {
        // Error toast shown by global API interceptor
        // Error is re-thrown so form can handle it if needed
        throw error;
      }
    },
    [createDebt, router]
  );

  /**
   * Handle cancel
   * Navigate back to list
   */
  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm" dir="rtl">
        <button
          onClick={() => router.push('/management/debts/list')}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          إدارة الديون
        </button>
        <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
        <span className="text-[var(--text-primary)] font-medium">إضافة دين جديد</span>
      </nav>

      {/* Page Header */}
      <div dir="rtl">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">إضافة دين جديد</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          قم بإضافة دين جديد لتتبع المستحقات والدفعات
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
        <DebtForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={createDebt.isPending}
        />
      </div>
    </div>
  );
}
