import { useQuery } from '@tanstack/react-query';
import { DashboardStats } from '@/types/dashboard';
import dashboardService from '@/api/services/dashboardService';
import { useAuth } from './useAuth';

interface UseDashboardStatsOptions {
  date?: string;
  branchId?: string;
  enabled?: boolean;
}

/**
 * Custom hook to fetch dashboard statistics
 *
 * Features:
 * - Fetches real data from backend API via optimized /dashboard/stats endpoint
 * - Auto-refreshes every 30 seconds
 * - Respects user's branch access (accountants see only their branch)
 * - Admins can filter by branch or view all branches
 * - Supports date filtering
 *
 * @param options - Optional configuration
 * @returns Query result with dashboard stats
 */
export function useDashboardStats(options: UseDashboardStatsOptions = {}) {
  const { user } = useAuth();
  const { date, branchId, enabled = true } = options;

  // Determine which branch to fetch data for
  const effectiveBranchId = user?.role === 'ACCOUNTANT' ? user.branchId : branchId;

  return useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats', date, effectiveBranchId],
    queryFn: async () => {
      return await dashboardService.getStats({
        date,
        branchId: effectiveBranchId,
      });
    },
    enabled,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
    retry: 2, // Retry failed requests twice
  });
}
