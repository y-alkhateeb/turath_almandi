/**
 * Debts List Page - Container Component
 * Manages debts with filters, pagination, statistics, and payment dialog
 *
 * Architecture:
 * - Business logic in hooks (useDebts, useDebtFilters, useDebtSummary, usePayDebt)
 * - Presentational components (DebtList, DebtStatsCards, Dialog for PayDebtForm)
 * - This page only orchestrates components (container pattern)
 *
 * Features:
 * - Paginated debts list with filters
 * - Debt summary statistics in cards
 * - Status filter (all, active, partial, paid, overdue)
 * - Branch filter (admin only)
 * - Date range filters
 * - Pay debt dialog with PayDebtForm
 * - Add debt button → navigate to create
 * - View debt → navigate to view page
 * - Pagination controls
 * - Loading states with skeleton
 * - Error and empty states
 * - RTL support
 * - Strict typing
 */

import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from '@/routes/hooks';
import {
  useDebts,
  useDebtFilters,
  useDebtSummary,
  usePayDebt,
  useDebt,
} from '@/hooks/useDebts';
import { useBranches } from '@/hooks/useBranches';
import { useAuth } from '@/hooks/useAuth';
import { DebtList } from '@/components/debts/DebtList';
import { DebtStatsCards } from '@/components/debts/DebtStatsCards';
import { Pagination } from '@/components/ui/Pagination';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog';
import { PayDebtModal } from '@/components/PayDebtModal';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { ListSkeleton } from '@/components/skeletons/ListSkeleton';
import { CardSkeleton } from '@/components/skeletons/CardSkeleton';

// ============================================
// PAGE COMPONENT
// ============================================

export default function DebtsListPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();

  // ============================================
  // DIALOG STATE
  // ============================================

  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);

  // ============================================
  // FILTERS & PAGINATION STATE
  // ============================================

  const {
    filters,
    setFilter,
    setFilters,
    setPage,
    resetFilters,
  } = useDebtFilters({
    page: 1,
    limit: 20, // Default 20 items per page
  });

  // ============================================
  // DATA FETCHING
  // ============================================

  /**
   * Fetch debt summary statistics
   */
  const {
    data: summary,
    isLoading: isLoadingSummary,
    error: summaryError,
  } = useDebtSummary(filters.branchId);

  /**
   * Fetch paginated debts with filters
   */
  const {
    data: debtsData,
    isLoading: isLoadingDebts,
    error: debtsError,
    refetch: refetchDebts,
  } = useDebts(filters);

  /**
   * Fetch branches for filter dropdown (admins only)
   */
  const { data: branches = [] } = useBranches();

  /**
   * Fetch selected debt for pay dialog
   */
  const { data: selectedDebt } = useDebt(selectedDebtId || '', {
    enabled: !!selectedDebtId,
  });

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Pay debt mutation
   */
  const payDebt = usePayDebt();

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handle filter changes
   * Resets to page 1 when filters change
   */
  const handleFiltersChange = useCallback(
    (key: string, value: string | undefined) => {
      setFilter(key as keyof typeof filters, value);
      setPage(1); // Reset to page 1 when filters change
    },
    [setFilter, setPage]
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
   * Handle view debt
   * Navigate to view page
   */
  const handleView = useCallback(
    (id: string) => {
      router.push(`/management/debts/view/${id}`);
    },
    [router]
  );

  /**
   * Handle pay debt
   * Open pay dialog
   */
  const handlePay = useCallback((id: string) => {
    setSelectedDebtId(id);
    setIsPayDialogOpen(true);
  }, []);

  /**
   * Handle close pay dialog
   */
  const handleClosePayDialog = useCallback(() => {
    setIsPayDialogOpen(false);
    setSelectedDebtId(null);
  }, []);

  /**
   * Handle add new debt
   * Navigate to create page
   */
  const handleAddNew = useCallback(() => {
    router.push('/management/debts/create');
  }, [router]);

  /**
   * Handle retry on error
   */
  const handleRetry = useCallback(() => {
    refetchDebts();
  }, [refetchDebts]);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const debts = debtsData?.data || [];
  const currentPage = debtsData?.meta.currentPage || 1;
  const totalPages = debtsData?.meta.totalPages || 0;
  const total = debtsData?.meta.total || 0;

  const isLoading = isLoadingSummary || isLoadingDebts;
  const error = summaryError || debtsError;

  // Check if we have any debts at all (not just for current filters)
  const hasNoDebtsAtAll = !isLoading && total === 0 && Object.keys(filters).length <= 2; // Only page and limit

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading && !debtsData && !summary) {
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

        {/* Stats Cards Skeleton */}
        <CardSkeleton count={5} variant="stat" />

        {/* Filters Skeleton */}
        <div className="h-20 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg animate-pulse" />

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

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between" dir="rtl">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة الديون</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              تتبع وإدارة جميع الديون والمستحقات
            </p>
          </div>
        </div>
        <ErrorState error={error} onRetry={handleRetry} />
      </div>
    );
  }

  // ============================================
  // EMPTY STATE - NO DEBTS AT ALL
  // ============================================

  if (hasNoDebtsAtAll) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between" dir="rtl">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة الديون</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              تتبع وإدارة جميع الديون والمستحقات
            </p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة دين
          </button>
        </div>

        {/* Empty State */}
        <EmptyState
          icon={<Plus className="w-8 h-8 text-primary-600" />}
          title="لا توجد ديون مسجلة"
          description="ابدأ بإضافة أول دين لتتبع المستحقات وإدارة الدفعات."
          action={{
            label: 'إضافة دين جديد',
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
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة الديون</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            تتبع وإدارة جميع الديون والمستحقات ({total} دين)
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة دين
        </button>
      </div>

      {/* Stats Cards */}
      {summary && (
        <DebtStatsCards
          summary={summary}
          isLoading={isLoadingSummary}
        />
      )}

      {/* Filters */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-4" dir="rtl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              الحالة
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFiltersChange('status', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">الكل</option>
              <option value="ACTIVE">نشط</option>
              <option value="PARTIAL">دفع جزئي</option>
              <option value="PAID">مدفوع</option>
              <option value="OVERDUE">متأخر</option>
            </select>
          </div>

          {/* Branch Filter - Admin Only */}
          {isAdmin && branches.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                الفرع
              </label>
              <select
                value={filters.branchId || ''}
                onChange={(e) => handleFiltersChange('branchId', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">جميع الفروع</option>
                {branches
                  .filter((branch) => !branch.deletedAt)
                  .map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Reset Button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              className="w-full px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md hover:bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
            >
              مسح الفلاتر
            </button>
          </div>
        </div>
      </div>

      {/* Debts List */}
      {debts.length === 0 ? (
        // Empty state for current filters
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-12">
          <EmptyState
            title="لا توجد نتائج"
            description="لم يتم العثور على ديون تطابق الفلاتر المحددة. حاول تعديل الفلاتر أو مسحها."
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
            <DebtList
              debts={debts}
              isLoading={isLoadingDebts && !!debtsData} // Show skeleton only on refetch
              onPay={handlePay}
              onView={handleView}
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

      {/* Pay Debt Dialog */}
      {selectedDebt && (
        <PayDebtModal
          isOpen={isPayDialogOpen}
          onClose={handleClosePayDialog}
          debt={selectedDebt}
        />
      )}
    </div>
  );
}
