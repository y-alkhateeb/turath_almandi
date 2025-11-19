/**
 * useAudit Hooks Tests
 * Tests for audit log query hooks
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderQueryHook } from '@/test/queryTestUtils';
import type { AuditLog } from '#/entity';
import type { PaginatedResponse, AuditLogQueryFilters } from '#/api';
import { ApiError } from '@/api/apiClient';

// Mock dependencies
vi.mock('@/api/services/auditService');
vi.mock('../useAuth');

import auditService from '@/api/services/auditService';
import { useAuth } from '../useAuth';
import * as useAuditHooks from './useAudit';

describe('useAudit Hooks', () => {
  const mockAuditLog: AuditLog = {
    id: 'audit-1',
    entityType: 'USER',
    entityId: 'user-123',
    action: 'UPDATE',
    userId: 'admin-123',
    changes: {
      before: { role: 'ACCOUNTANT' },
      after: { role: 'ADMIN' },
    },
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    createdAt: '2024-01-01T00:00:00Z',
  };

  const mockPaginatedResponse: PaginatedResponse<AuditLog> = {
    data: [mockAuditLog],
    meta: {
      total: 1,
      page: 1,
      limit: 50,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useAuditLogs', () => {
    it('should fetch audit logs successfully when user is admin', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAdmin: true,
        isAuthenticated: true,
      } as any);

      vi.mocked(auditService.getAll).mockResolvedValue(mockPaginatedResponse);

      const { result } = renderQueryHook(() => useAuditHooks.useAuditLogs());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockPaginatedResponse);
      expect(auditService.getAll).toHaveBeenCalledWith(undefined);
    });

    it('should pass filters to service', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAdmin: true,
        isAuthenticated: true,
      } as any);

      vi.mocked(auditService.getAll).mockResolvedValue(mockPaginatedResponse);

      const filters: AuditLogQueryFilters = {
        entityType: 'USER',
        page: 1,
        limit: 20,
      };

      const { result } = renderQueryHook(() => useAuditHooks.useAuditLogs(filters));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(auditService.getAll).toHaveBeenCalledWith(filters);
    });

    it('should not fetch when user is not admin', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAdmin: false,
        isAuthenticated: true,
      } as any);

      const { result } = renderQueryHook(() => useAuditHooks.useAuditLogs());

      await waitFor(() => {
        expect(result.current.fetchStatus).toBe('idle');
      });

      expect(auditService.getAll).not.toHaveBeenCalled();
    });

    it('should handle error state', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAdmin: true,
        isAuthenticated: true,
      } as any);

      const error = new ApiError(403, 'Forbidden', 'Forbidden');
      vi.mocked(auditService.getAll).mockRejectedValue(error);

      const { result } = renderQueryHook(() => useAuditHooks.useAuditLogs());

      expect(result.current.isLoading).toBe(true);

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 3000 },
      );

      expect(result.current.error).toEqual(error);
    });

    it('should respect enabled option', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAdmin: true,
        isAuthenticated: true,
      } as any);

      const { result } = renderQueryHook(() =>
        useAuditHooks.useAuditLogs(undefined, { enabled: false }),
      );

      await waitFor(() => {
        expect(result.current.fetchStatus).toBe('idle');
      });

      expect(auditService.getAll).not.toHaveBeenCalled();
    });
  });

  describe('useEntityHistory', () => {
    it('should fetch entity history successfully', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAdmin: true,
        isAuthenticated: true,
      } as any);

      vi.mocked(auditService.getEntityHistory).mockResolvedValue(mockPaginatedResponse);

      const { result } = renderQueryHook(() =>
        useAuditHooks.useEntityHistory('USER', 'user-123'),
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockPaginatedResponse);
      expect(auditService.getEntityHistory).toHaveBeenCalledWith('USER', 'user-123', undefined);
    });

    it('should pass additional filters', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAdmin: true,
        isAuthenticated: true,
      } as any);

      vi.mocked(auditService.getEntityHistory).mockResolvedValue(mockPaginatedResponse);

      const additionalFilters = { page: 1, limit: 10 };

      const { result } = renderQueryHook(() =>
        useAuditHooks.useEntityHistory('USER', 'user-123', additionalFilters),
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(auditService.getEntityHistory).toHaveBeenCalledWith(
        'USER',
        'user-123',
        additionalFilters,
      );
    });

    it('should not fetch when entityId is empty', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAdmin: true,
        isAuthenticated: true,
      } as any);

      const { result } = renderQueryHook(() => useAuditHooks.useEntityHistory('USER', ''));

      await waitFor(() => {
        expect(result.current.fetchStatus).toBe('idle');
      });

      expect(auditService.getEntityHistory).not.toHaveBeenCalled();
    });

    it('should not fetch when user is not admin', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAdmin: false,
        isAuthenticated: true,
      } as any);

      const { result } = renderQueryHook(() =>
        useAuditHooks.useEntityHistory('USER', 'user-123'),
      );

      await waitFor(() => {
        expect(result.current.fetchStatus).toBe('idle');
      });

      expect(auditService.getEntityHistory).not.toHaveBeenCalled();
    });
  });

  describe('useUserActions', () => {
    it('should fetch user actions successfully', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAdmin: true,
        isAuthenticated: true,
      } as any);

      vi.mocked(auditService.getUserActions).mockResolvedValue(mockPaginatedResponse);

      const { result } = renderQueryHook(() => useAuditHooks.useUserActions('user-123'));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockPaginatedResponse);
      expect(auditService.getUserActions).toHaveBeenCalledWith('user-123', undefined);
    });

    it('should pass additional filters', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAdmin: true,
        isAuthenticated: true,
      } as any);

      vi.mocked(auditService.getUserActions).mockResolvedValue(mockPaginatedResponse);

      const additionalFilters = { entityType: 'TRANSACTION' };

      const { result } = renderQueryHook(() =>
        useAuditHooks.useUserActions('user-123', additionalFilters),
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(auditService.getUserActions).toHaveBeenCalledWith('user-123', additionalFilters);
    });

    it('should not fetch when userId is empty', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAdmin: true,
        isAuthenticated: true,
      } as any);

      const { result } = renderQueryHook(() => useAuditHooks.useUserActions(''));

      await waitFor(() => {
        expect(result.current.fetchStatus).toBe('idle');
      });

      expect(auditService.getUserActions).not.toHaveBeenCalled();
    });
  });

  describe('useAuditFilters', () => {
    it('should initialize with empty filters', () => {
      const { result } = renderQueryHook(() => useAuditHooks.useAuditFilters());

      expect(result.current.filters).toEqual({});
    });

    it('should initialize with provided filters', () => {
      const initialFilters = { entityType: 'USER', limit: 20 };
      const { result } = renderQueryHook(() => useAuditHooks.useAuditFilters(initialFilters));

      expect(result.current.filters).toEqual(initialFilters);
    });

    it('should update filters with setFilters', () => {
      const { result } = renderQueryHook(() => useAuditHooks.useAuditFilters());

      const newFilters = { entityType: 'USER', page: 2 };
      result.current.setFilters(newFilters);

      waitFor(() => {
        expect(result.current.filters).toEqual(newFilters);
      });
    });

    it('should update single filter with setFilter', () => {
      const { result } = renderQueryHook(() => useAuditHooks.useAuditFilters());

      result.current.setFilter('entityType', 'TRANSACTION');

      waitFor(() => {
        expect(result.current.filters.entityType).toBe('TRANSACTION');
      });
    });

    it('should reset filters', () => {
      const initialFilters = { entityType: 'USER', limit: 20 };
      const { result } = renderQueryHook(() => useAuditHooks.useAuditFilters(initialFilters));

      result.current.setFilters({ entityType: 'TRANSACTION', page: 2 });
      result.current.resetFilters();

      waitFor(() => {
        expect(result.current.filters).toEqual(initialFilters);
      });
    });

    it('should set entity type and reset page', () => {
      const { result } = renderQueryHook(() =>
        useAuditHooks.useAuditFilters({ page: 5 }),
      );

      result.current.setEntityType('USER');

      waitFor(() => {
        expect(result.current.filters.entityType).toBe('USER');
        expect(result.current.filters.page).toBe(1);
      });
    });

    it('should set entity id and reset page', () => {
      const { result } = renderQueryHook(() =>
        useAuditHooks.useAuditFilters({ page: 5 }),
      );

      result.current.setEntityId('entity-123');

      waitFor(() => {
        expect(result.current.filters.entityId).toBe('entity-123');
        expect(result.current.filters.page).toBe(1);
      });
    });

    it('should set user id and reset page', () => {
      const { result } = renderQueryHook(() =>
        useAuditHooks.useAuditFilters({ page: 5 }),
      );

      result.current.setUserId('user-123');

      waitFor(() => {
        expect(result.current.filters.userId).toBe('user-123');
        expect(result.current.filters.page).toBe(1);
      });
    });

    it('should set date range and reset page', () => {
      const { result } = renderQueryHook(() =>
        useAuditHooks.useAuditFilters({ page: 5 }),
      );

      result.current.setDateRange('2024-01-01', '2024-01-31');

      waitFor(() => {
        expect(result.current.filters.startDate).toBe('2024-01-01');
        expect(result.current.filters.endDate).toBe('2024-01-31');
        expect(result.current.filters.page).toBe(1);
      });
    });

    it('should set page', () => {
      const { result } = renderQueryHook(() => useAuditHooks.useAuditFilters());

      result.current.setPage(3);

      waitFor(() => {
        expect(result.current.filters.page).toBe(3);
      });
    });

    it('should set limit and reset page', () => {
      const { result } = renderQueryHook(() =>
        useAuditHooks.useAuditFilters({ page: 5 }),
      );

      result.current.setLimit(100);

      waitFor(() => {
        expect(result.current.filters.limit).toBe(100);
        expect(result.current.filters.page).toBe(1);
      });
    });
  });

  describe('useTodayAuditLogs', () => {
    it('should fetch today audit logs with correct date range', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAdmin: true,
        isAuthenticated: true,
      } as any);

      vi.mocked(auditService.getAll).mockResolvedValue(mockPaginatedResponse);

      const { result } = renderQueryHook(() => useAuditHooks.useTodayAuditLogs());

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const today = new Date().toISOString().split('T')[0];
      expect(auditService.getAll).toHaveBeenCalledWith({
        startDate: today,
        endDate: today,
      });
    });

    it('should merge additional filters', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAdmin: true,
        isAuthenticated: true,
      } as any);

      vi.mocked(auditService.getAll).mockResolvedValue(mockPaginatedResponse);

      const { result } = renderQueryHook(() =>
        useAuditHooks.useTodayAuditLogs({ entityType: 'USER' }),
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const today = new Date().toISOString().split('T')[0];
      expect(auditService.getAll).toHaveBeenCalledWith({
        entityType: 'USER',
        startDate: today,
        endDate: today,
      });
    });
  });

  describe('useRecentAuditLogs', () => {
    it('should fetch recent audit logs with default 7 days', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAdmin: true,
        isAuthenticated: true,
      } as any);

      vi.mocked(auditService.getAll).mockResolvedValue(mockPaginatedResponse);

      const { result } = renderQueryHook(() => useAuditHooks.useRecentAuditLogs());

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(auditService.getAll).toHaveBeenCalled();
      const callArgs = vi.mocked(auditService.getAll).mock.calls[0][0];
      expect(callArgs?.startDate).toBeDefined();
      expect(callArgs?.endDate).toBeDefined();
    });

    it('should fetch recent audit logs with custom days', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAdmin: true,
        isAuthenticated: true,
      } as any);

      vi.mocked(auditService.getAll).mockResolvedValue(mockPaginatedResponse);

      const { result } = renderQueryHook(() => useAuditHooks.useRecentAuditLogs(30));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(auditService.getAll).toHaveBeenCalled();
    });
  });

  describe('useUserAuditLogs', () => {
    it('should fetch user audit logs', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAdmin: true,
        isAuthenticated: true,
      } as any);

      vi.mocked(auditService.getAll).mockResolvedValue(mockPaginatedResponse);

      const { result } = renderQueryHook(() => useAuditHooks.useUserAuditLogs());

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(auditService.getAll).toHaveBeenCalledWith({
        entityType: 'USER',
      });
    });
  });

  describe('useTransactionAuditLogs', () => {
    it('should fetch transaction audit logs', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAdmin: true,
        isAuthenticated: true,
      } as any);

      vi.mocked(auditService.getAll).mockResolvedValue(mockPaginatedResponse);

      const { result } = renderQueryHook(() => useAuditHooks.useTransactionAuditLogs());

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(auditService.getAll).toHaveBeenCalledWith({
        entityType: 'TRANSACTION',
      });
    });
  });

  describe('useDebtAuditLogs', () => {
    it('should fetch debt audit logs', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAdmin: true,
        isAuthenticated: true,
      } as any);

      vi.mocked(auditService.getAll).mockResolvedValue(mockPaginatedResponse);

      const { result } = renderQueryHook(() => useAuditHooks.useDebtAuditLogs());

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(auditService.getAll).toHaveBeenCalledWith({
        entityType: 'DEBT',
      });
    });
  });
});
