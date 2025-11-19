/**
 * useAudit Hooks
 * React Query hooks for audit log tracking and querying (Admin only)
 *
 * Features:
 * - Paginated audit logs query with filters
 * - Entity history query (specific entity audit trail)
 * - User actions query (all actions by specific user)
 * - Filter state management hook
 * - Admin-only access guards (enabled: isAdmin)
 * - Full error handling and strict typing
 *
 * Security:
 * - All queries guarded with isAdmin check
 * - Backend enforces 403 for non-admin users
 * - Sensitive data handling (before/after values in changes)
 */

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import auditService from '@/api/services/auditService';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { useAuth } from '../useAuth';
import type { AuditLog } from '#/entity';
import type { PaginatedResponse, AuditLogQueryFilters } from '#/api';
import { ApiError } from '@/api/apiClient';

// ============================================
// QUERY HOOKS
// ============================================

/**
 * useAuditLogs Hook
 * Query paginated audit logs with filters (ADMIN ONLY)
 *
 * Retrieves system audit trail:
 * - Entity type filtering (USER, BRANCH, TRANSACTION, DEBT, etc.)
 * - Entity ID filtering (specific record history)
 * - User ID filtering (who performed action)
 * - Date range filtering
 * - Full pagination support
 *
 * Tracks:
 * - User management (create, update, delete, role changes)
 * - Branch management (create, update, deactivate)
 * - Transactions (create, update, delete)
 * - Debts (create, update, delete, payments)
 * - Inventory (create, update, delete, quantity changes)
 *
 * @param filters - Optional AuditLogQueryFilters (entityType, entityId, userId, startDate, endDate, page, limit)
 * @param options - Query options (enabled, etc.)
 * @returns Query result with paginated audit logs
 *
 * @example
 * ```tsx
 * const { isAdmin } = useAuth();
 *
 * // Only render if admin
 * if (!isAdmin) {
 *   return <div>ليس لديك صلاحية لعرض سجل التدقيق</div>;
 * }
 *
 * // All audit logs (paginated)
 * const { data, isLoading, error } = useAuditLogs({ page: 1, limit: 50 });
 *
 * // Filter by entity type
 * const { data: userLogs } = useAuditLogs({ entityType: 'USER', page: 1 });
 *
 * // Filter by date range
 * const { data: recentLogs } = useAuditLogs({
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31',
 * });
 *
 * // Handle 403 error for non-admins
 * if (error?.statusCode === 403) {
 *   return <div>غير مصرح لك بالوصول</div>;
 * }
 *
 * // Render audit log table
 * const logs = data?.data || [];
 * const totalPages = data?.meta.totalPages || 0;
 *
 * {logs.map(log => (
 *   <AuditLogRow
 *     key={log.id}
 *     log={log}
 *     user={log.user}
 *     changes={log.changes}
 *   />
 * ))}
 * ```
 */
export const useAuditLogs = (
  filters?: AuditLogQueryFilters,
  options?: {
    enabled?: boolean;
  }
) => {
  const { isAdmin } = useAuth();

  return useQuery<PaginatedResponse<AuditLog>, ApiError>({
    queryKey: queryKeys.audit.list(filters),
    queryFn: () => auditService.getAll(filters),
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1, // Only retry once on failure
    // Only enable for admins (will get 403 otherwise)
    enabled: isAdmin && (options?.enabled ?? true),
  });
};

/**
 * useEntityHistory Hook
 * Query audit history for a specific entity (ADMIN ONLY)
 *
 * Gets complete audit trail of a single entity:
 * - All CREATE, UPDATE, DELETE actions
 * - Before/after values for changes
 * - Who performed each action and when
 * - Ordered by timestamp DESC (newest first)
 *
 * Useful for:
 * - Viewing user modification history
 * - Tracking transaction changes
 * - Debt payment audit trail
 * - Inventory quantity change tracking
 *
 * @param entityType - Type of entity (USER, BRANCH, TRANSACTION, DEBT, INVENTORY_ITEM, etc.)
 * @param entityId - UUID of the specific entity
 * @param additionalFilters - Optional additional filters (userId, startDate, endDate, page, limit)
 * @param options - Query options (enabled, etc.)
 * @returns Query result with entity's audit history
 *
 * @example
 * ```tsx
 * // Get audit history for specific user
 * const { data: userHistory } = useEntityHistory(
 *   'USER',
 *   userId,
 *   { page: 1, limit: 20 }
 * );
 *
 * // Get transaction changes
 * const { data: txHistory } = useEntityHistory('TRANSACTION', transactionId);
 *
 * // Get debt payment history
 * const { data: debtHistory } = useEntityHistory('DEBT', debtId);
 *
 * // Filter by date and user who made changes
 * const { data } = useEntityHistory('BRANCH', branchId, {
 *   userId: adminUserId,
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31',
 * });
 *
 * // Render timeline
 * {userHistory?.data.map(log => (
 *   <TimelineEntry
 *     key={log.id}
 *     action={log.action}
 *     user={log.user?.username}
 *     timestamp={log.createdAt}
 *     changes={log.changes}
 *   />
 * ))}
 * ```
 */
export const useEntityHistory = (
  entityType: string,
  entityId: string,
  additionalFilters?: Omit<AuditLogQueryFilters, 'entityType' | 'entityId'>,
  options?: {
    enabled?: boolean;
  }
) => {
  const { isAdmin } = useAuth();

  const _filters: AuditLogQueryFilters = {
    ...additionalFilters,
    entityType,
    entityId,
  };

  return useQuery<PaginatedResponse<AuditLog>, ApiError>({
    queryKey: queryKeys.audit.entity(entityType, entityId),
    queryFn: () => auditService.getEntityHistory(entityType, entityId, additionalFilters),
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
    // Only enable for admins and if entityId is provided
    enabled: isAdmin && !!entityId && (options?.enabled ?? true),
  });
};

/**
 * useUserActions Hook
 * Query all actions performed by a specific user (ADMIN ONLY)
 *
 * Gets complete activity log for a user:
 * - All CREATE, UPDATE, DELETE actions performed
 * - Which entities they modified
 * - When and from which IP address
 * - Ordered by timestamp DESC (newest first)
 *
 * Useful for:
 * - User activity monitoring
 * - Security auditing
 * - Compliance reporting
 * - Investigating suspicious activity
 *
 * @param userId - User UUID whose actions to retrieve
 * @param additionalFilters - Optional additional filters (entityType, startDate, endDate, page, limit)
 * @param options - Query options (enabled, etc.)
 * @returns Query result with user's action history
 *
 * @example
 * ```tsx
 * // Get all actions by specific user
 * const { data: actions } = useUserActions(userId, { page: 1, limit: 50 });
 *
 * // Filter user actions by entity type
 * const { data: transactionActions } = useUserActions(userId, {
 *   entityType: 'TRANSACTION',
 * });
 *
 * // Filter by date range
 * const { data: recentActions } = useUserActions(userId, {
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31',
 * });
 *
 * // Render user activity timeline
 * {actions?.data.map(log => (
 *   <ActivityEntry
 *     key={log.id}
 *     action={log.action}
 *     entityType={log.entityType}
 *     entityId={log.entityId}
 *     timestamp={log.createdAt}
 *     ipAddress={log.ipAddress}
 *   />
 * ))}
 * ```
 */
export const useUserActions = (
  userId: string,
  additionalFilters?: Omit<AuditLogQueryFilters, 'userId'>,
  options?: {
    enabled?: boolean;
  }
) => {
  const { isAdmin } = useAuth();

  return useQuery<PaginatedResponse<AuditLog>, ApiError>({
    queryKey: queryKeys.audit.userActions(userId),
    queryFn: () => auditService.getUserActions(userId, additionalFilters),
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
    // Only enable for admins and if userId is provided
    enabled: isAdmin && !!userId && (options?.enabled ?? true),
  });
};

// ============================================
// FILTER STATE MANAGEMENT HOOK
// ============================================

/**
 * useAuditFilters Hook
 * Custom hook for managing audit log filter state
 *
 * Provides convenient methods for updating filters:
 * - setFilters: Update multiple filters at once
 * - setFilter: Update a single filter
 * - resetFilters: Reset to initial state
 * - setEntityType: Convenience method for entityType filter
 * - setEntityId: Convenience method for entityId filter
 * - setUserId: Convenience method for userId filter
 * - setDateRange: Convenience method for date range (startDate, endDate)
 * - setPage: Update page (for pagination)
 * - setLimit: Update limit (resets page to 1)
 *
 * @param initialFilters - Optional initial filter state
 * @returns Object with filters and setter methods
 *
 * @example
 * ```tsx
 * function AuditLogViewer() {
 *   const { isAdmin } = useAuth();
 *   const {
 *     filters,
 *     setEntityType,
 *     setUserId,
 *     setDateRange,
 *     setPage,
 *     resetFilters,
 *   } = useAuditFilters({ limit: 50 });
 *
 *   const { data, isLoading } = useAuditLogs(filters);
 *
 *   if (!isAdmin) {
 *     return <div>ليس لديك صلاحية لعرض سجل التدقيق</div>;
 *   }
 *
 *   return (
 *     <div>
 *       <select
 *         value={filters.entityType || ''}
 *         onChange={(e) => setEntityType(e.target.value || undefined)}
 *       >
 *         <option value="">جميع الأنواع</option>
 *         <option value="USER">مستخدمين</option>
 *         <option value="BRANCH">فروع</option>
 *         <option value="TRANSACTION">معاملات</option>
 *         <option value="DEBT">ديون</option>
 *         <option value="INVENTORY_ITEM">مخزون</option>
 *       </select>
 *
 *       <DateRangePicker
 *         startDate={filters.startDate}
 *         endDate={filters.endDate}
 *         onChange={(start, end) => setDateRange(start, end)}
 *       />
 *
 *       <button onClick={resetFilters}>مسح الفلاتر</button>
 *
 *       {isLoading ? (
 *         <div>جاري التحميل...</div>
 *       ) : (
 *         <>
 *           <AuditLogTable logs={data?.data || []} />
 *           <Pagination
 *             currentPage={filters.page || 1}
 *             totalPages={data?.meta.totalPages || 0}
 *             onPageChange={setPage}
 *           />
 *         </>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export const useAuditFilters = (initialFilters?: Partial<AuditLogQueryFilters>) => {
  const [filters, setFiltersState] = useState<AuditLogQueryFilters>(initialFilters || {});

  const setFilters = useCallback((newFilters: Partial<AuditLogQueryFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const setFilter = useCallback(
    <K extends keyof AuditLogQueryFilters>(key: K, value: AuditLogQueryFilters[K]) => {
      setFiltersState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFiltersState(initialFilters || {});
  }, [initialFilters]);

  const setEntityType = useCallback((entityType: string | undefined) => {
    setFiltersState((prev) => ({ ...prev, entityType, page: 1 }));
  }, []);

  const setEntityId = useCallback((entityId: string | undefined) => {
    setFiltersState((prev) => ({ ...prev, entityId, page: 1 }));
  }, []);

  const setUserId = useCallback((userId: string | undefined) => {
    setFiltersState((prev) => ({ ...prev, userId, page: 1 }));
  }, []);

  const setDateRange = useCallback((startDate: string | undefined, endDate: string | undefined) => {
    setFiltersState((prev) => ({ ...prev, startDate, endDate, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFiltersState((prev) => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setFiltersState((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  return {
    filters,
    setFilters,
    setFilter,
    resetFilters,
    setEntityType,
    setEntityId,
    setUserId,
    setDateRange,
    setPage,
    setLimit,
  };
};

// ============================================
// HELPER HOOKS
// ============================================

/**
 * useTodayAuditLogs Hook
 * Query today's audit logs (convenience hook, admin only)
 *
 * @param additionalFilters - Optional additional filters
 * @returns Query result with today's audit logs
 */
export const useTodayAuditLogs = (
  additionalFilters?: Omit<AuditLogQueryFilters, 'startDate' | 'endDate'>
) => {
  const today = new Date().toISOString().split('T')[0];

  return useAuditLogs({
    ...additionalFilters,
    startDate: today,
    endDate: today,
  });
};

/**
 * useRecentAuditLogs Hook
 * Query audit logs from last N days (convenience hook, admin only)
 *
 * @param days - Number of days to look back (default: 7)
 * @param additionalFilters - Optional additional filters
 * @returns Query result with recent audit logs
 */
export const useRecentAuditLogs = (
  days: number = 7,
  additionalFilters?: Omit<AuditLogQueryFilters, 'startDate' | 'endDate'>
) => {
  const today = new Date();
  const nDaysAgo = new Date(today);
  nDaysAgo.setDate(today.getDate() - days);

  return useAuditLogs({
    ...additionalFilters,
    startDate: nDaysAgo.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  });
};

/**
 * useUserAuditLogs Hook
 * Query audit logs for USER entity type (convenience hook, admin only)
 *
 * @param additionalFilters - Optional additional filters
 * @returns Query result with user audit logs
 */
export const useUserAuditLogs = (additionalFilters?: Omit<AuditLogQueryFilters, 'entityType'>) => {
  return useAuditLogs({
    ...additionalFilters,
    entityType: 'USER',
  });
};

/**
 * useTransactionAuditLogs Hook
 * Query audit logs for TRANSACTION entity type (convenience hook, admin only)
 *
 * @param additionalFilters - Optional additional filters
 * @returns Query result with transaction audit logs
 */
export const useTransactionAuditLogs = (
  additionalFilters?: Omit<AuditLogQueryFilters, 'entityType'>
) => {
  return useAuditLogs({
    ...additionalFilters,
    entityType: 'TRANSACTION',
  });
};

/**
 * useDebtAuditLogs Hook
 * Query audit logs for DEBT entity type (convenience hook, admin only)
 *
 * @param additionalFilters - Optional additional filters
 * @returns Query result with debt audit logs
 */
export const useDebtAuditLogs = (additionalFilters?: Omit<AuditLogQueryFilters, 'entityType'>) => {
  return useAuditLogs({
    ...additionalFilters,
    entityType: 'DEBT',
  });
};
