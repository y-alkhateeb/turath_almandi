/**
 * useTransactions Hooks
 * React Query hooks for transaction management with pagination and filters
 *
 * Features:
 * - Paginated transactions query with comprehensive filters
 * - Transaction summary statistics
 * - Create/Update/Delete mutations with optimistic updates
 * - Auto-invalidation of dashboard and inventory caches
 * - Filter state management hook
 * - Arabic toast messages
 * - Full error handling and strict typing
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import transactionService from '@/api/services/transactionService';
import { queryKeys } from '@/hooks/queries/queryKeys';
import type { Transaction, CreateTransactionInput, UpdateTransactionInput } from '#/entity';
import type { PaginatedResponse, TransactionQueryFilters, TransactionStatsResponse } from '#/api';
import { ApiError } from '@/api/apiClient';

// ============================================
// QUERY HOOKS
// ============================================

/**
 * useTransactions Hook
 * Query paginated transactions with filters
 *
 * @param filters - Optional TransactionQueryFilters (type, category, paymentMethod, branchId, dates, page, limit)
 * @returns Query result with paginated transactions
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useTransactions({
 *   type: 'INCOME',
 *   startDate: '2025-01-01',
 *   page: 1,
 *   limit: 20,
 * });
 * const transactions = data?.data || [];
 * const totalPages = data?.meta.totalPages || 0;
 * ```
 */
export const useTransactions = (filters?: TransactionQueryFilters) => {
  return useQuery<PaginatedResponse<Transaction>, ApiError>({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: () => transactionService.getAll(filters),
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });
};

/**
 * useTransaction Hook
 * Query single transaction by ID
 *
 * @param id - Transaction UUID
 * @param options - Query options (enabled, etc.)
 * @returns Query result with transaction data
 *
 * @example
 * ```tsx
 * const { data: transaction, isLoading } = useTransaction(transactionId);
 * if (transaction) {
 *   console.log(transaction.amount, transaction.type);
 * }
 * ```
 */
export const useTransaction = (
  id: string,
  options?: {
    enabled?: boolean;
  }
) => {
  return useQuery<Transaction, ApiError>({
    queryKey: queryKeys.transactions.detail(id),
    queryFn: () => transactionService.getOne(id),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    enabled: options?.enabled ?? !!id,
  });
};

/**
 * useTransactionSummary Hook
 * Query transaction summary statistics
 *
 * @param branchId - Optional branch UUID
 * @param dates - Optional date range {startDate, endDate}
 * @returns Query result with transaction statistics
 *
 * @example
 * ```tsx
 * const { data: summary } = useTransactionSummary('branch-id', {
 *   startDate: '2025-01-01',
 *   endDate: '2025-01-31',
 * });
 * console.log(summary?.totalIncome, summary?.netProfit);
 * ```
 */
export const useTransactionSummary = (
  branchId?: string,
  dates?: { startDate?: string; endDate?: string }
) => {
  return useQuery<TransactionStatsResponse, ApiError>({
    queryKey: queryKeys.transactions.summary(branchId, dates),
    queryFn: () =>
      transactionService.getSummary({
        branchId,
        ...dates,
      }),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * useCreateTransaction Hook
 * Mutation to create new transaction with optimistic update
 * Invalidates transactions, dashboard, and inventory caches
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const createTransaction = useCreateTransaction();
 *
 * const handleCreate = async () => {
 *   try {
 *     await createTransaction.mutateAsync({
 *       type: 'INCOME',
 *       amount: 500,
 *       paymentMethod: 'CASH',
 *       date: new Date().toISOString(),
 *     });
 *   } catch (error) {
 *     // Error already handled with toast
 *   }
 * };
 * ```
 */
export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation<Transaction, ApiError, CreateTransactionInput>({
    mutationFn: transactionService.create,

    // Optimistic update
    onMutate: async (newTransaction) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.all });

      // Snapshot current data
      const previousTransactions = queryClient.getQueriesData<PaginatedResponse<Transaction>>({
        queryKey: queryKeys.transactions.all,
      });

      // Optimistically update all transaction lists
      queryClient.setQueriesData<PaginatedResponse<Transaction>>(
        { queryKey: queryKeys.transactions.all },
        (old) => {
          if (!old) return old;

          // Create temporary transaction with optimistic ID
          const tempTransaction: Transaction = {
            id: `temp-${Date.now()}`,
            type: newTransaction.type,
            amount: newTransaction.amount,
            currency: newTransaction.currency || 'USD',
            paymentMethod: newTransaction.paymentMethod || null,
            category: newTransaction.category || null,
            date: newTransaction.date,
            employeeVendorName: newTransaction.employeeVendorName || null,
            notes: newTransaction.notes || null,
            branchId: newTransaction.branchId || '',
            createdBy: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
          };

          return {
            ...old,
            data: [tempTransaction, ...old.data],
            meta: {
              ...old.meta,
              total: old.meta.total + 1,
            },
          };
        }
      );

      return { previousTransactions };
    },

    onError: (_error, _newTransaction, context) => {
      // Rollback on error
      if (context?.previousTransactions) {
        context.previousTransactions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Note: Error toast shown by global API interceptor
    },

    onSuccess: (_data, variables) => {
      // Invalidate transactions, dashboard, and inventory
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });

      // Show success toast based on type
      const message =
        variables.type === 'INCOME' ? 'تم إضافة الإيراد بنجاح' : 'تم إضافة المصروف بنجاح';
      toast.success(message);
    },
  });
};

/**
 * useUpdateTransaction Hook
 * Mutation to update existing transaction with optimistic update
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const updateTransaction = useUpdateTransaction();
 *
 * const handleUpdate = async () => {
 *   await updateTransaction.mutateAsync({
 *     id: transactionId,
 *     data: { amount: 600 },
 *   });
 * };
 * ```
 */
export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation<Transaction, ApiError, { id: string; data: UpdateTransactionInput }>({
    mutationFn: ({ id, data }) => transactionService.update(id, data),

    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.all });
      await queryClient.cancelQueries({
        queryKey: queryKeys.transactions.detail(id),
      });

      // Snapshot current data
      const previousTransaction = queryClient.getQueryData<Transaction>(
        queryKeys.transactions.detail(id)
      );
      const previousTransactions = queryClient.getQueriesData<PaginatedResponse<Transaction>>({
        queryKey: queryKeys.transactions.all,
      });

      // Optimistically update transaction detail
      queryClient.setQueryData<Transaction>(queryKeys.transactions.detail(id), (old) => {
        if (!old) return old;
        return { ...old, ...data, updatedAt: new Date().toISOString() };
      });

      // Optimistically update transaction in all lists
      queryClient.setQueriesData<PaginatedResponse<Transaction>>(
        { queryKey: queryKeys.transactions.all },
        (old) => {
          if (!old) return old;

          return {
            ...old,
            data: old.data.map((transaction) =>
              transaction.id === id
                ? { ...transaction, ...data, updatedAt: new Date().toISOString() }
                : transaction
            ),
          };
        }
      );

      return { previousTransaction, previousTransactions };
    },

    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousTransaction) {
        queryClient.setQueryData(queryKeys.transactions.detail(id), context.previousTransaction);
      }
      if (context?.previousTransactions) {
        context.previousTransactions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Note: Error toast shown by global API interceptor
    },

    onSuccess: (updatedTransaction) => {
      // Invalidate transactions and dashboard
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.detail(updatedTransaction.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });

      // Show success toast
      toast.success('تم تحديث العملية بنجاح');
    },
  });
};

/**
 * useDeleteTransaction Hook
 * Mutation to delete transaction with optimistic update
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const deleteTransaction = useDeleteTransaction();
 *
 * const handleDelete = async () => {
 *   if (confirm('هل أنت متأكد من حذف هذه العملية؟')) {
 *     await deleteTransaction.mutateAsync(transactionId);
 *   }
 * };
 * ```
 */
export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: transactionService.delete,

    // Optimistic update
    onMutate: async (deletedId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.all });

      // Snapshot current data
      const previousTransactions = queryClient.getQueriesData<PaginatedResponse<Transaction>>({
        queryKey: queryKeys.transactions.all,
      });

      // Optimistically remove transaction from all lists
      queryClient.setQueriesData<PaginatedResponse<Transaction>>(
        { queryKey: queryKeys.transactions.all },
        (old) => {
          if (!old) return old;

          return {
            ...old,
            data: old.data.filter((transaction) => transaction.id !== deletedId),
            meta: {
              ...old.meta,
              total: old.meta.total - 1,
            },
          };
        }
      );

      // Remove transaction detail from cache
      queryClient.removeQueries({
        queryKey: queryKeys.transactions.detail(deletedId),
      });

      return { previousTransactions };
    },

    onError: (error, _deletedId, context) => {
      // Rollback on error
      if (context?.previousTransactions) {
        context.previousTransactions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Note: Error toast shown by global API interceptor
    },

    onSuccess: () => {
      // Invalidate transactions, dashboard, and inventory
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });

      // Show success toast
      toast.success('تم حذف العملية بنجاح');
    },
  });
};

// ============================================
// FILTER MANAGEMENT HOOK
// ============================================

/**
 * useTransactionFilters Hook
 * Custom hook for managing transaction filter state
 *
 * @param initialFilters - Optional initial filter values
 * @returns Filter state and update functions
 *
 * @example
 * ```tsx
 * const {
 *   filters,
 *   setFilters,
 *   setFilter,
 *   resetFilters,
 *   setDateRange,
 *   setPage,
 * } = useTransactionFilters();
 *
 * // Update single filter
 * setFilter('type', 'INCOME');
 *
 * // Update multiple filters
 * setFilters({ type: 'INCOME', paymentMethod: 'CASH' });
 *
 * // Set date range
 * setDateRange('2025-01-01', '2025-01-31');
 *
 * // Change page
 * setPage(2);
 *
 * // Reset all filters
 * resetFilters();
 *
 * // Use filters in query
 * const { data } = useTransactions(filters);
 * ```
 */
export const useTransactionFilters = (initialFilters?: Partial<TransactionQueryFilters>) => {
  const [filters, setFiltersState] = useState<TransactionQueryFilters>(initialFilters || {});

  /**
   * Set all filters at once
   */
  const setFilters = useCallback((newFilters: Partial<TransactionQueryFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Set a single filter
   */
  const setFilter = useCallback(
    <K extends keyof TransactionQueryFilters>(key: K, value: TransactionQueryFilters[K]) => {
      setFiltersState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  /**
   * Reset all filters
   */
  const resetFilters = useCallback(() => {
    setFiltersState(initialFilters || {});
  }, [initialFilters]);

  /**
   * Set date range
   */
  const setDateRange = useCallback((startDate?: string, endDate?: string) => {
    setFiltersState((prev) => ({ ...prev, startDate, endDate }));
  }, []);

  /**
   * Set page number
   */
  const setPage = useCallback((page: number) => {
    setFiltersState((prev) => ({ ...prev, page }));
  }, []);

  /**
   * Set limit (items per page)
   */
  const setLimit = useCallback((limit: number) => {
    setFiltersState((prev) => ({ ...prev, limit, page: 1 })); // Reset to page 1 when changing limit
  }, []);

  return {
    filters,
    setFilters,
    setFilter,
    resetFilters,
    setDateRange,
    setPage,
    setLimit,
  };
};

// ============================================
// HELPER HOOKS
// ============================================

/**
 * useIncomeTransactions Hook
 * Query only income transactions (convenience hook)
 *
 * @param filters - Optional additional filters
 * @returns Query result with income transactions
 */
export const useIncomeTransactions = (filters?: Omit<TransactionQueryFilters, 'type'>) => {
  return useTransactions({ ...filters, type: 'INCOME' });
};

/**
 * useExpenseTransactions Hook
 * Query only expense transactions (convenience hook)
 *
 * @param filters - Optional additional filters
 * @returns Query result with expense transactions
 */
export const useExpenseTransactions = (filters?: Omit<TransactionQueryFilters, 'type'>) => {
  return useTransactions({ ...filters, type: 'EXPENSE' });
};

/**
 * useTodayTransactions Hook
 * Query today's transactions (convenience hook)
 *
 * @param filters - Optional additional filters
 * @returns Query result with today's transactions
 */
export const useTodayTransactions = (
  filters?: Omit<TransactionQueryFilters, 'startDate' | 'endDate'>
) => {
  const today = new Date().toISOString().split('T')[0];
  return useTransactions({ ...filters, startDate: today, endDate: today });
};
