/**
 * Transactions List Page - Container Component
 * Manages transactions with filters, pagination, and CRUD operations
 *
 * Architecture:
 * - Business logic in hooks (useTransactions, useTransactionFilters, useDeleteTransaction)
 * - Presentational components (TransactionList, TransactionFilters)
 * - This page only orchestrates components (container pattern)
 *
 * Features:
 * - Paginated transactions list
 * - Comprehensive filters (type, category, payment method, branch, date range, search)
 * - Delete transaction with confirmation
 * - Navigate to create/edit pages
 * - Loading states with skeleton
 * - Error and empty states
 * - RTL support
 * - Strict typing
 */

import { useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from '@/routes/hooks';
import {
  useTransactions,
  useTransactionFilters,
  useDeleteTransaction,
} from '@/hooks/useTransactions';
import { useBranches } from '@/hooks/useBranches';
import { TransactionList } from '@/components/transactions/TransactionList';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import { Pagination } from '@/components/ui/Pagination';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { ListSkeleton } from '@/components/skeletons/ListSkeleton';

// ============================================
// PAGE COMPONENT
// ============================================

export default function TransactionsListPage() {
  const router = useRouter();

  // ============================================
  // FILTERS & PAGINATION STATE
  // ============================================

  const {
    filters,
    setFilter,
    setFilters,
    setPage,
    resetFilters,
  } = useTransactionFilters({
    page: 1,
    limit: 20, // Default 20 items per page
  });

  // ============================================
  // DATA FETCHING
  // ============================================

  /**
   * Fetch paginated transactions with filters
   */
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useTransactions(filters);

  /**
   * Fetch branches for filter dropdown (admins only)
   */
  const { data: branches = [], isLoading: isLoadingBranches } = useBranches();

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Delete transaction mutation
   */
  const deleteTransaction = useDeleteTransaction();

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handle filter changes
   * Resets to page 1 when filters change
   */
  const handleFiltersChange = useCallback(
    (newFilters: typeof filters) => {
      setFilters({ ...newFilters, page: 1 });
    },
    [setFilters]
  );

  /**
   * Handle page change
   */
  const handlePageChange = useCallback(
    (page: number) => {
      setPage(page);
    },
    [setPage]
  );

  /**
   * Handle edit transaction
   * Navigate to edit page
   */
  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/management/transactions/edit/${id}`);
    },
    [router]
  );

  /**
   * Handle delete transaction
   * Show confirmation dialog before deleting
   */
  const handleDelete = useCallback(
    async (id: string) => {
      // Show confirmation dialog
      const confirmed = window.confirm(
        'هل أنت متأكد من حذف هذه العملية؟ لا يمكن التراجع عن هذا الإجراء.'
      );

      if (!confirmed) return;

      try {
        await deleteTransaction.mutateAsync(id);
        // Success toast shown by mutation
        // Queries automatically invalidated by mutation
      } catch (error) {
        // Error toast shown by global API interceptor
      }
    },
    [deleteTransaction]
  );

  /**
   * Handle add new transaction
   * Navigate to create page
   */
  const handleAddNew = useCallback(() => {
    router.push('/management/transactions/create');
  }, [router]);

  /**
   * Handle retry on error
   */
  const handleRetry = useCallback(() => {
    refetchTransactions();
  }, [refetchTransactions]);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const transactions = transactionsData?.data || [];
  const currentPage = transactionsData?.meta.currentPage || 1;
  const totalPages = transactionsData?.meta.totalPages || 0;
  const total = transactionsData?.meta.total || 0;

  const isLoading = isLoadingTransactions || isLoadingBranches;

  // Check if we have any transactions at all (not just for current filters)
  const hasNoTransactionsAtAll = !isLoading && total === 0 && Object.keys(filters).length <= 2; // Only page and limit

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading && !transactionsData) {
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

        {/* Filters Skeleton */}
        <div className="h-24 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg animate-pulse" />

        {/* Table Skeleton */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
          <ListSkeleton items={10} variant="default" />
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================

  if (transactionsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between" dir="rtl">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">العمليات المالية</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              إدارة جميع الإيرادات والمصروفات
            </p>
          </div>
        </div>
        <ErrorState error={transactionsError} onRetry={handleRetry} />
      </div>
    );
  }

  // ============================================
  // EMPTY STATE - NO TRANSACTIONS AT ALL
  // ============================================

  if (hasNoTransactionsAtAll) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between" dir="rtl">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">العمليات المالية</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              إدارة جميع الإيرادات والمصروفات
            </p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة عملية
          </button>
        </div>

        {/* Empty State */}
        <EmptyState
          icon={<Plus className="w-8 h-8 text-primary-600" />}
          title="لا توجد عمليات مالية"
          description="ابدأ بإضافة أول إيراد أو مصروف لتتبع أموالك وإدارتها بشكل احترافي."
          action={{
            label: 'إضافة عملية جديدة',
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
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">العمليات المالية</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            إدارة جميع الإيرادات والمصروفات ({total} عملية)
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة عملية
        </button>
      </div>

      {/* Filters */}
      <TransactionFilters
        filters={filters}
        onChange={handleFiltersChange}
        branches={branches}
      />

      {/* Transactions List */}
      {transactions.length === 0 ? (
        // Empty state for current filters
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-12">
          <EmptyState
            title="لا توجد نتائج"
            description="لم يتم العثور على عمليات مالية تطابق الفلاتر المحددة. حاول تعديل الفلاتر أو مسحها."
            action={{
              label: 'مسح جميع الفلاتر',
              onClick: () => resetFilters(),
            }}
          />
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden">
            <TransactionList
              transactions={transactions}
              isLoading={isLoadingTransactions && !!transactionsData} // Show skeleton only on refetch
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between" dir="rtl">
              <p className="text-sm text-[var(--text-secondary)]">
                عرض الصفحة {currentPage} من {totalPages}
              </p>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                maxVisiblePages={5}
                showFirstLast
              />
            </div>
          )}
        </>
      )}

      {/* Loading Overlay - Shown during delete operation */}
      {deleteTransaction.isPending && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6 shadow-lg flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-[var(--text-primary)] font-medium">جاري الحذف...</span>
          </div>
        </div>
      )}
    </div>
  );
}
