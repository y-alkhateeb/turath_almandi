/**
 * Edit Transaction Page - Container Component
 * Handles transaction editing flow
 *
 * Architecture:
 * - Business logic in useTransaction and useUpdateTransaction hooks
 * - Presentational component (TransactionForm)
 * - This page only orchestrates flow (container pattern)
 *
 * Features:
 * - Fetch transaction by ID
 * - Update transaction
 * - Navigate to list on success
 * - Handle not found (404) error
 * - Handle errors with toast (global interceptor)
 * - Breadcrumb navigation
 * - Loading state during fetch and submission
 * - Cancel navigation
 * - Strict typing
 */

import { useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import { useRouter } from '@/routes/hooks';
import { useParams } from '@/routes/hooks';
import { useTransaction, useUpdateTransaction } from '@/hooks/useTransactions';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { ErrorState } from '@/components/common/ErrorState';
import type { UpdateTransactionInput } from '#/entity';

// ============================================
// PAGE COMPONENT
// ============================================

export default function EditTransactionPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  // ============================================
  // DATA FETCHING
  // ============================================

  /**
   * Fetch transaction by ID
   */
  const {
    data: transaction,
    isLoading,
    error,
    refetch,
  } = useTransaction(id || '', {
    enabled: !!id,
  });

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Update transaction mutation
   */
  const updateTransaction = useUpdateTransaction();

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handle form submission
   * Updates transaction and navigates to list on success
   */
  const handleSubmit = useCallback(
    async (data: UpdateTransactionInput) => {
      if (!id) return;

      try {
        await updateTransaction.mutateAsync({ id, data });
        // Success toast shown by mutation
        // Navigate to transactions list
        router.push('/management/transactions/list');
      } catch (error) {
        // Error toast shown by global API interceptor
        // Error is re-thrown so form can handle it if needed
        throw error;
      }
    },
    [id, updateTransaction, router]
  );

  /**
   * Handle cancel
   * Navigate back to list
   */
  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  /**
   * Handle retry on error
   */
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

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
            {Array.from({ length: 6 }).map((_, i) => (
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
            onClick={() => router.push('/management/transactions/list')}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            العمليات المالية
          </button>
          <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
          <span className="text-[var(--text-primary)] font-medium">تعديل عملية</span>
        </nav>

        {/* Page Header */}
        <div dir="rtl">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">تعديل عملية</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {error.statusCode === 404
              ? 'العملية المطلوبة غير موجودة'
              : 'حدث خطأ أثناء تحميل العملية'}
          </p>
        </div>

        {/* Error State */}
        <ErrorState error={error} onRetry={handleRetry} />
      </div>
    );
  }

  // ============================================
  // NOT FOUND STATE
  // ============================================

  if (!transaction) {
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
          <span className="text-[var(--text-primary)] font-medium">تعديل عملية</span>
        </nav>

        {/* Page Header */}
        <div dir="rtl">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">تعديل عملية</h1>
          <p className="text-[var(--text-secondary)] mt-1">العملية المطلوبة غير موجودة</p>
        </div>

        {/* Not Found Message */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-12">
          <div className="text-center">
            <p className="text-[var(--text-secondary)] mb-4">
              لم يتم العثور على العملية المطلوبة. قد تكون محذوفة أو غير موجودة.
            </p>
            <button
              onClick={() => router.push('/management/transactions/list')}
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
          onClick={() => router.push('/management/transactions/list')}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          العمليات المالية
        </button>
        <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
        <span className="text-[var(--text-primary)] font-medium">تعديل عملية</span>
      </nav>

      {/* Page Header */}
      <div dir="rtl">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">تعديل عملية</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          قم بتعديل بيانات العملية #{transaction.id.substring(0, 8)}...
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
        <TransactionForm
          mode="edit"
          initialData={transaction}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={updateTransaction.isPending}
        />
      </div>
    </div>
  );
}
