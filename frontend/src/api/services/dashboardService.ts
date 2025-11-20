/**
 * Dashboard Service
 * Dashboard statistics, charts, and summary endpoints
 *
 * Endpoints:
 * - GET /dashboard/stats?branchId&date → DashboardStats
 * - GET /dashboard/revenue-data?branchId&startDate&endDate → RevenueDataPoint[]
 * - GET /dashboard/category-data?branchId&startDate&endDate → CategoryDataPoint[]
 * - GET /dashboard/recent-transactions?branchId&limit → Transaction[]
 * - GET /dashboard/branch-comparison?startDate&endDate → BranchPerformance[]
 *
 * All types match backend DTOs exactly. No any types.
 */

import apiClient from '../apiClient';
import type { Transaction } from '#/entity';
import type {
  DashboardStats,
  RevenueDataPoint,
  CategoryDataPoint,
  BranchPerformance,
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
  GetRevenueData = '/dashboard/revenue-data',
  GetCategoryData = '/dashboard/category-data',
  GetRecentTransactions = '/dashboard/recent-transactions',
  GetBranchComparison = '/dashboard/branch-comparison',
}

// ============================================
// DASHBOARD SERVICE METHODS
// ============================================

/**
 * Get comprehensive dashboard statistics
 * GET /dashboard/stats?branchId&date
 *
 * Aggregates metrics from multiple sources:
 * - Total revenue (income transactions)
 * - Total expenses (expense transactions)
 * - Net profit (revenue - expenses)
 * - Today's transaction count
 * - Cash vs Master card revenue breakdown
 * - Total debts and active debts count
 * - Total inventory value
 *
 * Backend behavior:
 * - Accountants: Auto-filtered to their branch
 * - Admins: Can filter by specific branch or see all
 * - Date filter defaults to current date
 * - Uses optimized queries with aggregation
 *
 * @param filters - Optional query filters (branchId?, date?)
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

/**
 * Get revenue data for charts
 * GET /dashboard/revenue-data?branchId&startDate&endDate
 *
 * Returns time-series data for revenue/expense tracking:
 * - Daily, weekly, or monthly aggregation based on date range
 * - Separate revenue and expenses values for comparison
 * - Net profit calculation per period
 *
 * Backend behavior:
 * - Accountants: Auto-filtered to their branch
 * - Admins: Can filter by specific branch or see all
 * - Date range defaults to last 30 days if not specified
 * - Auto-determines aggregation level (day/week/month) based on range
 * - Fills gaps with zero values for continuous charts
 *
 * @param filters - Optional query filters (branchId?, startDate?, endDate?)
 * @returns RevenueDataPoint[] - Time series data points
 * @throws ApiError on 401 (not authenticated)
 */
export const getRevenueData = (
  filters?: Pick<DashboardQueryFilters, 'branchId' | 'startDate' | 'endDate'>
): Promise<RevenueDataPoint[]> => {
  return apiClient.get<RevenueDataPoint[]>({
    url: DashboardApiEndpoints.GetRevenueData,
    params: filters,
  });
};

/**
 * Get category data for charts
 * GET /dashboard/category-data?branchId&startDate&endDate
 *
 * Returns aggregated spending/revenue by category:
 * - Sum of transaction amounts per category
 * - Transaction count per category
 * - Auto-sorted by value (highest first)
 * - Optional color coding for visualization
 *
 * Backend behavior:
 * - Accountants: Auto-filtered to their branch
 * - Admins: Can filter by specific branch or see all
 * - Date range defaults to current month if not specified
 * - Includes both income and expense categories
 * - Groups uncategorized transactions as "Other"
 *
 * @param filters - Optional query filters (branchId?, startDate?, endDate?)
 * @returns CategoryDataPoint[] - Category aggregations
 * @throws ApiError on 401 (not authenticated)
 */
export const getCategoryData = (
  filters?: Pick<DashboardQueryFilters, 'branchId' | 'startDate' | 'endDate'>
): Promise<CategoryDataPoint[]> => {
  return apiClient.get<CategoryDataPoint[]>({
    url: DashboardApiEndpoints.GetCategoryData,
    params: filters,
  });
};

/**
 * Get recent transactions
 * GET /dashboard/recent-transactions?branchId&limit
 *
 * Returns most recent transactions for quick overview:
 * - Ordered by date DESC (newest first)
 * - Includes all transaction details and relations
 * - Default limit: 10 transactions
 * - Maximum limit: 50 transactions
 *
 * Backend behavior:
 * - Accountants: Auto-filtered to their branch
 * - Admins: Can filter by specific branch or see all
 * - Returns transactions with branch and creator relations
 * - Excludes soft-deleted transactions
 *
 * @param filters - Optional query filters (branchId?, limit?)
 * @returns Transaction[] - Recent transactions array
 * @throws ApiError on 401 (not authenticated)
 */
export const getRecentTransactions = (
  filters?: Pick<DashboardQueryFilters, 'branchId' | 'limit'>
): Promise<Transaction[]> => {
  return apiClient.get<Transaction[]>({
    url: DashboardApiEndpoints.GetRecentTransactions,
    params: filters,
  });
};

/**
 * Get branch performance comparison
 * GET /dashboard/branch-comparison?startDate&endDate
 *
 * Compares performance metrics across all branches:
 * - Total revenue per branch
 * - Total expenses per branch
 * - Net profit per branch
 * - Transaction count per branch
 * - Average transaction value per branch
 * - Top spending category per branch
 *
 * Backend behavior:
 * - Admin only endpoint (403 for accountants)
 * - Date range defaults to current month if not specified
 * - Includes only active branches
 * - Sorted by net profit DESC (best performing first)
 * - Returns empty array if no transactions in range
 *
 * @param filters - Optional query filters (startDate?, endDate?)
 * @returns BranchPerformance[] - Branch comparison data
 * @throws ApiError on 401 (not authenticated), 403 (not admin)
 */
export const getBranchComparison = (
  filters?: Pick<DashboardQueryFilters, 'startDate' | 'endDate'>
): Promise<BranchPerformance[]> => {
  return apiClient.get<BranchPerformance[]>({
    url: DashboardApiEndpoints.GetBranchComparison,
    params: filters,
  });
};

// ============================================
// HELPER METHODS
// ============================================

/**
 * Get today's dashboard stats
 * GET /dashboard/stats?date=today
 *
 * Convenience method for current day statistics
 *
 * @param branchId - Optional branch UUID
 * @returns DashboardStats for today
 * @throws ApiError on 401
 */
export const getTodayStats = (branchId?: string): Promise<DashboardStats> => {
  const today = new Date().toISOString().split('T')[0];
  return getStats({
    date: today,
    branchId,
  });
};

/**
 * Get current month revenue data
 * GET /dashboard/revenue-data?startDate=firstOfMonth&endDate=today
 *
 * Convenience method for current month revenue tracking
 *
 * @param branchId - Optional branch UUID
 * @returns RevenueDataPoint[] for current month
 * @throws ApiError on 401
 */
export const getCurrentMonthRevenue = (branchId?: string): Promise<RevenueDataPoint[]> => {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  return getRevenueData({
    startDate: firstOfMonth.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
    branchId,
  });
};

/**
 * Get last N days revenue data
 * GET /dashboard/revenue-data?startDate=nDaysAgo&endDate=today
 *
 * Convenience method for recent revenue trends
 *
 * @param days - Number of days to look back (default: 7)
 * @param branchId - Optional branch UUID
 * @returns RevenueDataPoint[] for last N days
 * @throws ApiError on 401
 */
export const getLastNDaysRevenue = (
  days: number = 7,
  branchId?: string
): Promise<RevenueDataPoint[]> => {
  const today = new Date();
  const nDaysAgo = new Date(today);
  nDaysAgo.setDate(today.getDate() - days);

  return getRevenueData({
    startDate: nDaysAgo.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
    branchId,
  });
};

/**
 * Get current month category data
 * GET /dashboard/category-data?startDate=firstOfMonth&endDate=today
 *
 * Convenience method for current month category breakdown
 *
 * @param branchId - Optional branch UUID
 * @returns CategoryDataPoint[] for current month
 * @throws ApiError on 401
 */
export const getCurrentMonthCategories = (branchId?: string): Promise<CategoryDataPoint[]> => {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  return getCategoryData({
    startDate: firstOfMonth.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
    branchId,
  });
};

/**
 * Get top N recent transactions
 * GET /dashboard/recent-transactions?limit=N
 *
 * Convenience method with specific limit
 *
 * @param limit - Number of transactions to return (default: 5)
 * @param branchId - Optional branch UUID
 * @returns Transaction[] - Recent transactions
 * @throws ApiError on 401
 */
export const getTopRecentTransactions = (
  limit: number = 5,
  branchId?: string
): Promise<Transaction[]> => {
  return getRecentTransactions({
    limit,
    branchId,
  });
};

/**
 * Get current month branch comparison
 * GET /dashboard/branch-comparison?startDate=firstOfMonth&endDate=today
 *
 * Convenience method for current month branch performance
 *
 * @returns BranchPerformance[] for current month
 * @throws ApiError on 401, 403
 */
export const getCurrentMonthBranchComparison = (): Promise<BranchPerformance[]> => {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  return getBranchComparison({
    startDate: firstOfMonth.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  });
};

// ============================================
// EXPORTS
// ============================================

/**
 * Dashboard service object with all methods
 * Use named exports or default object
 */
const dashboardService = {
  getStats,
  getRevenueData,
  getCategoryData,
  getRecentTransactions,
  getBranchComparison,
  getTodayStats,
  getCurrentMonthRevenue,
  getLastNDaysRevenue,
  getCurrentMonthCategories,
  getTopRecentTransactions,
  getCurrentMonthBranchComparison,
};

export default dashboardService;
