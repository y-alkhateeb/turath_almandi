/**
 * Query Key Factories
 *
 * Centralized query key management for React Query cache.
 * Provides type-safe query keys for all entities in the application.
 *
 * Key Structure:
 * - Entity lists: [entity, filters]
 * - Entity details: [entity, id]
 * - Entity summaries: [entity, 'summary', ...params]
 * - Special endpoints: [entity, 'action', ...params]
 *
 * @see https://tanstack.com/query/v5/docs/react/guides/query-keys
 */

import type {
  UserQueryFilters,
  BranchQueryFilters,
  TransactionQueryFilters,
  DebtQueryFilters,
  InventoryQueryFilters,
  NotificationQueryFilters,
  AuditLogQueryFilters,
  ReportQueryFilters,
  DashboardQueryFilters,
} from '#/api';

// ============================================
// AUTH QUERY KEYS
// ============================================

/**
 * Authentication query keys
 * Used for user profile and session management
 */
export const authKeys = {
  /** Auth namespace root */
  all: ['auth'] as const,

  /** Current user profile: ['auth', 'profile'] */
  profile: ['auth', 'profile'] as const,

  /** User session: ['auth', 'session'] */
  session: ['auth', 'session'] as const,
} as const;

// ============================================
// USER QUERY KEYS
// ============================================

/**
 * User query keys
 * Used for user management and queries
 */
export const userKeys = {
  /** Users namespace root */
  all: ['users'] as const,

  /**
   * Users list with optional filters
   * @param filters - Optional UserQueryFilters
   * @returns ['users', filters]
   */
  list: (filters?: UserQueryFilters) => ['users', filters] as const,

  /**
   * Single user by ID
   * @param id - User UUID
   * @returns ['users', id]
   */
  detail: (id: string) => ['users', id] as const,
} as const;

// ============================================
// BRANCH QUERY KEYS
// ============================================

/**
 * Branch query keys
 * Used for branch management and queries
 */
export const branchKeys = {
  /** Branches namespace root */
  all: ['branches'] as const,

  /**
   * Branches list with optional filters
   * @param filters - Optional BranchQueryFilters
   * @returns ['branches', filters]
   */
  list: (filters?: BranchQueryFilters) => ['branches', filters] as const,

  /**
   * Single branch by ID
   * @param id - Branch UUID
   * @returns ['branches', id]
   */
  detail: (id: string) => ['branches', id] as const,
} as const;

// ============================================
// TRANSACTION QUERY KEYS
// ============================================

/**
 * Transaction query keys
 * Used for transaction queries and summaries
 */
export const transactionKeys = {
  /** Transactions namespace root */
  all: ['transactions'] as const,

  /**
   * Transactions list with optional filters
   * @param filters - Optional TransactionQueryFilters
   * @returns ['transactions', filters]
   */
  list: (filters?: TransactionQueryFilters) => ['transactions', filters] as const,

  /**
   * Single transaction by ID
   * @param id - Transaction UUID
   * @returns ['transactions', id]
   */
  detail: (id: string) => ['transactions', id] as const,

  /**
   * Transaction summary statistics
   * @param branchId - Optional branch UUID
   * @param dates - Optional date range {startDate, endDate}
   * @returns ['transactions', 'summary', branchId, dates]
   */
  summary: (branchId?: string, dates?: { startDate?: string; endDate?: string }) =>
    ['transactions', 'summary', branchId, dates] as const,
} as const;

// ============================================
// DEBT QUERY KEYS
// ============================================

/**
 * Debt query keys
 * Used for debt queries, payments, and summaries
 */
export const debtKeys = {
  /** Debts namespace root */
  all: ['debts'] as const,

  /**
   * Debts list with optional filters
   * @param filters - Optional DebtQueryFilters
   * @returns ['debts', filters]
   */
  list: (filters?: DebtQueryFilters) => ['debts', filters] as const,

  /**
   * Single debt by ID
   * @param id - Debt UUID
   * @returns ['debts', id]
   */
  detail: (id: string) => ['debts', id] as const,

  /**
   * Debt summary statistics
   * @param branchId - Optional branch UUID
   * @returns ['debts', 'summary', branchId]
   */
  summary: (branchId?: string) => ['debts', 'summary', branchId] as const,

  /**
   * Debt payments for a specific debt
   * @param debtId - Debt UUID
   * @returns ['debts', debtId, 'payments']
   */
  payments: (debtId: string) => ['debts', debtId, 'payments'] as const,
} as const;

// ============================================
// INVENTORY QUERY KEYS
// ============================================

/**
 * Inventory query keys
 * Used for inventory item queries and value calculations
 */
export const inventoryKeys = {
  /** Inventory namespace root */
  all: ['inventory'] as const,

  /**
   * Inventory items list with optional filters
   * @param filters - Optional InventoryQueryFilters
   * @returns ['inventory', filters]
   */
  list: (filters?: InventoryQueryFilters) => ['inventory', filters] as const,

  /**
   * Single inventory item by ID
   * @param id - InventoryItem UUID
   * @returns ['inventory', id]
   */
  detail: (id: string) => ['inventory', id] as const,

  /**
   * Total inventory value
   * @param branchId - Optional branch UUID
   * @returns ['inventory', 'value', branchId]
   */
  value: (branchId?: string) => ['inventory', 'value', branchId] as const,
} as const;

// ============================================
// NOTIFICATION QUERY KEYS
// ============================================

/**
 * Notification query keys
 * Used for notification queries and settings
 */
export const notificationKeys = {
  /** Notifications namespace root */
  all: ['notifications'] as const,

  /**
   * Notifications list with optional filters
   * @param filters - Optional NotificationQueryFilters
   * @returns ['notifications', filters]
   */
  list: (filters?: NotificationQueryFilters) => ['notifications', filters] as const,

  /**
   * Notification settings: ['notifications', 'settings']
   */
  settings: () => ['notifications', 'settings'] as const,

  /**
   * Unread notifications count: ['notifications', 'unread']
   */
  unreadCount: () => ['notifications', 'unread'] as const,
} as const;

// ============================================
// DASHBOARD QUERY KEYS
// ============================================

/**
 * Dashboard query keys
 * Used for dashboard stats, charts, and metrics
 */
export const dashboardKeys = {
  /** Dashboard namespace root */
  all: ['dashboard'] as const,

  /**
   * Dashboard stats
   * @param branchId - Optional branch UUID
   * @param date - Optional date filter
   * @returns ['dashboard', branchId, date]
   */
  stats: (branchId?: string, date?: string) => ['dashboard', branchId, date] as const,

  /**
   * Dashboard revenue data
   * @param filters - Optional DashboardQueryFilters
   * @returns ['dashboard', 'revenue', filters]
   */
  revenueData: (filters?: DashboardQueryFilters) => ['dashboard', 'revenue', filters] as const,

  /**
   * Dashboard category data
   * @param filters - Optional DashboardQueryFilters
   * @returns ['dashboard', 'category', filters]
   */
  categoryData: (filters?: DashboardQueryFilters) => ['dashboard', 'category', filters] as const,

  /**
   * Recent transactions for dashboard
   * @param branchId - Optional branch UUID
   * @param limit - Optional limit
   * @returns ['dashboard', 'recent', branchId, limit]
   */
  recentTransactions: (branchId?: string, limit?: number) =>
    ['dashboard', 'recent', branchId, limit] as const,

  /**
   * Branch comparison data
   * @param dates - Optional date range
   * @returns ['dashboard', 'comparison', dates]
   */
  branchComparison: (dates?: { startDate?: string; endDate?: string }) =>
    ['dashboard', 'comparison', dates] as const,
} as const;

// ============================================
// REPORT QUERY KEYS
// ============================================

/**
 * Report query keys
 * Used for report generation queries
 */
export const reportKeys = {
  /** Reports namespace root */
  all: ['reports'] as const,

  /**
   * Report by type and filters
   * @param type - Report type ('financial' | 'debts' | 'inventory' | 'salaries')
   * @param filters - Optional ReportQueryFilters
   * @returns ['reports', type, filters]
   */
  byType: (type: 'financial' | 'debts' | 'inventory' | 'salaries', filters?: ReportQueryFilters) =>
    ['reports', type, filters] as const,

  /**
   * Financial report
   * @param filters - Report filters
   * @returns ['reports', 'financial', filters]
   */
  financial: (filters: ReportQueryFilters) => ['reports', 'financial', filters] as const,

  /**
   * Debt report
   * @param filters - Optional report filters
   * @returns ['reports', 'debts', filters]
   */
  debt: (filters?: ReportQueryFilters) => ['reports', 'debts', filters] as const,

  /**
   * Inventory report
   * @param branchId - Optional branch UUID
   * @returns ['reports', 'inventory', branchId]
   */
  inventory: (branchId?: string) => ['reports', 'inventory', { branchId }] as const,

  /**
   * Salary report
   * @param filters - Report filters
   * @returns ['reports', 'salaries', filters]
   */
  salary: (filters: ReportQueryFilters) => ['reports', 'salaries', filters] as const,
} as const;

// ============================================
// AUDIT QUERY KEYS
// ============================================

/**
 * Audit log query keys
 * Used for audit trail queries (Admin only)
 */
export const auditKeys = {
  /** Audit namespace root */
  all: ['audit'] as const,

  /**
   * Audit logs list with optional filters
   * @param filters - Optional AuditLogQueryFilters
   * @returns ['audit', filters]
   */
  list: (filters?: AuditLogQueryFilters) => ['audit', filters] as const,

  /**
   * Audit logs for specific entity
   * @param entityType - Entity type
   * @param entityId - Entity UUID
   * @returns ['audit', entityType, entityId]
   */
  entity: (entityType: string, entityId: string) => ['audit', entityType, entityId] as const,

  /**
   * Audit logs for specific user's actions
   * @param userId - User UUID
   * @returns ['audit', 'user', userId]
   */
  userActions: (userId: string) => ['audit', 'user', userId] as const,
} as const;

// ============================================
// QUERY KEYS FACTORY
// ============================================

/**
 * Complete query keys factory
 * Export all query keys for easy import
 *
 * Usage:
 * ```ts
 * import { queryKeys } from '@/hooks/queries/queryKeys';
 *
 * // Use in React Query hooks
 * useQuery({
 *   queryKey: queryKeys.users.list({ role: 'ADMIN' }),
 *   queryFn: () => userService.getAll({ role: 'ADMIN' })
 * });
 *
 * // Invalidate queries
 * queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
 * ```
 */
export const queryKeys = {
  auth: authKeys,
  users: userKeys,
  branches: branchKeys,
  transactions: transactionKeys,
  debts: debtKeys,
  inventory: inventoryKeys,
  notifications: notificationKeys,
  dashboard: dashboardKeys,
  reports: reportKeys,
  audit: auditKeys,
} as const;

/**
 * Type-safe query key type
 * Infer the type of all possible query keys
 */
export type QueryKeys = typeof queryKeys;

/**
 * Helper type to extract query key arrays
 */
export type QueryKey = ReturnType<QueryKeys[keyof QueryKeys][keyof QueryKeys[keyof QueryKeys]]>;
