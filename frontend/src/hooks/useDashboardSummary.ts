import { useQuery } from '@tanstack/react-query';
import transactionService from '@/api/services/transactionService';
import type { DashboardSummary, DashboardSummaryFilters } from '../types/transactions.types';

/**
 * Query key factory for dashboard summary
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: (filters?: DashboardSummaryFilters) => ['dashboard', 'summary', filters] as const,
};

/**
 * Hook to fetch financial summary for dashboard
 * Automatically handles admin/accountant permissions
 *
 * @param filters - Optional filters for date and branchId
 * @param options - TanStack Query options
 * @returns Query result with financial summary data
 *
 * @example
 * // Get summary for today (default)
 * const { data, isLoading } = useDashboardSummary();
 *
 * @example
 * // Get summary for specific date
 * const { data } = useDashboardSummary({ date: '2025-01-15' });
 *
 * @example
 * // Admin filtering by branch
 * const { data } = useDashboardSummary({ date: '2025-01-15', branchId: 'branch-id' });
 */
export const useDashboardSummary = (
  filters?: DashboardSummaryFilters,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) => {
  return useQuery<DashboardSummary, Error>({
    queryKey: dashboardKeys.summary(filters),
    queryFn: () => transactionService.getSummary(filters),
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval,
    // Keep previous data while fetching new data (prevents layout shift)
    placeholderData: (previousData) => previousData,
  });
};
