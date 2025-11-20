/**
 * Dashboard Workbench Page - Updated
 *
 * Modern dashboard with comprehensive financial overview.
 * Uses new presentational components with strict typing.
 *
 * Features:
 * - 4 stat cards with trends (DashboardStatsCards)
 * - Line chart showing revenue vs expenses (DashboardRevenueChart)
 * - Pie chart showing category breakdown (DashboardCategoryChart)
 * - Recent transactions table (DashboardRecentTransactions)
 * - Filters with branch selector (DashboardFilters)
 * - Real-time updates via WebSocket
 * - Loading states with skeleton components
 * - Error states with ErrorState component
 * - Empty states with EmptyState component
 * - RTL support, responsive design
 *
 * Architecture:
 * - Business logic in hooks/features/useDashboardData
 * - Presentational components in components/dashboard
 * - This page only orchestrates components (container pattern)
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Activity, RefreshCw } from 'lucide-react';
import { useRouter } from '@/routes/hooks';
import { useDashboardData } from '@/hooks/features';
import { useWebSocketEvent } from '@/hooks/useWebSocket';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { CardSkeleton } from '@/components/skeletons/CardSkeleton';
import { ChartSkeleton } from '@/components/skeletons/ChartSkeleton';
import { ListSkeleton } from '@/components/skeletons/ListSkeleton';
import {
  DashboardStatsCards,
  DashboardRevenueChart,
  DashboardCategoryChart,
  DashboardRecentTransactions,
  DashboardFilters,
} from '@/components/dashboard';

export default function DashboardWorkbench() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // All business logic is in the hook
  const {
    userInfo,
    isAdmin,
    selectedDate,
    selectedBranchId,
    selectedStartDate,
    selectedEndDate,
    stats,
    branches,
    isLoading,
    setSelectedDate,
    setSelectedBranchId,
    setSelectedStartDate,
    setSelectedEndDate,
    handleRetry,
    hasNoTransactionsEver,
    error,
  } = useDashboardData();

  // ============================================
  // REAL-TIME UPDATES
  // ============================================

  /**
   * Handle real-time transaction events
   * Invalidates dashboard queries to trigger refetch
   */
  const handleTransactionEvent = useCallback(() => {
    // Invalidate dashboard stats to refetch
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  }, [queryClient]);

  // Listen to WebSocket events
  useWebSocketEvent('transaction:created', handleTransactionEvent);
  useWebSocketEvent('transaction:updated', handleTransactionEvent);
  useWebSocketEvent('transaction:deleted', handleTransactionEvent);

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    return (
      <div className="space-y-6" dir="rtl">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-9 w-48 bg-[var(--bg-tertiary)] rounded animate-pulse" />
            <div className="h-5 w-64 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          </div>
          <div className="h-10 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse" />
        </div>

        {/* Filters Skeleton */}
        <div className="h-20 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg animate-pulse" />

        {/* Stats Cards Skeleton */}
        <CardSkeleton count={4} variant="stat" />

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton variant="line" />
          <ChartSkeleton variant="pie" />
        </div>

        {/* Recent Transactions Skeleton */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
          <div className="h-6 w-32 bg-[var(--bg-tertiary)] rounded mb-4 animate-pulse" />
          <ListSkeleton items={5} variant="compact" />
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
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">لوحة التحكم</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              مرحباً بك، {userInfo?.username || 'المستخدم'}
            </p>
          </div>
        </div>
        <ErrorState error={error} onRetry={handleRetry} />
      </div>
    );
  }

  // ============================================
  // NO DATA STATE
  // ============================================

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between" dir="rtl">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">لوحة التحكم</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              مرحباً بك، {userInfo?.username || 'المستخدم'}
            </p>
          </div>
        </div>
        <EmptyState
          title="لا توجد بيانات متاحة"
          description="لم نتمكن من تحميل بيانات لوحة التحكم. يرجى المحاولة مرة أخرى."
          action={{
            label: 'إعادة المحاولة',
            onClick: handleRetry,
          }}
        />
      </div>
    );
  }

  // ============================================
  // EMPTY STATE - NO TRANSACTIONS EVER
  // ============================================

  if (hasNoTransactionsEver) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between" dir="rtl">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">لوحة التحكم</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              مرحباً بك، {userInfo?.username || 'المستخدم'}
            </p>
          </div>
        </div>

        {/* Empty State */}
        <EmptyState
          icon={<Activity className="w-8 h-8 text-primary-600" />}
          title="ابدأ رحلتك المالية"
          description="لم يتم تسجيل أي عمليات مالية بعد. ابدأ بإضافة أول إيراد أو مصروف لتتبع أموالك وإدارتها بشكل احترافي."
          action={{
            label: 'إضافة عملية جديدة',
            onClick: () => router.push('/transactions'),
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
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">لوحة التحكم</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            مرحباً بك، {userInfo?.username || 'المستخدم'}
          </p>
        </div>
        <button
          onClick={handleRetry}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          تحديث
        </button>
      </div>

      {/* Filters */}
      <DashboardFilters
        filters={{
          date: selectedDate,
          branchId: isAdmin ? selectedBranchId : null,
          startDate: selectedStartDate,
          endDate: selectedEndDate,
        }}
        branches={branches || []}
        onChange={(filters) => {
          if (filters.date !== undefined) setSelectedDate(filters.date || '');
          if (filters.branchId !== undefined) setSelectedBranchId(filters.branchId || 'ALL');
          if (filters.startDate !== undefined) setSelectedStartDate(filters.startDate);
          if (filters.endDate !== undefined) setSelectedEndDate(filters.endDate);
        }}
      />

      {/* Stats Cards */}
      <DashboardStatsCards stats={stats} isLoading={false} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardRevenueChart data={stats.revenueData} isLoading={false} />
        <DashboardCategoryChart data={stats.categoryData} isLoading={false} />
      </div>

      {/* Recent Transactions */}
      <DashboardRecentTransactions transactions={stats.recentTransactions} isLoading={false} />

      {/* Info: No Transactions Today (if applicable) */}
      {stats.todayTransactions === 0 && (
        <div
          className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg"
          dir="rtl"
        >
          <Activity className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">لا توجد عمليات لهذا التاريخ</p>
            <p className="text-sm text-blue-700 mt-1">
              لم يتم تسجيل أي عمليات مالية في التاريخ المحدد.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
