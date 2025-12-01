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
  DashboardQueryFilters,
  ContactQueryFilters,
  PayableQueryFilters,
  ReceivableQueryFilters,
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
// EMPLOYEE QUERY KEYS
// ============================================

/**
 * Employee query keys
 * Used for employee queries, salary payments, and salary increases
 */
export const employeeKeys = {
  /** Employees namespace root */
  all: ['employees'] as const,

  /**
   * Employees list
   * @returns ['employees']
   */
  list: () => ['employees'] as const,

  /**
   * Single employee by ID
   * @param id - Employee UUID
   * @returns ['employees', id]
   */
  detail: (id: string) => ['employees', id] as const,

  /**
   * Active employees only (status = ACTIVE)
   * @returns ['employees', 'active']
   */
  active: ['employees', 'active'] as const,

  /**
   * Payroll summary for a month/year
   * @param month - Month (1-12)
   * @param year - Year (e.g., 2025)
   * @returns ['employees', 'payroll', month, year]
   */
  payroll: (month: number, year: number) => ['employees', 'payroll', month, year] as const,

  /**
   * Salary payments for an employee
   * @param employeeId - Employee UUID
   * @returns ['employees', employeeId, 'payments']
   */
  salaryPayments: (employeeId: string) => ['employees', employeeId, 'payments'] as const,

  /**
   * Salary increases for an employee
   * @param employeeId - Employee UUID
   * @returns ['employees', employeeId, 'increases']
   */
  salaryIncreases: (employeeId: string) => ['employees', employeeId, 'increases'] as const,

  /**
   * Recent salary increases across all employees
   * @param limit - Optional limit
   * @returns ['employees', 'recent-increases', limit]
   */
  recentIncreases: (limit?: number) => ['employees', 'recent-increases', limit] as const,

  /**
   * Bonus history for a specific employee
   * @param employeeId - Employee UUID
   * @param startDate - Optional start date filter
   * @param endDate - Optional end date filter
   * @returns ['employees', employeeId, 'bonuses', startDate, endDate]
   */
  bonuses: (employeeId: string, startDate?: string, endDate?: string) =>
    ['employees', employeeId, 'bonuses', startDate, endDate] as const,

  /**
   * Advances for a specific employee (السلف)
   * @param employeeId - Employee UUID
   * @returns ['employees', employeeId, 'advances']
   */
  advances: (employeeId: string) => ['employees', employeeId, 'advances'] as const,

  /**
   * Branch advances summary
   * @param branchId - Branch UUID
   * @returns ['employees', 'branch', branchId, 'advances-summary']
   */
  branchAdvances: (branchId: string) =>
    ['employees', 'branch', branchId, 'advances-summary'] as const,
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
// CONTACT QUERY KEYS
// ============================================

/**
 * Contact query keys
 * Used for contact queries (customers and suppliers)
 */
export const contactKeys = {
  /** Contacts namespace root */
  all: ['contacts'] as const,

  /**
   * Contacts list with optional filters
   * @param filters - Optional ContactQueryFilters
   * @returns ['contacts', filters]
   */
  list: (filters?: ContactQueryFilters) => ['contacts', filters] as const,

  /**
   * Single contact by ID
   * @param id - Contact UUID
   * @returns ['contacts', id]
   */
  detail: (id: string) => ['contacts', id] as const,

  /**
   * Active suppliers only (type = SUPPLIER, isActive = true)
   * @returns ['contacts', 'suppliers']
   */
  suppliers: () => ['contacts', 'suppliers'] as const,

  /**
   * Active customers only (type = CUSTOMER, isActive = true)
   * @returns ['contacts', 'customers']
   */
  customers: () => ['contacts', 'customers'] as const,
} as const;

// ============================================
// PAYABLE QUERY KEYS
// ============================================

/**
 * Payable query keys
 * Used for payable queries and payments
 */
export const payableKeys = {
  /** Payables namespace root */
  all: ['payables'] as const,

  /**
   * Payables list with optional filters
   * @param filters - Optional PayableQueryFilters
   * @returns ['payables', filters]
   */
  list: (filters?: PayableQueryFilters) => ['payables', filters] as const,

  /**
   * Single payable by ID
   * @param id - Payable UUID
   * @returns ['payables', id]
   */
  detail: (id: string) => ['payables', id] as const,

  /**
   * Payable summary statistics
   * @param branchId - Optional branch UUID
   * @returns ['payables', 'summary', branchId]
   */
  summary: (branchId?: string) => ['payables', 'summary', branchId] as const,

  /**
   * Payable payments for a specific payable
   * @param payableId - Payable UUID
   * @returns ['payables', payableId, 'payments']
   */
  payments: (payableId: string) => ['payables', payableId, 'payments'] as const,
} as const;

// ============================================
// RECEIVABLE QUERY KEYS
// ============================================

/**
 * Receivable query keys
 * Used for receivable queries and collections
 */
export const receivableKeys = {
  /** Receivables namespace root */
  all: ['receivables'] as const,

  /**
   * Receivables list with optional filters
   * @param filters - Optional ReceivableQueryFilters
   * @returns ['receivables', filters]
   */
  list: (filters?: ReceivableQueryFilters) => ['receivables', filters] as const,

  /**
   * Single receivable by ID
   * @param id - Receivable UUID
   * @returns ['receivables', id]
   */
  detail: (id: string) => ['receivables', id] as const,

  /**
   * Receivable summary statistics
   * @param branchId - Optional branch UUID
   * @returns ['receivables', 'summary', branchId]
   */
  summary: (branchId?: string) => ['receivables', 'summary', branchId] as const,

  /**
   * Receivable payments for a specific receivable
   * @param receivableId - Receivable UUID
   * @returns ['receivables', receivableId, 'payments']
   */
  payments: (receivableId: string) => ['receivables', receivableId, 'payments'] as const,
} as const;

// ============================================
// SETTINGS QUERY KEYS
// ============================================

/**
 * Settings query keys
 * Used for system settings and currency configuration
 */
export const settingsKeys = {
  /** Settings namespace root */
  all: ['settings'] as const,

  /**
   * Currency namespace root
   */
  currency: ['settings', 'currency'] as const,

  /**
   * Default currency: ['settings', 'currency', 'default']
   */
  defaultCurrency: () => ['settings', 'currency', 'default'] as const,

  /**
   * All currencies list: ['settings', 'currencies', 'all']
   */
  allCurrencies: () => ['settings', 'currencies', 'all'] as const,
} as const;

// ============================================
// DISCOUNT REASON QUERY KEYS
// ============================================

/**
 * Discount Reason query keys
 * Used for discount reason queries and management
 */
export const discountReasonKeys = {
  /** Discount reasons namespace root */
  all: ['discount-reasons'] as const,

  /**
   * Single discount reason by ID
   * @param id - Discount reason UUID
   * @returns ['discount-reasons', id]
   */
  detail: (id: string) => ['discount-reasons', id] as const,
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
  contacts: contactKeys,
  payables: payableKeys,
  receivables: receivableKeys,
  inventory: inventoryKeys,
  employees: employeeKeys,
  notifications: notificationKeys,
  dashboard: dashboardKeys,
  audit: auditKeys,
  settings: settingsKeys,
  discountReasons: discountReasonKeys,
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
