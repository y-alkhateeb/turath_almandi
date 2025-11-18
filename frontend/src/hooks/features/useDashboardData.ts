/**
 * useDashboardData - Business Logic Hook
 *
 * Handles all dashboard business logic including:
 * - State management (filters)
 * - Data fetching (stats, branches)
 * - Event handlers
 * - Derived state calculations
 *
 * Separates business logic from presentation layer.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUserInfo, useIsAdmin } from '@/store/userStore';
import { getDashboardStats } from '@/api/services/dashboardService';
import { getAll as getAllBranches } from '@/api/services/branchService';
import type { DashboardStats } from '#/entity';
import type { Branch } from '@/types';

export interface UseDashboardDataReturn {
  // User info
  userInfo: ReturnType<typeof useUserInfo>;
  isAdmin: boolean;

  // State
  selectedDate: string;
  selectedBranchId: string;

  // Data
  stats: DashboardStats | undefined;
  branches: Branch[] | undefined;

  // Loading & Error
  isLoading: boolean;
  error: Error | null;

  // Handlers
  setSelectedDate: (date: string) => void;
  setSelectedBranchId: (branchId: string) => void;
  handleTodayClick: () => void;
  handleRetry: () => void;

  // Derived state
  hasNoTransactionsEver: boolean;
}

export function useDashboardData(): UseDashboardDataReturn {
  const userInfo = useUserInfo();
  const isAdmin = useIsAdmin();

  // State
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Determine effective branch ID (accountants can only see their branch)
  const effectiveBranchId =
    userInfo?.role === 'ACCOUNTANT'
      ? userInfo?.branchId
      : selectedBranchId === 'ALL'
        ? undefined
        : selectedBranchId;

  // Fetch branches for admin users
  const {
    data: branches,
    isLoading: branchesLoading,
  } = useQuery({
    queryKey: ['branches'],
    queryFn: getAllBranches,
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch dashboard stats with auto-refresh
  const {
    data: stats,
    isLoading: statsLoading,
    error,
    refetch,
  } = useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats', selectedDate, effectiveBranchId],
    queryFn: () =>
      getDashboardStats({
        date: selectedDate,
        branchId: effectiveBranchId || undefined,
      }),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
    retry: 2,
  });

  // Handlers
  const handleTodayClick = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const handleRetry = () => {
    refetch();
  };

  // Derived state: Check if there are NO transactions EVER
  const hasNoTransactionsEver =
    stats?.totalRevenue === 0 &&
    stats?.totalExpenses === 0 &&
    stats?.recentTransactions.length === 0 &&
    stats?.todayTransactions === 0;

  return {
    // User info
    userInfo,
    isAdmin,

    // State
    selectedDate,
    selectedBranchId,

    // Data
    stats,
    branches,

    // Loading & Error
    isLoading: statsLoading || branchesLoading,
    error: error as Error | null,

    // Handlers
    setSelectedDate,
    setSelectedBranchId,
    handleTodayClick,
    handleRetry,

    // Derived state
    hasNoTransactionsEver,
  };
}
