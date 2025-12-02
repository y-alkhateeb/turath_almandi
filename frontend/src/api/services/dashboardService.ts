/**
 * Dashboard Service
 * Dashboard statistics endpoint
 *
 * Endpoints:
 * - GET /dashboard/stats?branchId&date&startDate&endDate → DashboardStats
 *
 * All types match backend DTOs exactly. No any types.
 */

import apiClient from '../apiClient';
import type {
  DashboardStats,
  DashboardQueryFilters,
} from '#/api';

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Dashboard API endpoints enum
 * Centralized endpoint definitions
 */
export enum DashboardApiEndpoints {
  GetStats = '/dashboard/stats',
}

// ============================================
// DASHBOARD SERVICE METHODS
// ============================================

/**
 * Get dashboard statistics
 * GET /dashboard/stats?branchId&date&startDate&endDate
 *
 * Backend behavior:
 * - Accountants: Auto-filtered to their branch
 * - Admins: Can filter by specific branch or see all
 *
 * @param filters - Optional query filters (branchId?, date?, startDate?, endDate?)
 * @returns DashboardStats with aggregated metrics
 * @throws ApiError on 401 (not authenticated)
 */
export const getStats = (
  filters?: Pick<DashboardQueryFilters, 'branchId' | 'date' | 'startDate' | 'endDate'>
): Promise<DashboardStats> => {
  return apiClient.get<DashboardStats>({
    url: DashboardApiEndpoints.GetStats,
    params: filters,
  });
};

// ============================================
// EXPORTS
// ============================================

const dashboardService = {
  getStats,
};

export default dashboardService;
