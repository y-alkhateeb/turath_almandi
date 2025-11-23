/**
 * useDebts Hooks
 * React Query hooks for debt management with pagination and payments
 *
 * Features:
 * - Paginated debts query with comprehensive filters
 * - Debt summary statistics
 * - Create/Update/Delete mutations with optimistic updates
 * - Special usePayDebt mutation with optimistic updates
 * - Auto-invalidation of debts and notifications caches
 * - Filter state management hook
 * - Arabic toast messages
 * - Full error handling and strict typing
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import debtService from '@/api/services/debtService';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { useAuth } from './useAuth';
import type { Debt, CreateDebtInput, UpdateDebtInput, PayDebtInput } from '#/entity';
import type { PaginatedResponse, DebtQueryFilters, DebtSummaryResponse } from '#/api';
import { ApiError } from '@/api/apiClient';

// ============================================
// QUERY HOOKS
// ============================================

/**
 * useDebts Hook
 * Query paginated debts with filters
 * Auto-filters for accountants to show only their branch's debts
 *
 * @param filters - Optional DebtQueryFilters (status, branchId, dates, page, limit)
 * @returns Query result with paginated debts (including payments array)
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useDebts({
 *   status: 'ACTIVE',
 *   page: 1,
 *   limit: 20,
 * });
 * const debts = data?.data || [];
 * const totalPages = data?.meta.totalPages || 0;
 * ```
 */
export const useDebts = (filters?: DebtQueryFilters) => {
  const { user, isAccountant } = useAuth();

  // Auto-filter accountants to their branch
  const appliedFilters: DebtQueryFilters = {
    ...filters,
    branchId: isAccountant && user?.branchId ? user.branchId : filters?.branchId,
  };

  return useQuery<PaginatedResponse<Debt>, ApiError>({
    queryKey: queryKeys.debts.list(appliedFilters),
    queryFn: () => debtService.getAll(appliedFilters),
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });
};

/**
 * useDebt Hook
 * Query single debt by ID
 * Returns debt with full payments array
 *
 * @param id - Debt UUID
 * @param options - Query options (enabled, etc.)
 * @returns Query result with debt data including payments
 *
 * @example
 * ```tsx
 * const { data: debt, isLoading } = useDebt(debtId);
 * if (debt) {
 *   console.log(debt.creditorName, debt.remainingAmount);
 *   console.log('Payments:', debt.payments);
 * }
 * ```
 */
export const useDebt = (
  id: string,
  options?: {
    enabled?: boolean;
  }
) => {
  return useQuery<Debt, ApiError>({
    queryKey: queryKeys.debts.detail(id),
    queryFn: () => debtService.getOne(id),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    enabled: options?.enabled ?? !!id,
  });
};

/**
 * useDebtSummary Hook
 * Query debt statistics and summary
 *
 * @param branchId - Optional branch UUID (accountants auto-filtered)
 * @returns Query result with debt statistics
 *
 * @example
 * ```tsx
 * const { data: summary } = useDebtSummary('branch-id');
 * console.log(summary?.totalDebts, summary?.totalOwed);
 * ```
 */
export const useDebtSummary = (branchId?: string) => {
  const { user, isAccountant } = useAuth();

  // Auto-filter accountants to their branch
  const filters = {
    branchId: isAccountant && user?.branchId ? user.branchId : branchId,
  };

  return useQuery<DebtSummaryResponse, ApiError>({
    queryKey: queryKeys.debts.summary(filters.branchId),
    queryFn: () => debtService.getSummary(filters),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * useCreateDebt Hook
 * Mutation to create new debt with optimistic update
 * Invalidates debts and notifications caches
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const createDebt = useCreateDebt();
 *
 * const handleCreate = async () => {
 *   try {
 *     await createDebt.mutateAsync({
 *       creditorName: 'محمد علي',
 *       amount: 1000,
 *       date: new Date().toISOString(),
 *       dueDate: '2025-12-31',
 *     });
 *   } catch (error) {
 *     // Error already handled with toast
 *   }
 * };
 * ```
 */
export const useCreateDebt = () => {
  const queryClient = useQueryClient();

  return useMutation<Debt, ApiError, CreateDebtInput>({
    mutationFn: debtService.create,

    // Optimistic update
    onMutate: async (newDebt) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.debts.all });

      // Snapshot current data
      const previousDebts = queryClient.getQueriesData<PaginatedResponse<Debt>>({
        queryKey: queryKeys.debts.all,
      });

      // Optimistically update all debt lists
      queryClient.setQueriesData<PaginatedResponse<Debt>>(
        { queryKey: queryKeys.debts.all },
        (old) => {
          // Only update if we have a valid PaginatedResponse with data array
          if (!old || !old.data || !Array.isArray(old.data)) return old;

          // Create temporary debt with optimistic ID
          const tempDebt: Debt = {
            id: `temp-${Date.now()}`,
            creditorName: newDebt.creditorName,
            originalAmount: newDebt.amount,
            remainingAmount: newDebt.amount,
            currency: newDebt.currency || 'USD',
            date: newDebt.date,
            dueDate: newDebt.dueDate,
            status: 'ACTIVE',
            notes: newDebt.notes || null,
            branchId: newDebt.branchId || '',
            createdBy: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
            payments: [],
          };

          return {
            ...old,
            data: [tempDebt, ...old.data],
            meta: {
              ...old.meta,
              total: old.meta.total + 1,
            },
          };
        }
      );

      return { previousDebts };
    },

    onError: (_error, _newDebt, context) => {
      // Rollback on error
      if (context?.previousDebts) {
        context.previousDebts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Note: Error toast shown by global API interceptor
    },

    onSuccess: (_data, variables) => {
      // Invalidate debts and notifications
      queryClient.invalidateQueries({ queryKey: queryKeys.debts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });

      // Invalidate dashboard (new debt affects debt stats)
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });

      // Show success toast
      toast.success(`تم إضافة دين "${variables.creditorName}" بنجاح`);
    },
  });
};

/**
 * useUpdateDebt Hook
 * Mutation to update existing debt with optimistic update
 * Note: Cannot update amount - use usePayDebt for payments
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const updateDebt = useUpdateDebt();
 *
 * const handleUpdate = async () => {
 *   await updateDebt.mutateAsync({
 *     id: debtId,
 *     data: { dueDate: '2026-01-31' },
 *   });
 * };
 * ```
 */
export const useUpdateDebt = () => {
  const queryClient = useQueryClient();

  return useMutation<Debt, ApiError, { id: string; data: UpdateDebtInput }>({
    mutationFn: ({ id, data }) => debtService.update(id, data),

    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.debts.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.debts.detail(id) });

      // Snapshot current data
      const previousDebt = queryClient.getQueryData<Debt>(queryKeys.debts.detail(id));
      const previousDebts = queryClient.getQueriesData<PaginatedResponse<Debt>>({
        queryKey: queryKeys.debts.all,
      });

      // Optimistically update debt detail
      queryClient.setQueryData<Debt>(queryKeys.debts.detail(id), (old) => {
        if (!old) return old;
        return { ...old, ...data, updatedAt: new Date().toISOString() };
      });

      // Optimistically update debt in all lists
      queryClient.setQueriesData<PaginatedResponse<Debt>>(
        { queryKey: queryKeys.debts.all },
        (old) => {
          // Only update if we have a valid PaginatedResponse with data array
          if (!old || !old.data || !Array.isArray(old.data)) return old;

          return {
            ...old,
            data: old.data.map((debt) =>
              debt.id === id ? { ...debt, ...data, updatedAt: new Date().toISOString() } : debt
            ),
          };
        }
      );

      return { previousDebt, previousDebts };
    },

    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousDebt) {
        queryClient.setQueryData(queryKeys.debts.detail(id), context.previousDebt);
      }
      if (context?.previousDebts) {
        context.previousDebts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Note: Error toast shown by global API interceptor
    },

    onSuccess: (updatedDebt) => {
      // Invalidate debts
      queryClient.invalidateQueries({ queryKey: queryKeys.debts.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.debts.detail(updatedDebt.id),
      });

      // Invalidate notifications (may affect overdue alerts)
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });

      // Invalidate dashboard (debt stats may have changed)
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });

      // Show success toast
      toast.success('تم تحديث الدين بنجاح');
    },
  });
};

/**
 * useDeleteDebt Hook
 * Mutation to delete debt with optimistic update
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const deleteDebt = useDeleteDebt();
 *
 * const handleDelete = async () => {
       if (confirm('هل أنت متأكد من حذف هذا الدين؟')) {
 *     await deleteDebt.mutateAsync(debtId);
 *   }
 * };
 * ```
 */
export const useDeleteDebt = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: debtService.delete,

    // Optimistic update
    onMutate: async (deletedId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.debts.all });

      // Snapshot current data
      const previousDebts = queryClient.getQueriesData<PaginatedResponse<Debt>>({
        queryKey: queryKeys.debts.all,
      });

      // Optimistically remove debt from all lists
      queryClient.setQueriesData<PaginatedResponse<Debt>>(
        { queryKey: queryKeys.debts.all },
        (old) => {
          // Only update if we have a valid PaginatedResponse with data array
          if (!old || !old.data || !Array.isArray(old.data)) return old;

          return {
            ...old,
            data: old.data.filter((debt) => debt.id !== deletedId),
            meta: {
              ...old.meta,
              total: old.meta.total - 1,
            },
          };
        }
      );

      // Remove debt detail from cache
      queryClient.removeQueries({
        queryKey: queryKeys.debts.detail(deletedId),
      });

      return { previousDebts };
    },

    onError: (error, _deletedId, context) => {
      // Rollback on error
      if (context?.previousDebts) {
        context.previousDebts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Note: Error toast shown by global API interceptor
    },

    onSuccess: () => {
      // Invalidate debts
      queryClient.invalidateQueries({ queryKey: queryKeys.debts.all });

      // Invalidate dashboard (debt stats affected)
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });

      // Show success toast
      toast.success('تم حذف الدين بنجاح');
    },
  });
};

/**
 * usePayDebt Hook
 * Mutation to record payment towards a debt
 * Special handling: invalidates debts AND notifications (backend creates notification)
 * Optimistic update reduces remainingAmount and adds payment to payments array
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const payDebt = usePayDebt();
 *
 * const handlePayment = async () => {
 *   await payDebt.mutateAsync({
 *     id: debtId,
 *     data: {
 *       amountPaid: 500,
 *       paymentDate: new Date().toISOString(),
       notes: 'دفعة أولى',
 *     },
 *   });
 * };
 * ```
 */
export const usePayDebt = () => {
  const queryClient = useQueryClient();

  return useMutation<Debt, ApiError, { id: string; data: PayDebtInput }>({
    mutationFn: ({ id, data }) => debtService.payDebt(id, data),

    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.debts.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.debts.detail(id) });

      // Snapshot current data
      const previousDebt = queryClient.getQueryData<Debt>(queryKeys.debts.detail(id));
      const previousDebts = queryClient.getQueriesData<PaginatedResponse<Debt>>({
        queryKey: queryKeys.debts.all,
      });

      // Optimistically update debt detail
      queryClient.setQueryData<Debt>(queryKeys.debts.detail(id), (old) => {
        if (!old) return old;

        const newRemainingAmount = Number(old.remainingAmount) - Number(data.amountPaid);
        const newStatus =
          newRemainingAmount <= 0
            ? 'PAID'
            : newRemainingAmount < old.originalAmount
              ? 'PARTIAL'
              : old.status;

        return {
          ...old,
          remainingAmount: Math.max(0, newRemainingAmount),
          status: newStatus,
          updatedAt: new Date().toISOString(),
          // Optimistically add payment to array
          payments: [
            ...(old.payments || []),
            {
              id: `temp-${Date.now()}`,
              debtId: id,
              amountPaid: data.amountPaid, // Fixed: was 'amount', should be 'amountPaid'
              paymentDate: data.paymentDate,
              notes: data.notes || null,
              recordedBy: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        };
      });

      // Optimistically update debt in all lists
      queryClient.setQueriesData<PaginatedResponse<Debt>>(
        { queryKey: queryKeys.debts.all },
        (old) => {
          // Only update if we have a valid PaginatedResponse with data array
          if (!old || !old.data || !Array.isArray(old.data)) return old;

          return {
            ...old,
            data: old.data.map((debt) => {
              if (debt.id !== id) return debt;

              const newRemainingAmount = Number(debt.remainingAmount) - Number(data.amountPaid);
              const newStatus =
                newRemainingAmount <= 0
                  ? 'PAID'
                  : newRemainingAmount < debt.originalAmount
                    ? 'PARTIAL'
                    : debt.status;

              return {
                ...debt,
                remainingAmount: Math.max(0, newRemainingAmount),
                status: newStatus,
                updatedAt: new Date().toISOString(),
              };
            }),
          };
        }
      );

      return { previousDebt, previousDebts };
    },

    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousDebt) {
        queryClient.setQueryData(queryKeys.debts.detail(id), context.previousDebt);
      }
      if (context?.previousDebts) {
        context.previousDebts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Note: Error toast shown by global API interceptor
    },

    onSuccess: (updatedDebt, variables) => {
      // Invalidate debts and notifications (backend creates notification for payment)
      queryClient.invalidateQueries({ queryKey: queryKeys.debts.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.debts.detail(updatedDebt.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });

      // Invalidate dashboard (debt payment affects stats)
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });

      // Show success toast
      const formattedAmount = new Intl.NumberFormat('ar-IQ', {
        style: 'currency',
        currency: variables.data.currency || 'IQD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(variables.data.amountPaid);

      if (updatedDebt.status === 'PAID') {
        toast.success(`✅ تم دفع الدين بالكامل!`);
      } else {
        toast.success(`تم تسجيل دفعة ${formattedAmount}`);
      }
    },
  });
};

// ============================================
// FILTER MANAGEMENT HOOK
// ============================================

/**
 * useDebtFilters Hook
 * Custom hook for managing debt filter state
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
 * } = useDebtFilters();
 *
 * // Update single filter
 * setFilter('status', 'ACTIVE');
 *
 * // Update multiple filters
 * setFilters({ status: 'OVERDUE', branchId: 'branch-id' });
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
 * const { data } = useDebts(filters);
 * ```
 */
export const useDebtFilters = (initialFilters?: Partial<DebtQueryFilters>) => {
  const [filters, setFiltersState] = useState<DebtQueryFilters>(initialFilters || {});

  /**
   * Set all filters at once
   */
  const setFilters = useCallback((newFilters: Partial<DebtQueryFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Set a single filter
   */
  const setFilter = useCallback(
    <K extends keyof DebtQueryFilters>(key: K, value: DebtQueryFilters[K]) => {
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
   * Set date range (for debt creation date)
   */
  const setDateRange = useCallback((startDate?: string, endDate?: string) => {
    setFiltersState((prev) => ({ ...prev, startDate, endDate }));
  }, []);

  /**
   * Set due date range
   */
  const setDueDateRange = useCallback((dueDateStart?: string, dueDateEnd?: string) => {
    setFiltersState((prev) => ({ ...prev, dueDateStart, dueDateEnd }));
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
    setDueDateRange,
    setPage,
    setLimit,
  };
};

// ============================================
// HELPER HOOKS
// ============================================

/**
 * useActiveDebts Hook
 * Query only active debts (no payments made)
 *
 * @param filters - Optional additional filters
 * @returns Query result with active debts
 */
export const useActiveDebts = (filters?: Omit<DebtQueryFilters, 'status'>) => {
  return useDebts({ ...filters, status: 'ACTIVE' });
};

/**
 * usePaidDebts Hook
 * Query only paid debts (fully paid)
 *
 * @param filters - Optional additional filters
 * @returns Query result with paid debts
 */
export const usePaidDebts = (filters?: Omit<DebtQueryFilters, 'status'>) => {
  return useDebts({ ...filters, status: 'PAID' });
};

/**
 * usePartialDebts Hook
 * Query only partial debts (some payments made)
 *
 * @param filters - Optional additional filters
 * @returns Query result with partial debts
 */
export const usePartialDebts = (filters?: Omit<DebtQueryFilters, 'status'>) => {
  return useDebts({ ...filters, status: 'PARTIAL' });
};

/**
 * useOverdueDebts Hook
 * Query only overdue debts (past due date with remaining amount)
 *
 * @param filters - Optional additional filters
 * @returns Query result with overdue debts
 */
export const useOverdueDebts = (filters?: Omit<DebtQueryFilters, 'status'>) => {
  return useDebts({ ...filters, status: 'OVERDUE' });
};
