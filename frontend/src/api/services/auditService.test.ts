/**
 * Audit Service Tests
 * Tests for audit log API service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockApiClient, mockSuccess, mockError, verifyRequest, resetApiClientMocks } from '@/test/apiClientMock';
import type { AuditLog } from '#/entity';
import type { PaginatedResponse, AuditLogQueryFilters } from '#/api';

// Mock the apiClient module
vi.mock('../apiClient', () => ({
  default: mockApiClient,
}));

// Import after mocking
import * as auditService from './auditService';
import { AuditApiEndpoints } from './auditService';

describe('auditService', () => {
  const mockAuditLog: AuditLog = {
    id: 'audit-123',
    entityType: 'TRANSACTION',
    entityId: 'transaction-123',
    action: 'CREATE',
    userId: 'user-123',
    changes: {
      before: null,
      after: { amount: 1000, type: 'INCOME' },
    },
    timestamp: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    resetApiClientMocks();
  });

  describe('getAll', () => {
    const mockPaginatedResponse: PaginatedResponse<AuditLog> = {
      data: [mockAuditLog],
      meta: {
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      },
    };

    it('should get all audit logs with default pagination', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      const result = await auditService.getAll();

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: AuditApiEndpoints.GetAll,
        params: undefined,
      });
    });

    it('should get audit logs with filters', async () => {
      const filters: AuditLogQueryFilters = {
        entityType: 'USER',
        entityId: 'user-123',
        userId: 'admin-123',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        page: 2,
        limit: 20,
      };

      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      await auditService.getAll(filters);

      verifyRequest(mockApiClient.get, {
        url: AuditApiEndpoints.GetAll,
        params: filters,
      });
    });

    it('should filter by entity type', async () => {
      const filters: AuditLogQueryFilters = {
        entityType: 'BRANCH',
      };

      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      await auditService.getAll(filters);

      verifyRequest(mockApiClient.get, {
        url: AuditApiEndpoints.GetAll,
        params: filters,
      });
    });

    it('should filter by entity ID', async () => {
      const filters: AuditLogQueryFilters = {
        entityId: 'debt-123',
      };

      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      await auditService.getAll(filters);

      verifyRequest(mockApiClient.get, {
        url: AuditApiEndpoints.GetAll,
        params: filters,
      });
    });

    it('should filter by user ID', async () => {
      const filters: AuditLogQueryFilters = {
        userId: 'user-123',
      };

      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      await auditService.getAll(filters);

      verifyRequest(mockApiClient.get, {
        url: AuditApiEndpoints.GetAll,
        params: filters,
      });
    });

    it('should filter by date range', async () => {
      const filters: AuditLogQueryFilters = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      await auditService.getAll(filters);

      verifyRequest(mockApiClient.get, {
        url: AuditApiEndpoints.GetAll,
        params: filters,
      });
    });

    it('should handle 401 error', async () => {
      mockApiClient.get.mockReturnValue(mockError(401, 'Not authenticated'));

      await expect(auditService.getAll()).rejects.toThrow('Not authenticated');
    });

    it('should handle 403 error for non-admin', async () => {
      mockApiClient.get.mockReturnValue(mockError(403, 'Admin access required'));

      await expect(auditService.getAll()).rejects.toThrow('Admin access required');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      const result = auditService.getAll();

      const _typeCheck: Promise<PaginatedResponse<AuditLog>> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('getEntityHistory', () => {
    it('should get audit logs for specific entity', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [mockAuditLog], meta: { total: 1, page: 1, limit: 50, totalPages: 1 } }));

      await auditService.getEntityHistory('TRANSACTION', 'transaction-123');

      verifyRequest(mockApiClient.get, {
        url: AuditApiEndpoints.GetAll,
        params: {
          entityType: 'TRANSACTION',
          entityId: 'transaction-123',
        },
      });
    });

    it('should pass additional filters', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await auditService.getEntityHistory('USER', 'user-123', {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      verifyRequest(mockApiClient.get, {
        url: AuditApiEndpoints.GetAll,
        params: {
          entityType: 'USER',
          entityId: 'user-123',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
      });
    });

    it('should handle 403 error', async () => {
      mockApiClient.get.mockReturnValue(mockError(403, 'Forbidden'));

      await expect(auditService.getEntityHistory('DEBT', 'debt-123')).rejects.toThrow('Forbidden');
    });
  });

  describe('getUserActions', () => {
    it('should get audit logs for specific user', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [mockAuditLog], meta: { total: 1, page: 1, limit: 50, totalPages: 1 } }));

      await auditService.getUserActions('user-123');

      verifyRequest(mockApiClient.get, {
        url: AuditApiEndpoints.GetAll,
        params: {
          userId: 'user-123',
        },
      });
    });

    it('should pass additional filters', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await auditService.getUserActions('user-123', {
        entityType: 'TRANSACTION',
        startDate: '2024-01-01',
      });

      verifyRequest(mockApiClient.get, {
        url: AuditApiEndpoints.GetAll,
        params: {
          userId: 'user-123',
          entityType: 'TRANSACTION',
          startDate: '2024-01-01',
        },
      });
    });
  });

  describe('getByEntityType', () => {
    it('should get audit logs for specific entity type', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [mockAuditLog], meta: { total: 1, page: 1, limit: 50, totalPages: 1 } }));

      await auditService.getByEntityType('TRANSACTION');

      verifyRequest(mockApiClient.get, {
        url: AuditApiEndpoints.GetAll,
        params: {
          entityType: 'TRANSACTION',
        },
      });
    });

    it('should pass additional filters', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await auditService.getByEntityType('USER', {
        userId: 'admin-123',
      });

      verifyRequest(mockApiClient.get, {
        url: AuditApiEndpoints.GetAll,
        params: {
          entityType: 'USER',
          userId: 'admin-123',
        },
      });
    });
  });

  describe('getByDateRange', () => {
    it('should get audit logs by date range', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await auditService.getByDateRange('2024-01-01', '2024-12-31');

      verifyRequest(mockApiClient.get, {
        url: AuditApiEndpoints.GetAll,
        params: {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
      });
    });

    it('should pass additional filters', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await auditService.getByDateRange('2024-01-01', '2024-12-31', {
        entityType: 'DEBT',
        userId: 'user-123',
      });

      verifyRequest(mockApiClient.get, {
        url: AuditApiEndpoints.GetAll,
        params: {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          entityType: 'DEBT',
          userId: 'user-123',
        },
      });
    });
  });

  describe('getTodayLogs', () => {
    it('should get today\'s audit logs', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [mockAuditLog], meta: { total: 1, page: 1, limit: 50, totalPages: 1 } }));

      await auditService.getTodayLogs();

      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      const call = mockApiClient.get.mock.calls[0][0];
      expect(call.params).toHaveProperty('startDate');
      expect(call.params).toHaveProperty('endDate');
      expect(call.params.startDate).toBe(call.params.endDate);
    });

    it('should pass additional filters', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await auditService.getTodayLogs({ entityType: 'USER' });

      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      const call = mockApiClient.get.mock.calls[0][0];
      expect(call.params.entityType).toBe('USER');
    });
  });

  describe('getRecentLogs', () => {
    it('should get recent audit logs with default 7 days', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [mockAuditLog], meta: { total: 1, page: 1, limit: 50, totalPages: 1 } }));

      await auditService.getRecentLogs();

      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      const call = mockApiClient.get.mock.calls[0][0];
      expect(call.params).toHaveProperty('startDate');
      expect(call.params).toHaveProperty('endDate');
    });

    it('should get recent logs with custom days', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await auditService.getRecentLogs(30);

      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should pass additional filters', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await auditService.getRecentLogs(7, { entityType: 'TRANSACTION' });

      const call = mockApiClient.get.mock.calls[0][0];
      expect(call.params.entityType).toBe('TRANSACTION');
    });
  });

  describe('getAllUnpaginated', () => {
    it('should extract data array from paginated response', async () => {
      const mockResponse: PaginatedResponse<AuditLog> = {
        data: [mockAuditLog],
        meta: {
          total: 1,
          page: 1,
          limit: 10000,
          totalPages: 1,
        },
      };

      mockApiClient.get.mockReturnValue(mockSuccess(mockResponse));

      const result = await auditService.getAllUnpaginated();

      expect(result).toEqual([mockAuditLog]);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: AuditApiEndpoints.GetAll,
        params: { limit: 10000 },
      });
    });

    it('should pass filters without page and limit', async () => {
      const filters = {
        entityType: 'USER',
        userId: 'user-123',
      };

      mockApiClient.get.mockReturnValue(mockSuccess({ data: [mockAuditLog], meta: { total: 1, page: 1, limit: 10000, totalPages: 1 } }));

      await auditService.getAllUnpaginated(filters);

      verifyRequest(mockApiClient.get, {
        url: AuditApiEndpoints.GetAll,
        params: { ...filters, limit: 10000 },
      });
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [mockAuditLog], meta: { total: 1, page: 1, limit: 10000, totalPages: 1 } }));

      const result = auditService.getAllUnpaginated();

      const _typeCheck: Promise<AuditLog[]> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('getTransactionLogs', () => {
    it('should get audit logs for TRANSACTION entity type', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [mockAuditLog], meta: { total: 1, page: 1, limit: 50, totalPages: 1 } }));

      await auditService.getTransactionLogs();

      verifyRequest(mockApiClient.get, {
        url: AuditApiEndpoints.GetAll,
        params: {
          entityType: 'TRANSACTION',
        },
      });
    });

    it('should pass additional filters', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await auditService.getTransactionLogs({ userId: 'user-123' });

      verifyRequest(mockApiClient.get, {
        url: AuditApiEndpoints.GetAll,
        params: {
          entityType: 'TRANSACTION',
          userId: 'user-123',
        },
      });
    });
  });

  describe('getDebtLogs', () => {
    it('should get audit logs for DEBT entity type', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await auditService.getDebtLogs();

      verifyRequest(mockApiClient.get, {
        url: AuditApiEndpoints.GetAll,
        params: {
          entityType: 'DEBT',
        },
      });
    });

    it('should pass additional filters', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await auditService.getDebtLogs({ startDate: '2024-01-01' });

      verifyRequest(mockApiClient.get, {
        url: AuditApiEndpoints.GetAll,
        params: {
          entityType: 'DEBT',
          startDate: '2024-01-01',
        },
      });
    });
  });

  describe('getUserManagementLogs', () => {
    it('should get audit logs for USER entity type', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await auditService.getUserManagementLogs();

      verifyRequest(mockApiClient.get, {
        url: AuditApiEndpoints.GetAll,
        params: {
          entityType: 'USER',
        },
      });
    });

    it('should pass additional filters', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await auditService.getUserManagementLogs({ userId: 'admin-123' });

      verifyRequest(mockApiClient.get, {
        url: AuditApiEndpoints.GetAll,
        params: {
          entityType: 'USER',
          userId: 'admin-123',
        },
      });
    });
  });

  describe('AuditApiEndpoints', () => {
    it('should have correct endpoint values', () => {
      expect(AuditApiEndpoints.GetAll).toBe('/audit');
    });
  });

  describe('default export', () => {
    it('should export service object with all methods', () => {
      expect(auditService.default).toBeDefined();
      expect(auditService.default.getAll).toBe(auditService.getAll);
      expect(auditService.default.getAllUnpaginated).toBe(auditService.getAllUnpaginated);
      expect(auditService.default.getEntityHistory).toBe(auditService.getEntityHistory);
      expect(auditService.default.getUserActions).toBe(auditService.getUserActions);
      expect(auditService.default.getByEntityType).toBe(auditService.getByEntityType);
      expect(auditService.default.getByDateRange).toBe(auditService.getByDateRange);
      expect(auditService.default.getTodayLogs).toBe(auditService.getTodayLogs);
      expect(auditService.default.getRecentLogs).toBe(auditService.getRecentLogs);
      expect(auditService.default.getTransactionLogs).toBe(auditService.getTransactionLogs);
      expect(auditService.default.getDebtLogs).toBe(auditService.getDebtLogs);
      expect(auditService.default.getUserManagementLogs).toBe(auditService.getUserManagementLogs);
    });
  });
});
