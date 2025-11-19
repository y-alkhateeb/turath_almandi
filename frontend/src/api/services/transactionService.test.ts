/**
 * Transaction Service Tests
 * Tests for transaction management API service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockApiClient, mockSuccess, mockError, verifyRequest, resetApiClientMocks } from '@/test/apiClientMock';
import type { Transaction, CreateTransactionInput, UpdateTransactionInput } from '#/entity';
import type { PaginatedResponse, TransactionQueryFilters, TransactionStatsResponse } from '#/api';

// Mock the apiClient module
vi.mock('../apiClient', () => ({
  default: mockApiClient,
}));

// Import after mocking
import * as transactionService from './transactionService';
import { TransactionApiEndpoints } from './transactionService';

describe('transactionService', () => {
  const mockTransaction: Transaction = {
    id: 'transaction-123',
    type: 'INCOME',
    amount: 1000,
    currency: 'USD',
    paymentMethod: 'CASH',
    category: 'Sales',
    date: '2024-01-01',
    employeeVendorName: 'John Doe',
    notes: 'Test transaction',
    branchId: 'branch-123',
    createdById: 'user-123',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    resetApiClientMocks();
  });

  describe('getAll', () => {
    const mockPaginatedResponse: PaginatedResponse<Transaction> = {
      data: [mockTransaction],
      meta: {
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      },
    };

    it('should get all transactions with default pagination', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      const result = await transactionService.getAll();

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: TransactionApiEndpoints.GetAll,
        params: undefined,
      });
    });

    it('should get transactions with filters', async () => {
      const filters: TransactionQueryFilters = {
        type: 'INCOME',
        category: 'Sales',
        paymentMethod: 'CASH',
        currency: 'USD',
        branchId: 'branch-123',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        search: 'John',
        page: 2,
        limit: 20,
      };

      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      await transactionService.getAll(filters);

      verifyRequest(mockApiClient.get, {
        url: TransactionApiEndpoints.GetAll,
        params: filters,
      });
    });

    it('should filter by type only', async () => {
      const filters: TransactionQueryFilters = {
        type: 'EXPENSE',
      };

      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      await transactionService.getAll(filters);

      verifyRequest(mockApiClient.get, {
        url: TransactionApiEndpoints.GetAll,
        params: filters,
      });
    });

    it('should filter by payment method', async () => {
      const filters: TransactionQueryFilters = {
        paymentMethod: 'MASTER',
      };

      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      await transactionService.getAll(filters);

      verifyRequest(mockApiClient.get, {
        url: TransactionApiEndpoints.GetAll,
        params: filters,
      });
    });

    it('should filter by date range', async () => {
      const filters: TransactionQueryFilters = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      await transactionService.getAll(filters);

      verifyRequest(mockApiClient.get, {
        url: TransactionApiEndpoints.GetAll,
        params: filters,
      });
    });

    it('should handle 401 error', async () => {
      mockApiClient.get.mockReturnValue(mockError(401, 'Not authenticated'));

      await expect(transactionService.getAll()).rejects.toThrow('Not authenticated');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      const result = transactionService.getAll();

      const _typeCheck: Promise<PaginatedResponse<Transaction>> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('getOne', () => {
    it('should get transaction by ID', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockTransaction));

      const result = await transactionService.getOne('transaction-123');

      expect(result).toEqual(mockTransaction);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: '/transactions/transaction-123',
      });
    });

    it('should handle 404 error', async () => {
      mockApiClient.get.mockReturnValue(mockError(404, 'Transaction not found'));

      await expect(transactionService.getOne('nonexistent')).rejects.toThrow('Transaction not found');
    });

    it('should handle 403 error for wrong branch', async () => {
      mockApiClient.get.mockReturnValue(mockError(403, 'Forbidden'));

      await expect(transactionService.getOne('transaction-123')).rejects.toThrow('Forbidden');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockTransaction));

      const result = transactionService.getOne('transaction-123');

      const _typeCheck: Promise<Transaction> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('create', () => {
    const createData: CreateTransactionInput = {
      type: 'INCOME',
      amount: 2000,
      currency: 'USD',
      paymentMethod: 'CASH',
      category: 'Sales',
      date: '2024-01-15',
      employeeVendorName: 'Jane Smith',
      notes: 'New transaction',
      branchId: 'branch-123',
    };

    it('should create transaction successfully', async () => {
      mockApiClient.post.mockReturnValue(mockSuccess(mockTransaction));

      const result = await transactionService.create(createData);

      expect(result).toEqual(mockTransaction);
      expect(mockApiClient.post).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.post, {
        url: TransactionApiEndpoints.Create,
        data: createData,
      });
    });

    it('should create income transaction', async () => {
      const incomeData: CreateTransactionInput = {
        ...createData,
        type: 'INCOME',
        paymentMethod: 'MASTER',
      };

      mockApiClient.post.mockReturnValue(mockSuccess({ ...mockTransaction, type: 'INCOME', paymentMethod: 'MASTER' }));

      const result = await transactionService.create(incomeData);

      expect(result.type).toBe('INCOME');
      expect(result.paymentMethod).toBe('MASTER');
    });

    it('should create expense transaction', async () => {
      const expenseData: CreateTransactionInput = {
        ...createData,
        type: 'EXPENSE',
        category: 'Salaries',
      };

      mockApiClient.post.mockReturnValue(mockSuccess({ ...mockTransaction, type: 'EXPENSE' }));

      const result = await transactionService.create(expenseData);

      expect(result.type).toBe('EXPENSE');
    });

    it('should create transaction with IQD currency', async () => {
      const iqdData: CreateTransactionInput = {
        ...createData,
        currency: 'IQD',
      };

      mockApiClient.post.mockReturnValue(mockSuccess({ ...mockTransaction, currency: 'IQD' }));

      const result = await transactionService.create(iqdData);

      expect(result.currency).toBe('IQD');
    });

    it('should create transaction without optional fields', async () => {
      const { notes, employeeVendorName, category, ...minimalData } = createData;

      mockApiClient.post.mockReturnValue(mockSuccess(mockTransaction));

      await transactionService.create(minimalData);

      verifyRequest(mockApiClient.post, {
        url: TransactionApiEndpoints.Create,
        data: minimalData,
      });
    });

    it('should handle 400 validation error', async () => {
      mockApiClient.post.mockReturnValue(mockError(400, 'Amount must be positive'));

      await expect(transactionService.create(createData)).rejects.toThrow('Amount must be positive');
    });

    it('should handle 401 error', async () => {
      mockApiClient.post.mockReturnValue(mockError(401, 'Not authenticated'));

      await expect(transactionService.create(createData)).rejects.toThrow('Not authenticated');
    });

    it('should handle 403 error', async () => {
      mockApiClient.post.mockReturnValue(mockError(403, 'Forbidden'));

      await expect(transactionService.create(createData)).rejects.toThrow('Forbidden');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.post.mockReturnValue(mockSuccess(mockTransaction));

      const result = transactionService.create(createData);

      const _typeCheck: Promise<Transaction> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('update', () => {
    const updateData: UpdateTransactionInput = {
      amount: 1500,
      category: 'Updated Category',
      notes: 'Updated notes',
    };

    it('should update transaction successfully', async () => {
      const updatedTransaction = { ...mockTransaction, ...updateData };
      mockApiClient.patch.mockReturnValue(mockSuccess(updatedTransaction));

      const result = await transactionService.update('transaction-123', updateData);

      expect(result).toEqual(updatedTransaction);
      expect(mockApiClient.patch).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.patch, {
        url: '/transactions/transaction-123',
        data: updateData,
      });
    });

    it('should update only amount', async () => {
      const amountUpdate = { amount: 2000 };
      mockApiClient.patch.mockReturnValue(mockSuccess(mockTransaction));

      await transactionService.update('transaction-123', amountUpdate);

      verifyRequest(mockApiClient.patch, {
        url: '/transactions/transaction-123',
        data: amountUpdate,
      });
    });

    it('should update payment method', async () => {
      const paymentUpdate = { paymentMethod: 'MASTER' as const };
      mockApiClient.patch.mockReturnValue(mockSuccess(mockTransaction));

      await transactionService.update('transaction-123', paymentUpdate);

      verifyRequest(mockApiClient.patch, {
        url: '/transactions/transaction-123',
        data: paymentUpdate,
      });
    });

    it('should update date', async () => {
      const dateUpdate = { date: '2024-02-01' };
      mockApiClient.patch.mockReturnValue(mockSuccess(mockTransaction));

      await transactionService.update('transaction-123', dateUpdate);

      verifyRequest(mockApiClient.patch, {
        url: '/transactions/transaction-123',
        data: dateUpdate,
      });
    });

    it('should handle 400 validation error', async () => {
      mockApiClient.patch.mockReturnValue(mockError(400, 'Invalid amount'));

      await expect(transactionService.update('transaction-123', updateData)).rejects.toThrow('Invalid amount');
    });

    it('should handle 404 error', async () => {
      mockApiClient.patch.mockReturnValue(mockError(404, 'Transaction not found'));

      await expect(transactionService.update('nonexistent', updateData)).rejects.toThrow('Transaction not found');
    });

    it('should handle 403 error for wrong branch', async () => {
      mockApiClient.patch.mockReturnValue(mockError(403, 'Forbidden'));

      await expect(transactionService.update('transaction-123', updateData)).rejects.toThrow('Forbidden');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.patch.mockReturnValue(mockSuccess(mockTransaction));

      const result = transactionService.update('transaction-123', updateData);

      const _typeCheck: Promise<Transaction> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('deleteTransaction', () => {
    it('should delete transaction successfully', async () => {
      mockApiClient.delete.mockReturnValue(mockSuccess(undefined));

      await transactionService.deleteTransaction('transaction-123');

      expect(mockApiClient.delete).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.delete, {
        url: '/transactions/transaction-123',
      });
    });

    it('should handle 404 error', async () => {
      mockApiClient.delete.mockReturnValue(mockError(404, 'Transaction not found'));

      await expect(transactionService.deleteTransaction('nonexistent')).rejects.toThrow('Transaction not found');
    });

    it('should handle 403 error for wrong branch', async () => {
      mockApiClient.delete.mockReturnValue(mockError(403, 'Forbidden'));

      await expect(transactionService.deleteTransaction('transaction-123')).rejects.toThrow('Forbidden');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.delete.mockReturnValue(mockSuccess(undefined));

      const result = transactionService.deleteTransaction('transaction-123');

      const _typeCheck: Promise<void> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('getSummary', () => {
    const mockStats: TransactionStatsResponse = {
      totalIncome: 10000,
      totalExpenses: 6000,
      netProfit: 4000,
      transactionCount: 25,
      incomeByPaymentMethod: {
        CASH: 5000,
        MASTER: 5000,
      },
      expensesByCategory: {
        Salaries: 4000,
        Utilities: 2000,
      },
    };

    it('should get transaction summary without filters', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockStats));

      const result = await transactionService.getSummary();

      expect(result).toEqual(mockStats);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: TransactionApiEndpoints.GetSummary,
        params: undefined,
      });
    });

    it('should get transaction summary with filters', async () => {
      const filters: TransactionQueryFilters = {
        branchId: 'branch-123',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        type: 'INCOME',
      };

      mockApiClient.get.mockReturnValue(mockSuccess(mockStats));

      await transactionService.getSummary(filters);

      verifyRequest(mockApiClient.get, {
        url: TransactionApiEndpoints.GetSummary,
        params: filters,
      });
    });

    it('should handle 401 error', async () => {
      mockApiClient.get.mockReturnValue(mockError(401, 'Not authenticated'));

      await expect(transactionService.getSummary()).rejects.toThrow('Not authenticated');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockStats));

      const result = transactionService.getSummary();

      const _typeCheck: Promise<TransactionStatsResponse> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('getAllUnpaginated', () => {
    it('should extract data array from paginated response', async () => {
      const mockResponse: PaginatedResponse<Transaction> = {
        data: [mockTransaction],
        meta: {
          total: 1,
          page: 1,
          limit: 10000,
          totalPages: 1,
        },
      };

      mockApiClient.get.mockReturnValue(mockSuccess(mockResponse));

      const result = await transactionService.getAllUnpaginated();

      expect(result).toEqual([mockTransaction]);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: TransactionApiEndpoints.GetAll,
        params: { limit: 10000 },
      });
    });

    it('should pass filters without page and limit', async () => {
      const filters = {
        type: 'INCOME' as const,
        branchId: 'branch-123',
      };

      mockApiClient.get.mockReturnValue(mockSuccess({ data: [mockTransaction], meta: { total: 1, page: 1, limit: 10000, totalPages: 1 } }));

      await transactionService.getAllUnpaginated(filters);

      verifyRequest(mockApiClient.get, {
        url: TransactionApiEndpoints.GetAll,
        params: { ...filters, limit: 10000 },
      });
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [mockTransaction], meta: { total: 1, page: 1, limit: 10000, totalPages: 1 } }));

      const result = transactionService.getAllUnpaginated();

      const _typeCheck: Promise<Transaction[]> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('getTodayTransactions', () => {
    it('should get transactions for today', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [mockTransaction], meta: { total: 1, page: 1, limit: 50, totalPages: 1 } }));

      await transactionService.getTodayTransactions();

      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      const call = mockApiClient.get.mock.calls[0][0];
      expect(call.params).toHaveProperty('startDate');
      expect(call.params).toHaveProperty('endDate');
      expect(call.params.startDate).toBe(call.params.endDate);
    });
  });

  describe('getByDateRange', () => {
    it('should get transactions by date range', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await transactionService.getByDateRange('2024-01-01', '2024-12-31');

      verifyRequest(mockApiClient.get, {
        url: TransactionApiEndpoints.GetAll,
        params: {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
      });
    });

    it('should pass additional filters', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await transactionService.getByDateRange('2024-01-01', '2024-12-31', {
        branchId: 'branch-123',
        type: 'INCOME',
      });

      verifyRequest(mockApiClient.get, {
        url: TransactionApiEndpoints.GetAll,
        params: {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          branchId: 'branch-123',
          type: 'INCOME',
        },
      });
    });
  });

  describe('getIncome', () => {
    it('should get transactions with INCOME type', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [mockTransaction], meta: { total: 1, page: 1, limit: 50, totalPages: 1 } }));

      await transactionService.getIncome();

      verifyRequest(mockApiClient.get, {
        url: TransactionApiEndpoints.GetAll,
        params: { type: 'INCOME' },
      });
    });

    it('should pass additional filters', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await transactionService.getIncome({ branchId: 'branch-123' });

      verifyRequest(mockApiClient.get, {
        url: TransactionApiEndpoints.GetAll,
        params: { type: 'INCOME', branchId: 'branch-123' },
      });
    });
  });

  describe('getExpenses', () => {
    it('should get transactions with EXPENSE type', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await transactionService.getExpenses();

      verifyRequest(mockApiClient.get, {
        url: TransactionApiEndpoints.GetAll,
        params: { type: 'EXPENSE' },
      });
    });

    it('should pass additional filters', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await transactionService.getExpenses({ category: 'Salaries' });

      verifyRequest(mockApiClient.get, {
        url: TransactionApiEndpoints.GetAll,
        params: { type: 'EXPENSE', category: 'Salaries' },
      });
    });
  });

  describe('TransactionApiEndpoints', () => {
    it('should have correct endpoint values', () => {
      expect(TransactionApiEndpoints.GetAll).toBe('/transactions');
      expect(TransactionApiEndpoints.GetOne).toBe('/transactions/:id');
      expect(TransactionApiEndpoints.Create).toBe('/transactions');
      expect(TransactionApiEndpoints.Update).toBe('/transactions/:id');
      expect(TransactionApiEndpoints.Delete).toBe('/transactions/:id');
      expect(TransactionApiEndpoints.GetSummary).toBe('/transactions/summary');
    });
  });

  describe('default export', () => {
    it('should export service object with all methods', () => {
      expect(transactionService.default).toBeDefined();
      expect(transactionService.default.getAll).toBe(transactionService.getAll);
      expect(transactionService.default.getAllUnpaginated).toBe(transactionService.getAllUnpaginated);
      expect(transactionService.default.getOne).toBe(transactionService.getOne);
      expect(transactionService.default.create).toBe(transactionService.create);
      expect(transactionService.default.update).toBe(transactionService.update);
      expect(transactionService.default.delete).toBe(transactionService.deleteTransaction);
      expect(transactionService.default.getSummary).toBe(transactionService.getSummary);
      expect(transactionService.default.getTodayTransactions).toBe(transactionService.getTodayTransactions);
      expect(transactionService.default.getByDateRange).toBe(transactionService.getByDateRange);
      expect(transactionService.default.getIncome).toBe(transactionService.getIncome);
      expect(transactionService.default.getExpenses).toBe(transactionService.getExpenses);
    });
  });
});
