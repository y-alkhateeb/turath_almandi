/**
 * Dashboard React Query Hooks
 * Hooks for fetching dashboard statistics and summaries
 */

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/apiClient';
import type { DashboardStats, DashboardQueryFilters as DashboardFilters } from '#/api';

/**
 * Fetch dashboard statistics
 * Auto-refreshes every 30 seconds
 */
export function useDashboardStats(filters?: DashboardFilters) {
  return useQuery({
    queryKey: ['dashboard', 'stats', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.date) params.append('date', filters.date);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.branchId) params.append('branchId', filters.branchId);

      const queryString = params.toString();
      const url = queryString ? `/dashboard/stats?${queryString}` : '/dashboard/stats';

      return apiClient.get<DashboardStats>({ url });
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 20000, // Consider data stale after 20 seconds
  });
}
