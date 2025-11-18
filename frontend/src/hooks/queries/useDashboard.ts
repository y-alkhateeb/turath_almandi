/**
 * useDashboard Hooks
 * React Query hooks for dashboard statistics and charts
 *
 * Features:
 * - Dashboard stats query with branch and date filtering
 * - Revenue data query for time-series charts
 * - Category data query for pie/bar charts
 * - Recent transactions query
 * - Branch comparison query (admin only)
 * - Filter state management hook
 * - Auto-filter accountants to their branch
 * - 5-minute stale time for all queries
 * - Full error handling and strict typing
 */

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import dashboardService from '@/api/services/dashboardService';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { useAuth } from '../useAuth';
import type { Transaction } from '#/entity';
import type {
  DashboardStats,
  RevenueDataPoint,
  CategoryDataPoint,
  BranchPerformance,
  DashboardQueryFilters,
} from '#/api';
import { ApiError } from '@/api/apiClient';

// ============================================
// QUERY HOOKS
// ============================================

/**
 * useDashboardStats Hook
 * Query comprehensive dashboard statistics
 *
 * Provides aggregated metrics:
 * - Total revenue/expenses/net profit
 * - Today's transaction count
 * - Cash vs Master card breakdown
 * - Total debts and active debts
 * - Inventory value
 *
 * @param branchId - Optional branch UUID (admins only, accountants auto-filtered)
 * @param date - Optional date filter (ISO format YYYY-MM-DD)
 * @returns Query result with DashboardStats
 *
 * @example
 * ```tsx
 * const { data: stats, isLoading } = useDashboardStats();
 * console.log(stats?.totalRevenue, stats?.netProfit);
 *
 * // Admin filtering specific branch
 * const { data: branchStats } = useDashboardStats(branchId);
 *
 * // Filter by specific date
 * const { data: yesterdayStats } = useDashboardStats(undefined, '2024-01-15');
 * ```
 */
export const useDashboardStats = (branchId?: string, date?: string) => {
  const { user, isAccountant } = useAuth();

  // Auto-filter accountants to their branch
  const appliedBranchId = isAccountant && user?.branchId ? user.branchId : branchId;

  return useQuery<DashboardStats, ApiError>({
    queryKey: queryKeys.dashboard.stats(appliedBranchId, date),
    queryFn: () =>
      dashboardService.getStats({
        branchId: appliedBranchId,
        date,
      }),
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
    retry: 1, // Only retry once on failure
  });
};

/**
 * useRevenueData Hook
 * Query time-series revenue data for charts
 *
 * Returns daily/weekly/monthly aggregated revenue and expenses
 * for line/bar charts. Auto-determines aggregation level based
 * on date range.
 *
 * @param branchId - Optional branch UUID (admins only, accountants auto-filtered)
 * @param dateRange - Optional date range {startDate, endDate} (ISO format)
 * @returns Query result with RevenueDataPoint[]
 *
 * @example
 * ```tsx
 * // Current month revenue data
 * const { data: revenueData } = useRevenueData();
 *
 * // Specific date range
 * const { data } = useRevenueData(undefined, {
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31',
 * });
 *
 * // Specific branch and date range
 * const { data } = useRevenueData(branchId, { startDate, endDate });
 * ```
 */
export const useRevenueData = (
  branchId?: string,
  dateRange?: { startDate?: string; endDate?: string },
) => {
  const { user, isAccountant } = useAuth();

  // Auto-filter accountants to their branch
  const appliedBranchId = isAccountant && user?.branchId ? user.branchId : branchId;

  const filters: Pick<DashboardQueryFilters, 'branchId' | 'startDate' | 'endDate'> = {
    branchId: appliedBranchId,
    startDate: dateRange?.startDate,
    endDate: dateRange?.endDate,
  };

  return useQuery<RevenueDataPoint[], ApiError>({
    queryKey: queryKeys.dashboard.revenueData(filters),
    queryFn: () => dashboardService.getRevenueData(filters),
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
    retry: 1,
  });
};

/**
 * useCategoryData Hook
 * Query category-based spending/revenue data for charts
 *
 * Returns aggregated spending by category for pie/bar charts.
 * Auto-sorted by value (highest first).
 *
 * @param branchId - Optional branch UUID (admins only, accountants auto-filtered)
 * @param dateRange - Optional date range {startDate, endDate} (ISO format)
 * @returns Query result with CategoryDataPoint[]
 *
 * @example
 * ```tsx
 * // Current month category breakdown
 * const { data: categories } = useCategoryData();
 *
 * // Specific date range
 * const { data } = useCategoryData(undefined, {
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31',
 * });
 *
 * // For pie chart rendering
 * {data?.map(cat => (
 *   <PieSlice
 *     key={cat.category}
 *     label={cat.category}
 *     value={cat.value}
 *     color={cat.color}
 *   />
 * ))}
 * ```
 */
export const useCategoryData = (
  branchId?: string,
  dateRange?: { startDate?: string; endDate?: string },
) => {
  const { user, isAccountant } = useAuth();

  // Auto-filter accountants to their branch
  const appliedBranchId = isAccountant && user?.branchId ? user.branchId : branchId;

  const filters: Pick<DashboardQueryFilters, 'branchId' | 'startDate' | 'endDate'> = {
    branchId: appliedBranchId,
    startDate: dateRange?.startDate,
    endDate: dateRange?.endDate,
  };

  return useQuery<CategoryDataPoint[], ApiError>({
    queryKey: queryKeys.dashboard.categoryData(filters),
    queryFn: () => dashboardService.getCategoryData(filters),
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
    retry: 1,
  });
};

/**
 * useRecentTransactions Hook
 * Query most recent transactions for dashboard overview
 *
 * Returns newest transactions ordered by date DESC.
 * Default limit: 10, Maximum limit: 50.
 *
 * @param branchId - Optional branch UUID (admins only, accountants auto-filtered)
 * @param limit - Optional limit (default: 10, max: 50)
 * @returns Query result with Transaction[]
 *
 * @example
 * ```tsx
 * // Last 10 transactions (default)
 * const { data: recent } = useRecentTransactions();
 *
 * // Last 5 transactions
 * const { data } = useRecentTransactions(undefined, 5);
 *
 * // Specific branch, last 20 transactions
 * const { data } = useRecentTransactions(branchId, 20);
 *
 * // Render transaction list
 * {data?.map(tx => (
 *   <TransactionRow key={tx.id} transaction={tx} />
 * ))}
 * ```
 */
export const useRecentTransactions = (branchId?: string, limit?: number) => {
  const { user, isAccountant } = useAuth();

  // Auto-filter accountants to their branch
  const appliedBranchId = isAccountant && user?.branchId ? user.branchId : branchId;

  return useQuery<Transaction[], ApiError>({
    queryKey: queryKeys.dashboard.recentTransactions(appliedBranchId, limit),
    queryFn: () =>
      dashboardService.getRecentTransactions({
        branchId: appliedBranchId,
        limit,
      }),
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
    retry: 1,
  });
};

/**
 * useBranchComparison Hook
 * Query branch performance comparison (ADMIN ONLY)
 *
 * Compares performance metrics across all branches:
 * - Total revenue per branch
 * - Total expenses per branch
 * - Net profit per branch
 * - Transaction count and averages
 * - Top spending category per branch
 *
 * Sorted by net profit DESC (best performing first).
 *
 * @param dateRange - Optional date range {startDate, endDate} (ISO format)
 * @returns Query result with BranchPerformance[]
 *
 * @example
 * ```tsx
 * const { isAdmin } = useAuth();
 * const { data: comparison, error } = useBranchComparison({
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31',
 * });
 *
 * // Handle 403 for non-admins
 * if (error?.statusCode === 403) {
 *   return <div>ليس لديك صلاحية لعرض مقارنة الفروع</div>;
 * }
 *
 * // Render comparison table
 * {comparison?.map(branch => (
 *   <BranchRow key={branch.branchId} data={branch} />
 * ))}
 * ```
 */
export const useBranchComparison = (dateRange?: {
  startDate?: string;
  endDate?: string;
}) => {
  const { isAdmin } = useAuth();

  return useQuery<BranchPerformance[], ApiError>({
    queryKey: queryKeys.dashboard.branchComparison(dateRange),
    queryFn: () => dashboardService.getBranchComparison(dateRange),
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
    retry: 1,
    // Only enable for admins (will get 403 otherwise)
    enabled: isAdmin,
  });
};

// ============================================
// FILTER STATE MANAGEMENT HOOK
// ============================================

/**
 * useDashboardFilters Hook
 * Custom hook for managing dashboard filter state
 *
 * Provides convenient methods for updating filters:
 * - setFilters: Update multiple filters at once
 * - setFilter: Update a single filter
 * - resetFilters: Reset to initial state
 * - setBranchId: Convenience method for branch filter
 * - setDate: Convenience method for date filter
 * - setDateRange: Convenience method for date range (startDate, endDate)
 * - setLimit: Convenience method for limit filter
 *
 * @param initialFilters - Optional initial filter state
 * @returns Object with filters and setter methods
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const {
 *     filters,
 *     setBranchId,
 *     setDateRange,
 *     setLimit,
 *     resetFilters,
 *   } = useDashboardFilters();
 *
 *   const { data: stats } = useDashboardStats(
 *     filters.branchId,
 *     filters.date
 *   );
 *
 *   const { data: revenue } = useRevenueData(
 *     filters.branchId,
 *     { startDate: filters.startDate, endDate: filters.endDate }
 *   );
 *
 *   const { data: recent } = useRecentTransactions(
 *     filters.branchId,
 *     filters.limit
 *   );
 *
 *   return (
 *     <div>
 *       <BranchSelector
 *         value={filters.branchId}
 *         onChange={setBranchId}
 *       />
 *       <DateRangePicker
 *         startDate={filters.startDate}
 *         endDate={filters.endDate}
 *         onChange={(start, end) => setDateRange(start, end)}
 *       />
 *       <button onClick={resetFilters}>مسح الفلاتر</button>
 *       <DashboardStats stats={stats} />
 *       <RevenueChart data={revenue} />
 *       <RecentTransactionsList data={recent} />
 *     </div>
 *   );
 * }
 * ```
 */
export const useDashboardFilters = (
  initialFilters?: Partial<DashboardQueryFilters>,
) => {
  const [filters, setFiltersState] = useState<DashboardQueryFilters>(
    initialFilters || {},
  );

  const setFilters = useCallback((newFilters: Partial<DashboardQueryFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const setFilter = useCallback(
    <K extends keyof DashboardQueryFilters>(
      key: K,
      value: DashboardQueryFilters[K],
    ) => {
      setFiltersState((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFiltersState(initialFilters || {});
  }, [initialFilters]);

  const setBranchId = useCallback((branchId: string | undefined) => {
    setFiltersState((prev) => ({ ...prev, branchId }));
  }, []);

  const setDate = useCallback((date: string | undefined) => {
    setFiltersState((prev) => ({ ...prev, date }));
  }, []);

  const setDateRange = useCallback(
    (startDate: string | undefined, endDate: string | undefined) => {
      setFiltersState((prev) => ({ ...prev, startDate, endDate }));
    },
    [],
  );

  const setLimit = useCallback((limit: number | undefined) => {
    setFiltersState((prev) => ({ ...prev, limit }));
  }, []);

  return {
    filters,
    setFilters,
    setFilter,
    resetFilters,
    setBranchId,
    setDate,
    setDateRange,
    setLimit,
  };
};

// ============================================
// HELPER HOOKS
// ============================================

/**
 * useTodayStats Hook
 * Query today's dashboard stats (convenience hook)
 *
 * @param branchId - Optional branch UUID
 * @returns Query result with today's DashboardStats
 */
export const useTodayStats = (branchId?: string) => {
  const today = new Date().toISOString().split('T')[0];
  return useDashboardStats(branchId, today);
};

/**
 * useCurrentMonthRevenue Hook
 * Query current month revenue data (convenience hook)
 *
 * @param branchId - Optional branch UUID
 * @returns Query result with current month RevenueDataPoint[]
 */
export const useCurrentMonthRevenue = (branchId?: string) => {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  return useRevenueData(branchId, {
    startDate: firstOfMonth.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  });
};

/**
 * useLastNDaysRevenue Hook
 * Query last N days revenue data (convenience hook)
 *
 * @param days - Number of days to look back (default: 7)
 * @param branchId - Optional branch UUID
 * @returns Query result with last N days RevenueDataPoint[]
 */
export const useLastNDaysRevenue = (days: number = 7, branchId?: string) => {
  const today = new Date();
  const nDaysAgo = new Date(today);
  nDaysAgo.setDate(today.getDate() - days);

  return useRevenueData(branchId, {
    startDate: nDaysAgo.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  });
};

/**
 * useCurrentMonthCategories Hook
 * Query current month category data (convenience hook)
 *
 * @param branchId - Optional branch UUID
 * @returns Query result with current month CategoryDataPoint[]
 */
export const useCurrentMonthCategories = (branchId?: string) => {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  return useCategoryData(branchId, {
    startDate: firstOfMonth.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  });
};

/**
 * useTopRecentTransactions Hook
 * Query top N recent transactions (convenience hook)
 *
 * @param limit - Number of transactions (default: 5)
 * @param branchId - Optional branch UUID
 * @returns Query result with top N Transaction[]
 */
export const useTopRecentTransactions = (limit: number = 5, branchId?: string) => {
  return useRecentTransactions(branchId, limit);
};

/**
 * useCurrentMonthBranchComparison Hook
 * Query current month branch comparison (convenience hook, admin only)
 *
 * @returns Query result with current month BranchPerformance[]
 */
export const useCurrentMonthBranchComparison = () => {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  return useBranchComparison({
    startDate: firstOfMonth.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  });
};
