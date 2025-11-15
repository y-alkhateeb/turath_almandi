import { api } from './axios';
import { DashboardStats } from '@/types/dashboard';

/**
 * Dashboard Service
 * Handles all dashboard-related API calls and data transformations
 *
 * Now uses optimized /dashboard/stats endpoint that returns all data in one call
 */
class DashboardService {
  /**
   * Get comprehensive dashboard statistics
   * Uses the optimized backend endpoint that combines all data sources
   *
   * @param date - Optional date (YYYY-MM-DD), defaults to today
   * @param branchId - Optional branch filter (admin only)
   * @returns Complete dashboard statistics
   */
  async getDashboardStats(date?: string, branchId?: string): Promise<DashboardStats> {
    try {
      const params: Record<string, string> = {};

      if (date) {
        params.date = date;
      }

      if (branchId) {
        params.branchId = branchId;
      }

      const response = await api.get<DashboardStats>('/dashboard/stats', { params });

      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Legacy method - kept for backwards compatibility
   * Now just calls the optimized endpoint
   *
   * @deprecated Use getDashboardStats instead
   */
  async getDashboardStatsLegacy(branchId?: string): Promise<DashboardStats> {
    return this.getDashboardStats(undefined, branchId);
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
