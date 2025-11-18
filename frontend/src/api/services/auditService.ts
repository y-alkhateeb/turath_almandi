/**
 * Audit Service
 * Audit log tracking and querying (Admin only)
 *
 * Endpoints:
 * - GET /audit?entityType&entityId&userId&startDate&endDate&page&limit ’ PaginatedResponse<AuditLog>
 *
 * All types match backend DTOs exactly. No any types.
 * Admin-only access enforced by backend.
 */

import apiClient from '../apiClient';
import type { AuditLog } from '#/entity';
import type { PaginatedResponse, AuditLogQueryFilters } from '#/api';

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Audit API endpoints enum
 * Centralized endpoint definitions
 */
export enum AuditApiEndpoints {
  GetAll = '/audit',
}

// ============================================
// AUDIT SERVICE METHODS
// ============================================

/**
 * Get audit logs with pagination and filters
 * GET /audit?entityType&entityId&userId&startDate&endDate&page&limit
 *
 * Retrieves audit trail of system actions:
 * - Entity type filtering (USER, BRANCH, TRANSACTION, DEBT, etc.)
 * - Entity ID filtering (specific record)
 * - User ID filtering (who performed the action)
 * - Date range filtering
 * - Full pagination support
 *
 * Supported filters:
 * - entityType: AuditEntityType (USER, BRANCH, TRANSACTION, DEBT, DEBT_PAYMENT, INVENTORY_ITEM, INVENTORY)
 * - entityId: UUID (specific entity record)
 * - userId: UUID (user who performed action)
 * - startDate: ISO date string (inclusive)
 * - endDate: ISO date string (inclusive)
 * - page: number (default: 1)
 * - limit: number (default: 50)
 *
 * Backend behavior:
 * - Admin only endpoint (403 for accountants)
 * - Results ordered by timestamp DESC (newest first)
 * - Includes user relation (who performed action)
 * - Includes before/after values for changes
 * - Tracks CREATE, UPDATE, DELETE actions
 *
 * Audit log tracks:
 * - User management (create, update, delete, role changes)
 * - Branch management (create, update, deactivate)
 * - Transactions (create, update, delete)
 * - Debts (create, update, delete, payments)
 * - Inventory (create, update, delete, quantity changes)
 *
 * @param filters - Optional query filters
 * @returns PaginatedResponse<AuditLog> with audit records and pagination meta
 * @throws ApiError on 401 (not authenticated), 403 (not admin)
 */
export const getAll = (
  filters?: AuditLogQueryFilters,
): Promise<PaginatedResponse<AuditLog>> => {
  return apiClient.get<PaginatedResponse<AuditLog>>({
    url: AuditApiEndpoints.GetAll,
    params: filters,
  });
};

// ============================================
// HELPER METHODS
// ============================================

/**
 * Get audit logs for specific entity
 * GET /audit?entityType=X&entityId=Y
 *
 * Convenience method to get full history of a specific entity
 *
 * @param entityType - Type of entity (USER, BRANCH, etc.)
 * @param entityId - UUID of entity
 * @param additionalFilters - Optional additional filters
 * @returns PaginatedResponse<AuditLog>
 * @throws ApiError on 401, 403
 */
export const getEntityHistory = (
  entityType: string,
  entityId: string,
  additionalFilters?: Omit<AuditLogQueryFilters, 'entityType' | 'entityId'>,
): Promise<PaginatedResponse<AuditLog>> => {
  return getAll({
    ...additionalFilters,
    entityType,
    entityId,
  });
};

/**
 * Get audit logs for specific user's actions
 * GET /audit?userId=X
 *
 * Convenience method to get all actions performed by a user
 *
 * @param userId - User UUID
 * @param additionalFilters - Optional additional filters
 * @returns PaginatedResponse<AuditLog>
 * @throws ApiError on 401, 403
 */
export const getUserActions = (
  userId: string,
  additionalFilters?: Omit<AuditLogQueryFilters, 'userId'>,
): Promise<PaginatedResponse<AuditLog>> => {
  return getAll({
    ...additionalFilters,
    userId,
  });
};

/**
 * Get audit logs by entity type
 * GET /audit?entityType=X
 *
 * Convenience method to get all actions for entity type
 *
 * @param entityType - Type of entity (USER, BRANCH, TRANSACTION, etc.)
 * @param additionalFilters - Optional additional filters
 * @returns PaginatedResponse<AuditLog>
 * @throws ApiError on 401, 403
 */
export const getByEntityType = (
  entityType: string,
  additionalFilters?: Omit<AuditLogQueryFilters, 'entityType'>,
): Promise<PaginatedResponse<AuditLog>> => {
  return getAll({
    ...additionalFilters,
    entityType,
  });
};

/**
 * Get audit logs for date range
 * GET /audit?startDate=X&endDate=Y
 *
 * Convenience method for date range queries
 *
 * @param startDate - ISO date string (inclusive)
 * @param endDate - ISO date string (inclusive)
 * @param additionalFilters - Optional additional filters
 * @returns PaginatedResponse<AuditLog>
 * @throws ApiError on 401, 403
 */
export const getByDateRange = (
  startDate: string,
  endDate: string,
  additionalFilters?: Omit<AuditLogQueryFilters, 'startDate' | 'endDate'>,
): Promise<PaginatedResponse<AuditLog>> => {
  return getAll({
    ...additionalFilters,
    startDate,
    endDate,
  });
};

/**
 * Get today's audit logs
 * GET /audit?startDate=today&endDate=today
 *
 * Convenience method for today's activity
 *
 * @param additionalFilters - Optional additional filters
 * @returns PaginatedResponse<AuditLog>
 * @throws ApiError on 401, 403
 */
export const getTodayLogs = (
  additionalFilters?: Omit<AuditLogQueryFilters, 'startDate' | 'endDate'>,
): Promise<PaginatedResponse<AuditLog>> => {
  const today = new Date().toISOString().split('T')[0];
  return getByDateRange(today, today, additionalFilters);
};

/**
 * Get recent audit logs (last N days)
 * GET /audit?startDate=nDaysAgo&endDate=today
 *
 * Convenience method for recent activity
 *
 * @param days - Number of days to look back (default: 7)
 * @param additionalFilters - Optional additional filters
 * @returns PaginatedResponse<AuditLog>
 * @throws ApiError on 401, 403
 */
export const getRecentLogs = (
  days: number = 7,
  additionalFilters?: Omit<AuditLogQueryFilters, 'startDate' | 'endDate'>,
): Promise<PaginatedResponse<AuditLog>> => {
  const today = new Date();
  const nDaysAgo = new Date(today);
  nDaysAgo.setDate(today.getDate() - days);

  return getByDateRange(
    nDaysAgo.toISOString().split('T')[0],
    today.toISOString().split('T')[0],
    additionalFilters,
  );
};

/**
 * Get all audit logs without pagination (for exports)
 * GET /audit?limit=10000
 *
 * Warning: Use with caution on large datasets
 * Consider using pagination for better performance
 *
 * @param filters - Optional query filters (without page/limit)
 * @returns AuditLog[] array
 * @throws ApiError on 401, 403
 */
export const getAllUnpaginated = (
  filters?: Omit<AuditLogQueryFilters, 'page' | 'limit'>,
): Promise<AuditLog[]> => {
  return apiClient
    .get<PaginatedResponse<AuditLog>>({
      url: AuditApiEndpoints.GetAll,
      params: { ...filters, limit: 10000 },
    })
    .then((response) => {
      // Extract data from paginated response
      return response.data;
    });
};

/**
 * Get transaction audit logs
 * GET /audit?entityType=TRANSACTION
 *
 * Convenience method for transaction history
 *
 * @param additionalFilters - Optional additional filters
 * @returns PaginatedResponse<AuditLog>
 * @throws ApiError on 401, 403
 */
export const getTransactionLogs = (
  additionalFilters?: Omit<AuditLogQueryFilters, 'entityType'>,
): Promise<PaginatedResponse<AuditLog>> => {
  return getByEntityType('TRANSACTION', additionalFilters);
};

/**
 * Get debt audit logs
 * GET /audit?entityType=DEBT
 *
 * Convenience method for debt history
 *
 * @param additionalFilters - Optional additional filters
 * @returns PaginatedResponse<AuditLog>
 * @throws ApiError on 401, 403
 */
export const getDebtLogs = (
  additionalFilters?: Omit<AuditLogQueryFilters, 'entityType'>,
): Promise<PaginatedResponse<AuditLog>> => {
  return getByEntityType('DEBT', additionalFilters);
};

/**
 * Get user management audit logs
 * GET /audit?entityType=USER
 *
 * Convenience method for user management history
 *
 * @param additionalFilters - Optional additional filters
 * @returns PaginatedResponse<AuditLog>
 * @throws ApiError on 401, 403
 */
export const getUserManagementLogs = (
  additionalFilters?: Omit<AuditLogQueryFilters, 'entityType'>,
): Promise<PaginatedResponse<AuditLog>> => {
  return getByEntityType('USER', additionalFilters);
};

// ============================================
// EXPORTS
// ============================================

/**
 * Audit service object with all methods
 * Use named exports or default object
 */
const auditService = {
  getAll,
  getAllUnpaginated,
  getEntityHistory,
  getUserActions,
  getByEntityType,
  getByDateRange,
  getTodayLogs,
  getRecentLogs,
  getTransactionLogs,
  getDebtLogs,
  getUserManagementLogs,
};

export default auditService;
