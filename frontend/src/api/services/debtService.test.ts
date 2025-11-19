/**
 * Debt Service Tests
 * Tests for debt management API service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockApiClient, mockSuccess, mockError, verifyRequest, resetApiClientMocks } from '@/test/apiClientMock';
import type { Debt, CreateDebtInput, UpdateDebtInput, PayDebtInput } from '#/entity';
import type { PaginatedResponse, DebtQueryFilters, DebtSummaryResponse } from '#/api';

// Mock the apiClient module
vi.mock('../apiClient', () => ({
  default: mockApiClient,
}));

// Import after mocking
import * as debtService from './debtService';
import { DebtApiEndpoints } from './debtService';

describe('debtService', () => {
  const mockDebt: Debt = {
    id: 'debt-123',
    creditorName: 'John Supplier',
    amount: 1000,
    remainingAmount: 1000,
    currency: 'USD',
    date: '2024-01-01',
    dueDate: '2024-02-01',
    status: 'ACTIVE',
    notes: 'Test debt',
    branchId: 'branch-123',
    createdById: 'user-123',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    payments: [],
  };

  beforeEach(() => {
    resetApiClientMocks();
  });

  describe('getAll', () => {
    const mockPaginatedResponse: PaginatedResponse<Debt> = {
      data: [mockDebt],
      meta: {
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      },
    };

    it('should get all debts with default pagination', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      const result = await debtService.getAll();

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: DebtApiEndpoints.GetAll,
        params: undefined,
      });
    });

    it('should get debts with filters', async () => {
      const filters: DebtQueryFilters = {
        status: 'ACTIVE',
        branchId: 'branch-123',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        page: 2,
        limit: 20,
      };

      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      await debtService.getAll(filters);

      verifyRequest(mockApiClient.get, {
        url: DebtApiEndpoints.GetAll,
        params: filters,
      });
    });

    it('should get debts with date range filters', async () => {
      const filters: DebtQueryFilters = {
        dueDateStart: '2024-01-01',
        dueDateEnd: '2024-02-01',
      };

      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      await debtService.getAll(filters);

      verifyRequest(mockApiClient.get, {
        url: DebtApiEndpoints.GetAll,
        params: filters,
      });
    });

    it('should get debts with search filter', async () => {
      const filters: DebtQueryFilters = {
        search: 'John',
      };

      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      await debtService.getAll(filters);

      verifyRequest(mockApiClient.get, {
        url: DebtApiEndpoints.GetAll,
        params: filters,
      });
    });

    it('should handle 401 error', async () => {
      mockApiClient.get.mockReturnValue(mockError(401, 'Not authenticated'));

      await expect(debtService.getAll()).rejects.toThrow('Not authenticated');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      const result = debtService.getAll();

      const _typeCheck: Promise<PaginatedResponse<Debt>> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('getOne', () => {
    it('should get debt by ID', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockDebt));

      const result = await debtService.getOne('debt-123');

      expect(result).toEqual(mockDebt);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: '/debts/debt-123',
      });
    });

    it('should handle 404 error', async () => {
      mockApiClient.get.mockReturnValue(mockError(404, 'Debt not found'));

      await expect(debtService.getOne('nonexistent')).rejects.toThrow('Debt not found');
    });

    it('should handle 403 error for wrong branch', async () => {
      mockApiClient.get.mockReturnValue(mockError(403, 'Forbidden'));

      await expect(debtService.getOne('debt-123')).rejects.toThrow('Forbidden');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockDebt));

      const result = debtService.getOne('debt-123');

      const _typeCheck: Promise<Debt> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('create', () => {
    const createData: CreateDebtInput = {
      creditorName: 'New Creditor',
      amount: 2000,
      currency: 'USD',
      date: '2024-01-15',
      dueDate: '2024-02-15',
      notes: 'New debt',
      branchId: 'branch-123',
    };

    it('should create debt successfully', async () => {
      mockApiClient.post.mockReturnValue(mockSuccess(mockDebt));

      const result = await debtService.create(createData);

      expect(result).toEqual(mockDebt);
      expect(mockApiClient.post).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.post, {
        url: DebtApiEndpoints.Create,
        data: createData,
      });
    });

    it('should create debt with IQD currency', async () => {
      const iqdData: CreateDebtInput = {
        ...createData,
        currency: 'IQD',
      };

      mockApiClient.post.mockReturnValue(mockSuccess({ ...mockDebt, currency: 'IQD' }));

      const result = await debtService.create(iqdData);

      expect(result.currency).toBe('IQD');
      verifyRequest(mockApiClient.post, {
        url: DebtApiEndpoints.Create,
        data: iqdData,
      });
    });

    it('should create debt without notes', async () => {
      const { notes, ...dataWithoutNotes } = createData;

      mockApiClient.post.mockReturnValue(mockSuccess(mockDebt));

      await debtService.create(dataWithoutNotes);

      verifyRequest(mockApiClient.post, {
        url: DebtApiEndpoints.Create,
        data: dataWithoutNotes,
      });
    });

    it('should handle 400 validation error', async () => {
      mockApiClient.post.mockReturnValue(mockError(400, 'Amount must be positive'));

      await expect(debtService.create(createData)).rejects.toThrow('Amount must be positive');
    });

    it('should handle 401 error', async () => {
      mockApiClient.post.mockReturnValue(mockError(401, 'Not authenticated'));

      await expect(debtService.create(createData)).rejects.toThrow('Not authenticated');
    });

    it('should handle 403 error', async () => {
      mockApiClient.post.mockReturnValue(mockError(403, 'Forbidden'));

      await expect(debtService.create(createData)).rejects.toThrow('Forbidden');
    });

    it('should handle 404 error for invalid branchId', async () => {
      mockApiClient.post.mockReturnValue(mockError(404, 'Branch not found'));

      await expect(debtService.create(createData)).rejects.toThrow('Branch not found');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.post.mockReturnValue(mockSuccess(mockDebt));

      const result = debtService.create(createData);

      const _typeCheck: Promise<Debt> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('update', () => {
    const updateData: UpdateDebtInput = {
      creditorName: 'Updated Creditor',
      dueDate: '2024-03-01',
      notes: 'Updated notes',
    };

    it('should update debt successfully', async () => {
      const updatedDebt = { ...mockDebt, ...updateData };
      mockApiClient.patch.mockReturnValue(mockSuccess(updatedDebt));

      const result = await debtService.update('debt-123', updateData);

      expect(result).toEqual(updatedDebt);
      expect(mockApiClient.patch).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.patch, {
        url: '/debts/debt-123',
        data: updateData,
      });
    });

    it('should update only creditor name', async () => {
      const nameUpdate = { creditorName: 'New Name' };
      mockApiClient.patch.mockReturnValue(mockSuccess(mockDebt));

      await debtService.update('debt-123', nameUpdate);

      verifyRequest(mockApiClient.patch, {
        url: '/debts/debt-123',
        data: nameUpdate,
      });
    });

    it('should update only due date', async () => {
      const dueDateUpdate = { dueDate: '2024-03-15' };
      mockApiClient.patch.mockReturnValue(mockSuccess(mockDebt));

      await debtService.update('debt-123', dueDateUpdate);

      verifyRequest(mockApiClient.patch, {
        url: '/debts/debt-123',
        data: dueDateUpdate,
      });
    });

    it('should handle 400 validation error', async () => {
      mockApiClient.patch.mockReturnValue(mockError(400, 'Invalid due date'));

      await expect(debtService.update('debt-123', updateData)).rejects.toThrow('Invalid due date');
    });

    it('should handle 404 error', async () => {
      mockApiClient.patch.mockReturnValue(mockError(404, 'Debt not found'));

      await expect(debtService.update('nonexistent', updateData)).rejects.toThrow('Debt not found');
    });

    it('should handle 403 error for wrong branch', async () => {
      mockApiClient.patch.mockReturnValue(mockError(403, 'Forbidden'));

      await expect(debtService.update('debt-123', updateData)).rejects.toThrow('Forbidden');
    });

    it('should handle 409 error for already paid', async () => {
      mockApiClient.patch.mockReturnValue(mockError(409, 'Cannot update paid debt'));

      await expect(debtService.update('debt-123', updateData)).rejects.toThrow('Cannot update paid debt');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.patch.mockReturnValue(mockSuccess(mockDebt));

      const result = debtService.update('debt-123', updateData);

      const _typeCheck: Promise<Debt> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('deleteDebt', () => {
    it('should delete debt successfully', async () => {
      mockApiClient.delete.mockReturnValue(mockSuccess(undefined));

      await debtService.deleteDebt('debt-123');

      expect(mockApiClient.delete).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.delete, {
        url: '/debts/debt-123',
      });
    });

    it('should handle 404 error', async () => {
      mockApiClient.delete.mockReturnValue(mockError(404, 'Debt not found'));

      await expect(debtService.deleteDebt('nonexistent')).rejects.toThrow('Debt not found');
    });

    it('should handle 403 error for wrong branch', async () => {
      mockApiClient.delete.mockReturnValue(mockError(403, 'Forbidden'));

      await expect(debtService.deleteDebt('debt-123')).rejects.toThrow('Forbidden');
    });

    it('should handle 409 conflict error for debts with payments', async () => {
      mockApiClient.delete.mockReturnValue(mockError(409, 'Cannot delete debt with payments'));

      await expect(debtService.deleteDebt('debt-123')).rejects.toThrow('Cannot delete debt with payments');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.delete.mockReturnValue(mockSuccess(undefined));

      const result = debtService.deleteDebt('debt-123');

      const _typeCheck: Promise<void> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('payDebt', () => {
    const paymentData: PayDebtInput = {
      amount: 500,
      paymentDate: '2024-01-10',
      notes: 'Partial payment',
    };

    const debtWithPayment: Debt = {
      ...mockDebt,
      remainingAmount: 500,
      status: 'PARTIAL',
      payments: [
        {
          id: 'payment-123',
          amount: 500,
          paymentDate: '2024-01-10',
          notes: 'Partial payment',
          debtId: 'debt-123',
          recordedById: 'user-123',
          createdAt: '2024-01-10T00:00:00Z',
        },
      ],
    };

    it('should record payment successfully', async () => {
      mockApiClient.post.mockReturnValue(mockSuccess(debtWithPayment));

      const result = await debtService.payDebt('debt-123', paymentData);

      expect(result).toEqual(debtWithPayment);
      expect(mockApiClient.post).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.post, {
        url: '/debts/debt-123/payments',
        data: paymentData,
      });
    });

    it('should record full payment', async () => {
      const fullPayment: PayDebtInput = {
        amount: 1000,
        paymentDate: '2024-01-10',
      };

      const paidDebt: Debt = {
        ...mockDebt,
        remainingAmount: 0,
        status: 'PAID',
      };

      mockApiClient.post.mockReturnValue(mockSuccess(paidDebt));

      const result = await debtService.payDebt('debt-123', fullPayment);

      expect(result.status).toBe('PAID');
      expect(result.remainingAmount).toBe(0);
    });

    it('should record payment without notes', async () => {
      const { notes, ...paymentWithoutNotes } = paymentData;

      mockApiClient.post.mockReturnValue(mockSuccess(debtWithPayment));

      await debtService.payDebt('debt-123', paymentWithoutNotes);

      verifyRequest(mockApiClient.post, {
        url: '/debts/debt-123/payments',
        data: paymentWithoutNotes,
      });
    });

    it('should handle 400 validation error for overpayment', async () => {
      mockApiClient.post.mockReturnValue(mockError(400, 'Payment exceeds remaining amount'));

      await expect(debtService.payDebt('debt-123', paymentData)).rejects.toThrow('Payment exceeds remaining amount');
    });

    it('should handle 400 validation error for negative amount', async () => {
      mockApiClient.post.mockReturnValue(mockError(400, 'Amount must be positive'));

      await expect(debtService.payDebt('debt-123', paymentData)).rejects.toThrow('Amount must be positive');
    });

    it('should handle 404 error', async () => {
      mockApiClient.post.mockReturnValue(mockError(404, 'Debt not found'));

      await expect(debtService.payDebt('nonexistent', paymentData)).rejects.toThrow('Debt not found');
    });

    it('should handle 409 error for already paid debt', async () => {
      mockApiClient.post.mockReturnValue(mockError(409, 'Debt already paid'));

      await expect(debtService.payDebt('debt-123', paymentData)).rejects.toThrow('Debt already paid');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.post.mockReturnValue(mockSuccess(debtWithPayment));

      const result = debtService.payDebt('debt-123', paymentData);

      const _typeCheck: Promise<Debt> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('getSummary', () => {
    const mockSummary: DebtSummaryResponse = {
      totalDebts: 10,
      activeDebts: 5,
      paidDebts: 3,
      partialDebts: 2,
      totalOwed: 5000,
      overdueDebts: 1,
    };

    it('should get debt summary without filters', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockSummary));

      const result = await debtService.getSummary();

      expect(result).toEqual(mockSummary);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: DebtApiEndpoints.GetSummary,
        params: undefined,
      });
    });

    it('should get debt summary with filters', async () => {
      const filters = {
        branchId: 'branch-123',
        status: 'ACTIVE' as const,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      mockApiClient.get.mockReturnValue(mockSuccess(mockSummary));

      await debtService.getSummary(filters);

      verifyRequest(mockApiClient.get, {
        url: DebtApiEndpoints.GetSummary,
        params: filters,
      });
    });

    it('should handle 401 error', async () => {
      mockApiClient.get.mockReturnValue(mockError(401, 'Not authenticated'));

      await expect(debtService.getSummary()).rejects.toThrow('Not authenticated');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockSummary));

      const result = debtService.getSummary();

      const _typeCheck: Promise<DebtSummaryResponse> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('getAllUnpaginated', () => {
    it('should extract data array from paginated response', async () => {
      const mockResponse: PaginatedResponse<Debt> = {
        data: [mockDebt],
        meta: {
          total: 1,
          page: 1,
          limit: 10000,
          totalPages: 1,
        },
      };

      mockApiClient.get.mockReturnValue(mockSuccess(mockResponse));

      const result = await debtService.getAllUnpaginated();

      expect(result).toEqual([mockDebt]);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: DebtApiEndpoints.GetAll,
        params: { limit: 10000 },
      });
    });

    it('should pass filters without page and limit', async () => {
      const filters = {
        status: 'ACTIVE' as const,
        branchId: 'branch-123',
      };

      mockApiClient.get.mockReturnValue(mockSuccess({ data: [mockDebt], meta: { total: 1, page: 1, limit: 10000, totalPages: 1 } }));

      await debtService.getAllUnpaginated(filters);

      verifyRequest(mockApiClient.get, {
        url: DebtApiEndpoints.GetAll,
        params: { ...filters, limit: 10000 },
      });
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [mockDebt], meta: { total: 1, page: 1, limit: 10000, totalPages: 1 } }));

      const result = debtService.getAllUnpaginated();

      const _typeCheck: Promise<Debt[]> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('getActiveDebts', () => {
    it('should get debts with ACTIVE status', async () => {
      const mockResponse: PaginatedResponse<Debt> = {
        data: [mockDebt],
        meta: { total: 1, page: 1, limit: 50, totalPages: 1 },
      };

      mockApiClient.get.mockReturnValue(mockSuccess(mockResponse));

      await debtService.getActiveDebts();

      verifyRequest(mockApiClient.get, {
        url: DebtApiEndpoints.GetAll,
        params: { status: 'ACTIVE' },
      });
    });

    it('should pass additional filters', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await debtService.getActiveDebts({ branchId: 'branch-123' });

      verifyRequest(mockApiClient.get, {
        url: DebtApiEndpoints.GetAll,
        params: { status: 'ACTIVE', branchId: 'branch-123' },
      });
    });
  });

  describe('getPaidDebts', () => {
    it('should get debts with PAID status', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await debtService.getPaidDebts();

      verifyRequest(mockApiClient.get, {
        url: DebtApiEndpoints.GetAll,
        params: { status: 'PAID' },
      });
    });
  });

  describe('getPartialDebts', () => {
    it('should get debts with PARTIAL status', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await debtService.getPartialDebts();

      verifyRequest(mockApiClient.get, {
        url: DebtApiEndpoints.GetAll,
        params: { status: 'PARTIAL' },
      });
    });
  });

  describe('getOverdueDebts', () => {
    it('should get debts with OVERDUE status', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await debtService.getOverdueDebts();

      verifyRequest(mockApiClient.get, {
        url: DebtApiEndpoints.GetAll,
        params: { status: 'OVERDUE' },
      });
    });
  });

  describe('getByDueDateRange', () => {
    it('should get debts by due date range', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await debtService.getByDueDateRange('2024-01-01', '2024-12-31');

      verifyRequest(mockApiClient.get, {
        url: DebtApiEndpoints.GetAll,
        params: {
          dueDateStart: '2024-01-01',
          dueDateEnd: '2024-12-31',
        },
      });
    });

    it('should pass additional filters', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await debtService.getByDueDateRange('2024-01-01', '2024-12-31', { branchId: 'branch-123' });

      verifyRequest(mockApiClient.get, {
        url: DebtApiEndpoints.GetAll,
        params: {
          dueDateStart: '2024-01-01',
          dueDateEnd: '2024-12-31',
          branchId: 'branch-123',
        },
      });
    });
  });

  describe('getDebtsDueSoon', () => {
    it('should get debts due within 7 days', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await debtService.getDebtsDueSoon();

      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      const call = mockApiClient.get.mock.calls[0][0];
      expect(call.params).toHaveProperty('dueDateStart');
      expect(call.params).toHaveProperty('dueDateEnd');
      expect(call.params.status).toBe('ACTIVE');
    });
  });

  describe('DebtApiEndpoints', () => {
    it('should have correct endpoint values', () => {
      expect(DebtApiEndpoints.GetAll).toBe('/debts');
      expect(DebtApiEndpoints.GetOne).toBe('/debts/:id');
      expect(DebtApiEndpoints.Create).toBe('/debts');
      expect(DebtApiEndpoints.Update).toBe('/debts/:id');
      expect(DebtApiEndpoints.Delete).toBe('/debts/:id');
      expect(DebtApiEndpoints.PayDebt).toBe('/debts/:id/payments');
      expect(DebtApiEndpoints.GetSummary).toBe('/debts/summary');
    });
  });

  describe('default export', () => {
    it('should export service object with all methods', () => {
      expect(debtService.default).toBeDefined();
      expect(debtService.default.getAll).toBe(debtService.getAll);
      expect(debtService.default.getAllUnpaginated).toBe(debtService.getAllUnpaginated);
      expect(debtService.default.getOne).toBe(debtService.getOne);
      expect(debtService.default.create).toBe(debtService.create);
      expect(debtService.default.update).toBe(debtService.update);
      expect(debtService.default.delete).toBe(debtService.deleteDebt);
      expect(debtService.default.payDebt).toBe(debtService.payDebt);
      expect(debtService.default.getSummary).toBe(debtService.getSummary);
      expect(debtService.default.getActiveDebts).toBe(debtService.getActiveDebts);
      expect(debtService.default.getPaidDebts).toBe(debtService.getPaidDebts);
      expect(debtService.default.getPartialDebts).toBe(debtService.getPartialDebts);
      expect(debtService.default.getOverdueDebts).toBe(debtService.getOverdueDebts);
      expect(debtService.default.getByDueDateRange).toBe(debtService.getByDueDateRange);
      expect(debtService.default.getDebtsDueSoon).toBe(debtService.getDebtsDueSoon);
    });
  });
});
