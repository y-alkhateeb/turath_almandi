/**
 * Create Transaction Page - Container Component
 * Handles transaction creation flow
 *
 * Architecture:
 * - Business logic in useCreateTransaction hook
 * - Presentational component (TransactionForm)
 * - This page only orchestrates flow (container pattern)
 *
 * Features:
 * - Create new transaction
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
import { useCreateTransaction } from '@/hooks/useTransactions';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import type { CreateTransactionInput } from '#/entity';

// ============================================
// PAGE COMPONENT
// ============================================

export default function CreateTransactionPage() {
  const router = useRouter();

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Create transaction mutation
   */
  const createTransaction = useCreateTransaction();

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handle form submission
   * Creates transaction and navigates to list on success
   */
  const handleSubmit = useCallback(
    async (data: CreateTransactionInput) => {
      try {
        await createTransaction.mutateAsync(data);
        // Success toast shown by mutation
        // Navigate to transactions list
        router.push('/management/transactions/list');
      } catch (error) {
        // Error toast shown by global API interceptor
        // Error is re-thrown so form can handle it if needed
        throw error;
      }
    },
    [createTransaction, router]
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
          onClick={() => router.push('/management/transactions/list')}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          العمليات المالية
        </button>
        <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
        <span className="text-[var(--text-primary)] font-medium">إضافة عملية جديدة</span>
      </nav>

      {/* Page Header */}
      <div dir="rtl">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">إضافة عملية جديدة</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          قم بإضافة إيراد أو مصروف جديد إلى النظام
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
        <TransactionForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={createTransaction.isPending}
        />
      </div>
    </div>
  );
}
