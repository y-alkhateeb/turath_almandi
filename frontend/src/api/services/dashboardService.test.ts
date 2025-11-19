/**
 * Dashboard Service Tests
 * Tests for dashboard statistics and charts API service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockApiClient, mockSuccess, mockError, verifyRequest, resetApiClientMocks } from '@/test/apiClientMock';
import type { Transaction } from '#/entity';
import type {
  DashboardStats,
  RevenueDataPoint,
  CategoryDataPoint,
  BranchPerformance,
  DashboardQueryFilters,
} from '#/api';

// Mock the apiClient module
vi.mock('../apiClient', () => ({
  default: mockApiClient,
}));

// Import after mocking
import * as dashboardService from './dashboardService';
import { DashboardApiEndpoints } from './dashboardService';

describe('dashboardService', () => {
  beforeEach(() => {
    resetApiClientMocks();
  });

  describe('getStats', () => {
    const mockStats: DashboardStats = {
      totalRevenue: 50000,
      totalExpenses: 30000,
      netProfit: 20000,
      todayTransactions: 25,
      cashRevenue: 30000,
      masterCardRevenue: 20000,
      totalDebts: 10000,
      activeDebtsCount: 5,
      totalInventoryValue: 100000,
    };

    it('should get dashboard stats without filters', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockStats));

      const result = await dashboardService.getStats();

      expect(result).toEqual(mockStats);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: DashboardApiEndpoints.GetStats,
        params: undefined,
      });
    });

    it('should get stats for specific branch and date', async () => {
      const filters = { branchId: 'branch-123', date: '2024-01-01' };
      mockApiClient.get.mockReturnValue(mockSuccess(mockStats));

      await dashboardService.getStats(filters);

      verifyRequest(mockApiClient.get, {
        url: DashboardApiEndpoints.GetStats,
        params: filters,
      });
    });

    it('should handle 401 error', async () => {
      mockApiClient.get.mockReturnValue(mockError(401, 'Not authenticated'));

      await expect(dashboardService.getStats()).rejects.toThrow('Not authenticated');
    });
  });

  describe('getRevenueData', () => {
    const mockRevenueData: RevenueDataPoint[] = [
      { date: '2024-01-01', revenue: 5000, expenses: 3000, netProfit: 2000 },
      { date: '2024-01-02', revenue: 6000, expenses: 3500, netProfit: 2500 },
    ];

    it('should get revenue data without filters', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockRevenueData));

      const result = await dashboardService.getRevenueData();

      expect(result).toEqual(mockRevenueData);
      verifyRequest(mockApiClient.get, {
        url: DashboardApiEndpoints.GetRevenueData,
        params: undefined,
      });
    });

    it('should get revenue data with date range', async () => {
      const filters = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        branchId: 'branch-123',
      };
      mockApiClient.get.mockReturnValue(mockSuccess(mockRevenueData));

      await dashboardService.getRevenueData(filters);

      verifyRequest(mockApiClient.get, {
        url: DashboardApiEndpoints.GetRevenueData,
        params: filters,
      });
    });
  });

  describe('getCategoryData', () => {
    const mockCategoryData: CategoryDataPoint[] = [
      { category: 'Food', value: 5000, count: 10, color: '#FF0000' },
      { category: 'Transport', value: 3000, count: 8, color: '#00FF00' },
    ];

    it('should get category data', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockCategoryData));

      const result = await dashboardService.getCategoryData();

      expect(result).toEqual(mockCategoryData);
      verifyRequest(mockApiClient.get, {
        url: DashboardApiEndpoints.GetCategoryData,
        params: undefined,
      });
    });
  });

  describe('getRecentTransactions', () => {
    const mockTransactions: Transaction[] = [
      {
        id: 'tx-1',
        date: '2024-01-01',
        type: 'INCOME',
        category: 'Sales',
        amount: 1000,
        paymentMethod: 'CASH',
        description: 'Sale',
        branchId: 'branch-123',
        createdById: 'user-123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    it('should get recent transactions', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockTransactions));

      const result = await dashboardService.getRecentTransactions();

      expect(result).toEqual(mockTransactions);
      verifyRequest(mockApiClient.get, {
        url: DashboardApiEndpoints.GetRecentTransactions,
        params: undefined,
      });
    });

    it('should get recent transactions with limit', async () => {
      const filters = { limit: 5, branchId: 'branch-123' };
      mockApiClient.get.mockReturnValue(mockSuccess(mockTransactions));

      await dashboardService.getRecentTransactions(filters);

      verifyRequest(mockApiClient.get, {
        url: DashboardApiEndpoints.GetRecentTransactions,
        params: filters,
      });
    });
  });

  describe('getBranchComparison', () => {
    const mockBranchPerformance: BranchPerformance[] = [
      {
        branchId: 'branch-1',
        branchName: 'Main Branch',
        totalRevenue: 50000,
        totalExpenses: 30000,
        netProfit: 20000,
        transactionCount: 100,
        averageTransactionValue: 500,
        topCategory: 'Sales',
      },
    ];

    it('should get branch comparison', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockBranchPerformance));

      const result = await dashboardService.getBranchComparison();

      expect(result).toEqual(mockBranchPerformance);
      verifyRequest(mockApiClient.get, {
        url: DashboardApiEndpoints.GetBranchComparison,
        params: undefined,
      });
    });

    it('should handle 403 error for non-admin', async () => {
      mockApiClient.get.mockReturnValue(mockError(403, 'Forbidden'));

      await expect(dashboardService.getBranchComparison()).rejects.toThrow('Forbidden');
    });
  });

  describe('getTodayStats', () => {
    it('should get today stats with correct date', async () => {
      const mockStats: DashboardStats = {
        totalRevenue: 5000,
        totalExpenses: 3000,
        netProfit: 2000,
        todayTransactions: 10,
        cashRevenue: 3000,
        masterCardRevenue: 2000,
        totalDebts: 1000,
        activeDebtsCount: 2,
        totalInventoryValue: 10000,
      };

      mockApiClient.get.mockReturnValue(mockSuccess(mockStats));

      const result = await dashboardService.getTodayStats();

      expect(result).toEqual(mockStats);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);

      const callParams = mockApiClient.get.mock.calls[0][0].params;
      expect(callParams.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should get today stats for specific branch', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({} as DashboardStats));

      await dashboardService.getTodayStats('branch-123');

      const callParams = mockApiClient.get.mock.calls[0][0].params;
      expect(callParams.branchId).toBe('branch-123');
    });
  });

  describe('getCurrentMonthRevenue', () => {
    it('should get current month revenue with correct dates', async () => {
      const mockData: RevenueDataPoint[] = [];
      mockApiClient.get.mockReturnValue(mockSuccess(mockData));

      await dashboardService.getCurrentMonthRevenue();

      const callParams = mockApiClient.get.mock.calls[0][0].params;
      expect(callParams.startDate).toMatch(/^\d{4}-\d{2}-01$/);
      expect(callParams.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getLastNDaysRevenue', () => {
    it('should get last 7 days revenue by default', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess([]));

      await dashboardService.getLastNDaysRevenue();

      const callParams = mockApiClient.get.mock.calls[0][0].params;
      expect(callParams.startDate).toBeDefined();
      expect(callParams.endDate).toBeDefined();
    });

    it('should get last N days revenue with custom days', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess([]));

      await dashboardService.getLastNDaysRevenue(30);

      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should include branchId when provided', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess([]));

      await dashboardService.getLastNDaysRevenue(7, 'branch-123');

      const callParams = mockApiClient.get.mock.calls[0][0].params;
      expect(callParams.branchId).toBe('branch-123');
    });
  });

  describe('getCurrentMonthCategories', () => {
    it('should get current month categories', async () => {
      const mockData: CategoryDataPoint[] = [];
      mockApiClient.get.mockReturnValue(mockSuccess(mockData));

      await dashboardService.getCurrentMonthCategories();

      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTopRecentTransactions', () => {
    it('should get top 5 transactions by default', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess([]));

      await dashboardService.getTopRecentTransactions();

      const callParams = mockApiClient.get.mock.calls[0][0].params;
      expect(callParams.limit).toBe(5);
    });

    it('should get custom number of transactions', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess([]));

      await dashboardService.getTopRecentTransactions(10);

      const callParams = mockApiClient.get.mock.calls[0][0].params;
      expect(callParams.limit).toBe(10);
    });
  });

  describe('getCurrentMonthBranchComparison', () => {
    it('should get current month branch comparison', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess([]));

      await dashboardService.getCurrentMonthBranchComparison();

      const callParams = mockApiClient.get.mock.calls[0][0].params;
      expect(callParams.startDate).toMatch(/^\d{4}-\d{2}-01$/);
      expect(callParams.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('DashboardApiEndpoints', () => {
    it('should have correct endpoint values', () => {
      expect(DashboardApiEndpoints.GetStats).toBe('/dashboard/stats');
      expect(DashboardApiEndpoints.GetRevenueData).toBe('/dashboard/revenue-data');
      expect(DashboardApiEndpoints.GetCategoryData).toBe('/dashboard/category-data');
      expect(DashboardApiEndpoints.GetRecentTransactions).toBe('/dashboard/recent-transactions');
      expect(DashboardApiEndpoints.GetBranchComparison).toBe('/dashboard/branch-comparison');
    });
  });

  describe('default export', () => {
    it('should export service object with all methods', () => {
      expect(dashboardService.default).toBeDefined();
      expect(dashboardService.default.getStats).toBe(dashboardService.getStats);
      expect(dashboardService.default.getRevenueData).toBe(dashboardService.getRevenueData);
      expect(dashboardService.default.getCategoryData).toBe(dashboardService.getCategoryData);
      expect(dashboardService.default.getRecentTransactions).toBe(dashboardService.getRecentTransactions);
      expect(dashboardService.default.getBranchComparison).toBe(dashboardService.getBranchComparison);
    });
  });
});
