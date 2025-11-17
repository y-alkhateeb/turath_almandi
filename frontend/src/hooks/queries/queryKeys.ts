/**
 * Query Key Factories
 *
 * Centralized query key management for React Query cache.
 * Provides type-safe query keys for all entities in the application.
 *
 * @see https://tanstack.com/query/v5/docs/react/guides/query-keys
 */

import type { TransactionFilters } from '@/types/transactions.types';

/**
 * Branches Query Keys
 */
export const branchesKeys = {
  all: ['branches'] as const,
  lists: () => [...branchesKeys.all, 'list'] as const,
  list: () => [...branchesKeys.lists()] as const,
  details: () => [...branchesKeys.all, 'detail'] as const,
  detail: (id: string) => [...branchesKeys.details(), id] as const,
};

/**
 * Transactions Query Keys
 */
export const transactionsKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionsKeys.all, 'list'] as const,
  list: (filters?: TransactionFilters) => [...transactionsKeys.lists(), filters] as const,
  details: () => [...transactionsKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionsKeys.details(), id] as const,
};

/**
 * Debts Query Keys
 */
export const debtsKeys = {
  all: ['debts'] as const,
  lists: () => [...debtsKeys.all, 'list'] as const,
  list: () => [...debtsKeys.lists()] as const,
  details: () => [...debtsKeys.all, 'detail'] as const,
  detail: (id: string) => [...debtsKeys.details(), id] as const,
  payments: (debtId: string) => [...debtsKeys.detail(debtId), 'payments'] as const,
};

/**
 * Inventory Query Keys
 */
export const inventoryKeys = {
  all: ['inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: () => [...inventoryKeys.lists()] as const,
  details: () => [...inventoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...inventoryKeys.details(), id] as const,
};

/**
 * Users Query Keys
 */
export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: () => [...usersKeys.lists()] as const,
  details: () => [...usersKeys.all, 'detail'] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
  me: () => [...usersKeys.all, 'me'] as const,
};

/**
 * Dashboard Query Keys
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: (filters?: { date?: string; branchId?: string }) =>
    [...dashboardKeys.all, 'stats', filters] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
};

/**
 * Auth Query Keys
 */
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  session: () => [...authKeys.all, 'session'] as const,
};

/**
 * Type-safe query key factory
 *
 * Export all query keys for easy import
 */
export const queryKeys = {
  branches: branchesKeys,
  transactions: transactionsKeys,
  debts: debtsKeys,
  inventory: inventoryKeys,
  users: usersKeys,
  dashboard: dashboardKeys,
  auth: authKeys,
};
