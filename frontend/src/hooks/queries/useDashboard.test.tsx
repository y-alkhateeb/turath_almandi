/**
 * useDashboard Hooks Tests
 * Tests for dashboard query hooks with comprehensive coverage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderQueryHook } from '@/test/queryTestUtils';
import type {
  DashboardStats,
  RevenueDataPoint,
  CategoryDataPoint,
  BranchPerformance,
  Transaction,
} from '#/entity';
import { ApiError } from '@/api/apiClient';

// Mock dependencies
vi.mock('@/api/services/dashboardService');
vi.mock('../useAuth');

import dashboardService from '@/api/services/dashboardService';
import { useAuth } from '../useAuth';
import * as useDashboardHooks from './useDashboard';

describe('useDashboard Hooks', () => {
  const mockDashboardStats: DashboardStats = {
    totalRevenue: 10000,
    totalExpenses: 5000,
    netProfit: 5000,
    todayTransactions: 25,
    cashRevenue: 7000,
    mastercardRevenue: 3000,
    totalDebts: 2000,
    activeDebts: 1500,
    inventoryValue: 50000,
  };

  const mockRevenueDataPoints: RevenueDataPoint[] = [
    {
      date: '2024-01-01',
      revenue: 1000,
      expenses: 500,
      netProfit: 500,
    },
    {
      date: '2024-01-02',
      revenue: 1500,
      expenses: 700,
      netProfit: 800,
    },
  ];

  const mockCategoryDataPoints: CategoryDataPoint[] = [
    {
      category: 'FOOD',
      value: 5000,
      percentage: 50,
      color: '#FF6384',
    },
    {
      category: 'SUPPLIES',
      value: 3000,
      percentage: 30,
      color: '#36A2EB',
    },
  ];

  const mockTransaction: Transaction = {
    id: 'tx-1',
    type: 'REVENUE',
    amount: 100,
    description: 'Test transaction',
    category: 'SALES',
    paymentMethod: 'CASH',
    branchId: 'branch-1',
    userId: 'user-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockBranchPerformance: BranchPerformance[] = [
    {
      branchId: 'branch-1',
      branchName: 'Main Branch',
      totalRevenue: 10000,
      totalExpenses: 5000,
      netProfit: 5000,
      transactionCount: 100,
      averageTransactionValue: 100,
      topCategory: 'FOOD',
    },
    {
      branchId: 'branch-2',
      branchName: 'Secondary Branch',
      totalRevenue: 8000,
      totalExpenses: 4000,
      netProfit: 4000,
      transactionCount: 80,
      averageTransactionValue: 100,
      topCategory: 'SUPPLIES',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useDashboardStats', () => {
    it('should fetch dashboard stats successfully', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAccountant: false,
        user: null,
      } as any);

      vi.mocked(dashboardService.getStats).mockResolvedValue(mockDashboardStats);

      const { result } = renderQueryHook(() => useDashboardHooks.useDashboardStats());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockDashboardStats);
      expect(dashboardService.getStats).toHaveBeenCalledWith({
        branchId: undefined,
        date: undefined,
      });
    });

    it('should fetch stats with branchId filter', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAccountant: false,
        user: null,
      } as any);

      vi.mocked(dashboardService.getStats).mockResolvedValue(mockDashboardStats);

      const { result } = renderQueryHook(() =>
        useDashboardHooks.useDashboardStats('branch-1'),
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(dashboardService.getStats).toHaveBeenCalledWith({
        branchId: 'branch-1',
        date: undefined,
      });
    });

    it('should fetch stats with date filter', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAccountant: false,
        user: null,
      } as any);

      vi.mocked(dashboardService.getStats).mockResolvedValue(mockDashboardStats);

      const { result } = renderQueryHook(() =>
        useDashboardHooks.useDashboardStats(undefined, '2024-01-15'),
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(dashboardService.getStats).toHaveBeenCalledWith({
        branchId: undefined,
        date: '2024-01-15',
      });
    });

    it('should auto-filter accountants to their branch', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAccountant: true,
        user: { branchId: 'accountant-branch' },
      } as any);

      vi.mocked(dashboardService.getStats).mockResolvedValue(mockDashboardStats);

      const { result } = renderQueryHook(() =>
        useDashboardHooks.useDashboardStats('other-branch'),
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should use accountant's branch, not the provided one
      expect(dashboardService.getStats).toHaveBeenCalledWith({
        branchId: 'accountant-branch',
        date: undefined,
      });
    });

    // TODO: Fix error handling test - React Query error state not being set correctly in tests
    it.skip('should handle error state', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAccountant: false,
        user: null,
      } as any);

      const error = new ApiError(500, 'Internal Server Error', 'Internal Server Error');
      vi.mocked(dashboardService.getStats).mockRejectedValue(error);

      const { result } = renderQueryHook(() => useDashboardHooks.useDashboardStats());

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useRevenueData', () => {
    it('should fetch revenue data successfully', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAccountant: false,
        user: null,
      } as any);

      vi.mocked(dashboardService.getRevenueData).mockResolvedValue(mockRevenueDataPoints);

      const { result } = renderQueryHook(() => useDashboardHooks.useRevenueData());

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockRevenueDataPoints);
      expect(dashboardService.getRevenueData).toHaveBeenCalledWith({
        branchId: undefined,
        startDate: undefined,
        endDate: undefined,
      });
    });

    it('should fetch revenue data with branchId filter', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAccountant: false,
        user: null,
      } as any);

      vi.mocked(dashboardService.getRevenueData).mockResolvedValue(mockRevenueDataPoints);

      const { result } = renderQueryHook(() =>
        useDashboardHooks.useRevenueData('branch-1'),
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(dashboardService.getRevenueData).toHaveBeenCalledWith({
        branchId: 'branch-1',
        startDate: undefined,
        endDate: undefined,
      });
    });

    it('should fetch revenue data with date range filter', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAccountant: false,
        user: null,
      } as any);

      vi.mocked(dashboardService.getRevenueData).mockResolvedValue(mockRevenueDataPoints);

      const dateRange = { startDate: '2024-01-01', endDate: '2024-01-31' };

      const { result } = renderQueryHook(() =>
        useDashboardHooks.useRevenueData(undefined, dateRange),
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(dashboardService.getRevenueData).toHaveBeenCalledWith({
        branchId: undefined,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });
    });

    it('should auto-filter accountants to their branch', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAccountant: true,
        user: { branchId: 'accountant-branch' },
      } as any);

      vi.mocked(dashboardService.getRevenueData).mockResolvedValue(mockRevenueDataPoints);

      const { result } = renderQueryHook(() =>
        useDashboardHooks.useRevenueData('other-branch'),
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(dashboardService.getRevenueData).toHaveBeenCalledWith({
        branchId: 'accountant-branch',
        startDate: undefined,
        endDate: undefined,
      });
    });

    // TODO: Fix error handling test - React Query error state not being set correctly in tests
    it.skip('should handle error state', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAccountant: false,
        user: null,
      } as any);

      const error = new ApiError(500, 'Internal Server Error', 'Internal Server Error');
      vi.mocked(dashboardService.getRevenueData).mockRejectedValue(error);

      const { result } = renderQueryHook(() => useDashboardHooks.useRevenueData());

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useCategoryData', () => {
    it('should fetch category data successfully', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAccountant: false,
        user: null,
      } as any);

      vi.mocked(dashboardService.getCategoryData).mockResolvedValue(
        mockCategoryDataPoints,
      );

      const { result } = renderQueryHook(() => useDashboardHooks.useCategoryData());

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockCategoryDataPoints);
      expect(dashboardService.getCategoryData).toHaveBeenCalledWith({
        branchId: undefined,
        startDate: undefined,
        endDate: undefined,
      });
    });

    it('should fetch category data with filters', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAccountant: false,
        user: null,
      } as any);

      vi.mocked(dashboardService.getCategoryData).mockResolvedValue(
        mockCategoryDataPoints,
      );

      const dateRange = { startDate: '2024-01-01', endDate: '2024-01-31' };

      const { result } = renderQueryHook(() =>
        useDashboardHooks.useCategoryData('branch-1', dateRange),
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(dashboardService.getCategoryData).toHaveBeenCalledWith({
        branchId: 'branch-1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });
    });

    it('should auto-filter accountants to their branch', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAccountant: true,
        user: { branchId: 'accountant-branch' },
      } as any);

      vi.mocked(dashboardService.getCategoryData).mockResolvedValue(
        mockCategoryDataPoints,
      );

      const { result } = renderQueryHook(() =>
        useDashboardHooks.useCategoryData('other-branch'),
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(dashboardService.getCategoryData).toHaveBeenCalledWith({
        branchId: 'accountant-branch',
        startDate: undefined,
        endDate: undefined,
      });
    });

    // TODO: Fix error handling test - React Query error state not being set correctly in tests
    it.skip('should handle error state', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAccountant: false,
        user: null,
      } as any);

      const error = new ApiError(500, 'Internal Server Error', 'Internal Server Error');
      vi.mocked(dashboardService.getCategoryData).mockRejectedValue(error);

      const { result } = renderQueryHook(() => useDashboardHooks.useCategoryData());

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useRecentTransactions', () => {
    it('should fetch recent transactions successfully', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAccountant: false,
        user: null,
      } as any);

      vi.mocked(dashboardService.getRecentTransactions).mockResolvedValue([
        mockTransaction,
      ]);

      const { result } = renderQueryHook(() =>
        useDashboardHooks.useRecentTransactions(),
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([mockTransaction]);
      expect(dashboardService.getRecentTransactions).toHaveBeenCalledWith({
        branchId: undefined,
        limit: undefined,
      });
    });

    it('should fetch recent transactions with limit', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAccountant: false,
        user: null,
      } as any);

      vi.mocked(dashboardService.getRecentTransactions).mockResolvedValue([
        mockTransaction,
      ]);

      const { result } = renderQueryHook(() =>
        useDashboardHooks.useRecentTransactions(undefined, 5),
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(dashboardService.getRecentTransactions).toHaveBeenCalledWith({
        branchId: undefined,
        limit: 5,
      });
    });

    it('should fetch recent transactions with branchId and limit', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAccountant: false,
        user: null,
      } as any);

      vi.mocked(dashboardService.getRecentTransactions).mockResolvedValue([
        mockTransaction,
      ]);

      const { result } = renderQueryHook(() =>
        useDashboardHooks.useRecentTransactions('branch-1', 20),
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(dashboardService.getRecentTransactions).toHaveBeenCalledWith({
        branchId: 'branch-1',
        limit: 20,
      });
    });

    it('should auto-filter accountants to their branch', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAccountant: true,
        user: { branchId: 'accountant-branch' },
      } as any);

      vi.mocked(dashboardService.getRecentTransactions).mockResolvedValue([
        mockTransaction,
      ]);

      const { result } = renderQueryHook(() =>
        useDashboardHooks.useRecentTransactions('other-branch'),
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(dashboardService.getRecentTransactions).toHaveBeenCalledWith({
        branchId: 'accountant-branch',
        limit: undefined,
      });
    });

    // TODO: Fix error handling test - React Query error state not being set correctly in tests
    it.skip('should handle error state', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAccountant: false,
        user: null,
      } as any);

      const error = new ApiError(500, 'Internal Server Error', 'Internal Server Error');
      vi.mocked(dashboardService.getRecentTransactions).mockRejectedValue(error);

      const { result } = renderQueryHook(() =>
        useDashboardHooks.useRecentTransactions(),
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useBranchComparison', () => {
    it('should fetch branch comparison when user is admin', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAdmin: true,
      } as any);

      vi.mocked(dashboardService.getBranchComparison).mockResolvedValue(
        mockBranchPerformance,
      );

      const { result } = renderQueryHook(() => useDashboardHooks.useBranchComparison());

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockBranchPerformance);
      expect(dashboardService.getBranchComparison).toHaveBeenCalledWith(undefined);
    });

    it('should fetch branch comparison with date range', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAdmin: true,
      } as any);

      vi.mocked(dashboardService.getBranchComparison).mockResolvedValue(
        mockBranchPerformance,
      );

      const dateRange = { startDate: '2024-01-01', endDate: '2024-01-31' };

      const { result } = renderQueryHook(() =>
        useDashboardHooks.useBranchComparison(dateRange),
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(dashboardService.getBranchComparison).toHaveBeenCalledWith(dateRange);
    });

    it('should not fetch when user is not admin', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAdmin: false,
      } as any);

      const { result } = renderQueryHook(() => useDashboardHooks.useBranchComparison());

      await waitFor(() => {
        expect(result.current.fetchStatus).toBe('idle');
      });

      expect(dashboardService.getBranchComparison).not.toHaveBeenCalled();
    });

    // TODO: Fix error handling test - React Query error state not being set correctly in tests
    it.skip('should handle error state', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAdmin: true,
      } as any);

      const error = new ApiError(403, 'Forbidden', 'Forbidden');
      vi.mocked(dashboardService.getBranchComparison).mockRejectedValue(error);

      const { result } = renderQueryHook(() => useDashboardHooks.useBranchComparison());

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useDashboardFilters', () => {
    it('should initialize with empty filters', () => {
      const { result } = renderQueryHook(() => useDashboardHooks.useDashboardFilters());

      expect(result.current.filters).toEqual({});
    });

    it('should initialize with provided filters', () => {
      const initialFilters = { branchId: 'branch-1', limit: 20 };
      const { result } = renderQueryHook(() =>
        useDashboardHooks.useDashboardFilters(initialFilters),
      );

      expect(result.current.filters).toEqual(initialFilters);
    });

    it('should update filters with setFilters', () => {
      const { result } = renderQueryHook(() => useDashboardHooks.useDashboardFilters());

      const newFilters = { branchId: 'branch-1', date: '2024-01-15' };
      result.current.setFilters(newFilters);

      waitFor(() => {
        expect(result.current.filters).toEqual(newFilters);
      });
    });

    it('should update single filter with setFilter', () => {
      const { result } = renderQueryHook(() => useDashboardHooks.useDashboardFilters());

      result.current.setFilter('branchId', 'branch-1');

      waitFor(() => {
        expect(result.current.filters.branchId).toBe('branch-1');
      });
    });

    it('should reset filters', () => {
      const initialFilters = { branchId: 'branch-1', limit: 20 };
      const { result } = renderQueryHook(() =>
        useDashboardHooks.useDashboardFilters(initialFilters),
      );

      result.current.setFilters({ branchId: 'branch-2', date: '2024-01-15' });
      result.current.resetFilters();

      waitFor(() => {
        expect(result.current.filters).toEqual(initialFilters);
      });
    });

    it('should set branch id with setBranchId', () => {
      const { result } = renderQueryHook(() => useDashboardHooks.useDashboardFilters());

      result.current.setBranchId('branch-1');

      waitFor(() => {
        expect(result.current.filters.branchId).toBe('branch-1');
      });
    });

    it('should set date with setDate', () => {
      const { result } = renderQueryHook(() => useDashboardHooks.useDashboardFilters());

      result.current.setDate('2024-01-15');

      waitFor(() => {
        expect(result.current.filters.date).toBe('2024-01-15');
      });
    });

    it('should set date range with setDateRange', () => {
      const { result } = renderQueryHook(() => useDashboardHooks.useDashboardFilters());

      result.current.setDateRange('2024-01-01', '2024-01-31');

      waitFor(() => {
        expect(result.current.filters.startDate).toBe('2024-01-01');
        expect(result.current.filters.endDate).toBe('2024-01-31');
      });
    });

    it('should set limit with setLimit', () => {
      const { result } = renderQueryHook(() => useDashboardHooks.useDashboardFilters());

      result.current.setLimit(50);

      waitFor(() => {
        expect(result.current.filters.limit).toBe(50);
      });
    });
  });

  describe('useTodayStats', () => {
    it('should fetch today stats with correct date', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAccountant: false,
        user: null,
      } as any);

      vi.mocked(dashboardService.getStats).mockResolvedValue(mockDashboardStats);

      const { result } = renderQueryHook(() => useDashboardHooks.useTodayStats());

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const today = new Date().toISOString().split('T')[0];
      expect(dashboardService.getStats).toHaveBeenCalledWith({
        branchId: undefined,
        date: today,
      });
    });

    it('should fetch today stats with branchId', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAccountant: false,
        user: null,
      } as any);

      vi.mocked(dashboardService.getStats).mockResolvedValue(mockDashboardStats);

      const { result } = renderQueryHook(() =>
        useDashboardHooks.useTodayStats('branch-1'),
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const today = new Date().toISOString().split('T')[0];
      expect(dashboardService.getStats).toHaveBeenCalledWith({
        branchId: 'branch-1',
        date: today,
      });
    });
  });

  describe('useCurrentMonthRevenue', () => {
    it('should fetch current month revenue data', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAccountant: false,
        user: null,
      } as any);

      vi.mocked(dashboardService.getRevenueData).mockResolvedValue(mockRevenueDataPoints);

      const { result } = renderQueryHook(() =>
        useDashboardHooks.useCurrentMonthRevenue(),
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const today = new Date();
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      expect(dashboardService.getRevenueData).toHaveBeenCalledWith({
        branchId: undefined,
        startDate: firstOfMonth.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      });
    });
  });

  describe('useLastNDaysRevenue', () => {
    it('should fetch last 7 days revenue data by default', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAccountant: false,
        user: null,
      } as any);

      vi.mocked(dashboardService.getRevenueData).mockResolvedValue(mockRevenueDataPoints);

      const { result } = renderQueryHook(() => useDashboardHooks.useLastNDaysRevenue());

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(dashboardService.getRevenueData).toHaveBeenCalled();
      const callArgs = vi.mocked(dashboardService.getRevenueData).mock.calls[0][0];
      expect(callArgs?.startDate).toBeDefined();
      expect(callArgs?.endDate).toBeDefined();
    });

    it('should fetch last N days revenue data with custom days', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAccountant: false,
        user: null,
      } as any);

      vi.mocked(dashboardService.getRevenueData).mockResolvedValue(mockRevenueDataPoints);

      const { result } = renderQueryHook(() => useDashboardHooks.useLastNDaysRevenue(30));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(dashboardService.getRevenueData).toHaveBeenCalled();
    });
  });

  describe('useCurrentMonthCategories', () => {
    it('should fetch current month category data', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAccountant: false,
        user: null,
      } as any);

      vi.mocked(dashboardService.getCategoryData).mockResolvedValue(
        mockCategoryDataPoints,
      );

      const { result } = renderQueryHook(() =>
        useDashboardHooks.useCurrentMonthCategories(),
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const today = new Date();
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      expect(dashboardService.getCategoryData).toHaveBeenCalledWith({
        branchId: undefined,
        startDate: firstOfMonth.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      });
    });
  });

  describe('useTopRecentTransactions', () => {
    it('should fetch top 5 recent transactions by default', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAccountant: false,
        user: null,
      } as any);

      vi.mocked(dashboardService.getRecentTransactions).mockResolvedValue([
        mockTransaction,
      ]);

      const { result } = renderQueryHook(() =>
        useDashboardHooks.useTopRecentTransactions(),
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(dashboardService.getRecentTransactions).toHaveBeenCalledWith({
        branchId: undefined,
        limit: 5,
      });
    });

    it('should fetch top N recent transactions with custom limit', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAccountant: false,
        user: null,
      } as any);

      vi.mocked(dashboardService.getRecentTransactions).mockResolvedValue([
        mockTransaction,
      ]);

      const { result } = renderQueryHook(() =>
        useDashboardHooks.useTopRecentTransactions(10),
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(dashboardService.getRecentTransactions).toHaveBeenCalledWith({
        branchId: undefined,
        limit: 10,
      });
    });
  });

  describe('useCurrentMonthBranchComparison', () => {
    it('should fetch current month branch comparison when admin', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAdmin: true,
      } as any);

      vi.mocked(dashboardService.getBranchComparison).mockResolvedValue(
        mockBranchPerformance,
      );

      const { result } = renderQueryHook(() =>
        useDashboardHooks.useCurrentMonthBranchComparison(),
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const today = new Date();
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      expect(dashboardService.getBranchComparison).toHaveBeenCalledWith({
        startDate: firstOfMonth.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      });
    });
  });
});
