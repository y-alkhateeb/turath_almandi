/**
 * Dashboard Service
 * Dashboard statistics and summary endpoints
 */

import apiClient from '../apiClient';
import type { DashboardStats, DashboardFilters } from '#/entity';

// API endpoints enum
export enum DashboardApi {
  GetStats = '/dashboard/stats',
}

// Build query string from filters
const buildQueryString = (filters?: DashboardFilters): string => {
  if (!filters) return '';

  const params = new URLSearchParams();

  if (filters.date) params.append('date', filters.date);
  if (filters.branchId) params.append('branchId', filters.branchId);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);

  return params.toString();
};

// Get comprehensive dashboard statistics
// Uses optimized backend endpoint that combines all data sources
// @param filters - Optional date and branch filters
// @returns Complete dashboard statistics
export const getDashboardStats = (filters?: DashboardFilters) => {
  const queryString = buildQueryString(filters);
  const url = queryString ? `/dashboard/stats?${queryString}` : '/dashboard/stats';

  return apiClient.get<DashboardStats>({
    url,
  });
};

// Export as default object
export default {
  getDashboardStats,
};
