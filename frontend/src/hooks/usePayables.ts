/**
 * usePayables Hooks
 * React Query hooks for payable management (accounts payable)
 *
 * Features:
 * - Paginated payables query with comprehensive filters
 * - Payable summary statistics
 * - Create/Update/Delete mutations with optimistic updates
 * - Special usePayPayable mutation with optimistic updates
 * - Auto-invalidation of payables and transactions caches
 * - Filter state management hook
 * - Arabic toast messages
 * - Full error handling and strict typing
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import payableService from '@/api/services/payableService';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { useAuth } from './useAuth';
import type { Payable, CreatePayableInput, UpdatePayableInput, PayPayableInput } from '#/entity';
import type { PaginatedResponse, PayableQueryFilters, PayableSummaryResponse } from '#/api';
import { ApiError } from '@/api/apiClient';

// ============================================
// QUERY HOOKS
// ============================================

/**
 * usePayables Hook
 * Query paginated payables with filters
 * Auto-filters for accountants to show only their branch's payables
 *
 * @param filters - Optional PayableQueryFilters (status, contactId, branchId, dates, page, limit)
 * @returns Query result with paginated payables (including payments array)
 *
 * @example
 * ```tsx
 * const { data, isLoading } = usePayables({
 *   status: 'ACTIVE',
 *   page: 1,
 *   limit: 20,
 * });
 * const payables = data?.data || [];
 * const totalPages = data?.meta.totalPages || 0;
 * ```
 */
export const usePayables = (filters?: PayableQueryFilters) => {
  const { user, isAccountant } = useAuth();

  // Auto-filter accountants to their branch
  const appliedFilters: PayableQueryFilters = {
    ...filters,
    branchId: isAccountant && user?.branchId ? user.branchId : filters?.branchId,
  };

  return useQuery<PaginatedResponse<Payable>, ApiError>({
    queryKey: queryKeys.payables.list(appliedFilters),
    queryFn: () => payableService.getAll(appliedFilters),
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });
};

/**
 * usePayable Hook
 * Query single payable by ID
 * Returns payable with full payments array
 *
 * @param id - Payable UUID
 * @param options - Query options (enabled, etc.)
 * @returns Query result with payable data including payments
 *
 * @example
 * ```tsx
 * const { data: payable, isLoading } = usePayable(payableId);
 * if (payable) {
 *   console.log(payable.contact.name, payable.remainingAmount);
 *   console.log('Payments:', payable.payments);
 * }
 * ```
 */
export const usePayable = (
  id: string,
  options?: {
    enabled?: boolean;
  }
) => {
  return useQuery<Payable, ApiError>({
    queryKey: queryKeys.payables.detail(id),
    queryFn: () => payableService.getOne(id),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    enabled: options?.enabled ?? !!id,
  });
};

/**
 * usePayableSummary Hook
 * Query payable statistics and summary
 *
 * @param branchId - Optional branch UUID (accountants auto-filtered)
 * @returns Query result with payable statistics
 *
 * @example
 * ```tsx
 * const { data: summary } = usePayableSummary('branch-id');
 * console.log(summary?.total, summary?.totalAmount);
 * ```
 */
export const usePayableSummary = (branchId?: string) => {
  const { user, isAccountant } = useAuth();

  // Auto-filter accountants to their branch
  const filters = {
    branchId: isAccountant && user?.branchId ? user.branchId : branchId,
  };

  return useQuery<PayableSummaryResponse, ApiError>({
    queryKey: queryKeys.payables.summary(filters.branchId),
    queryFn: () => payableService.getSummary(filters),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * useCreatePayable Hook
 * Mutation to create new payable with optimistic update
 * Invalidates payables and transactions caches
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const createPayable = useCreatePayable();
 *
 * const handleCreate = async () => {
 *   try {
 *     await createPayable.mutateAsync({
 *       contactId: 'supplier-id',
 *       amount: 5000,
 *       date: new Date().toISOString(),
 *       dueDate: '2025-12-31',
 *       description: 'فاتورة شراء مواد',
 *     });
 *   } catch (error) {
 *     // Error already handled with toast
 *   }
 * };
 * ```
 */
export const useCreatePayable = () => {
  const queryClient = useQueryClient();

  return useMutation<Payable, ApiError, CreatePayableInput>({
    mutationFn: payableService.create,

    // Optimistic update
    onMutate: async (newPayable) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.payables.all });

      // Snapshot current data
      const previousPayables = queryClient.getQueriesData<PaginatedResponse<Payable>>({
        queryKey: queryKeys.payables.all,
      });

      // Optimistically update all payable lists
      queryClient.setQueriesData<PaginatedResponse<Payable>>(
        { queryKey: queryKeys.payables.all },
        (old) => {
          // Only update if we have a valid PaginatedResponse with data array
          if (!old || !old.data || !Array.isArray(old.data)) return old;

          // Create temporary payable with optimistic ID
          const tempPayable: Payable = {
            id: `temp-${Date.now()}`,
            contactId: newPayable.contactId,
            originalAmount: newPayable.amount,
            remainingAmount: newPayable.amount,
            date: newPayable.date,
            dueDate: newPayable.dueDate || null,
            status: 'ACTIVE',
            description: newPayable.description || null,
            invoiceNumber: newPayable.invoiceNumber || null,
            notes: newPayable.notes || null,
            linkedPurchaseTransactionId: null,
            branchId: newPayable.branchId || null,
            createdBy: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
            deletedBy: null,
            isDeleted: false,
            payments: [],
          } as Payable;

          return {
            ...old,
            data: [tempPayable, ...old.data],
            meta: {
              ...old.meta,
              total: old.meta.total + 1,
            },
          };
        }
      );

      return { previousPayables };
    },

    onError: (_error, _newPayable, context) => {
      // Rollback on error
      if (context?.previousPayables) {
        context.previousPayables.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Note: Error toast shown by global API interceptor
    },

    onSuccess: (_data, variables) => {
      // Invalidate payables and transactions
      queryClient.invalidateQueries({ queryKey: queryKeys.payables.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });

      // Invalidate dashboard (new payable affects stats)
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });

      // Show success toast
      const formattedAmount = new Intl.NumberFormat('ar-IQ', {
        style: 'currency',
        currency: 'IQD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(variables.amount);

      toast.success(`تم إضافة حساب دائن بقيمة ${formattedAmount}`);
    },
  });
};

/**
 * useUpdatePayable Hook
 * Mutation to update existing payable with optimistic update
 * Note: Cannot update amount - use usePayPayable for payments
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const updatePayable = useUpdatePayable();
 *
 * const handleUpdate = async () => {
 *   await updatePayable.mutateAsync({
 *     id: payableId,
 *     data: { dueDate: '2026-01-31' },
 *   });
 * };
 * ```
 */
export const useUpdatePayable = () => {
  const queryClient = useQueryClient();

  return useMutation<Payable, ApiError, { id: string; data: UpdatePayableInput }>({
    mutationFn: ({ id, data }) => payableService.update(id, data),

    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.payables.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.payables.detail(id) });

      // Snapshot current data
      const previousPayable = queryClient.getQueryData<Payable>(queryKeys.payables.detail(id));
      const previousPayables = queryClient.getQueriesData<PaginatedResponse<Payable>>({
        queryKey: queryKeys.payables.all,
      });

      // Optimistically update payable detail
      queryClient.setQueryData<Payable>(queryKeys.payables.detail(id), (old) => {
        if (!old) return old;
        return { ...old, ...data, updatedAt: new Date().toISOString() };
      });

      // Optimistically update payable in all lists
      queryClient.setQueriesData<PaginatedResponse<Payable>>(
        { queryKey: queryKeys.payables.all },
        (old) => {
          // Only update if we have a valid PaginatedResponse with data array
          if (!old || !old.data || !Array.isArray(old.data)) return old;

          return {
            ...old,
            data: old.data.map((payable) =>
              payable.id === id ? { ...payable, ...data, updatedAt: new Date().toISOString() } : payable
            ),
          };
        }
      );

      return { previousPayable, previousPayables };
    },

    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousPayable) {
        queryClient.setQueryData(queryKeys.payables.detail(id), context.previousPayable);
      }
      if (context?.previousPayables) {
        context.previousPayables.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Note: Error toast shown by global API interceptor
    },

    onSuccess: (updatedPayable) => {
      // Invalidate payables
      queryClient.invalidateQueries({ queryKey: queryKeys.payables.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.payables.detail(updatedPayable.id),
      });

      // Invalidate dashboard (payable stats may have changed)
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });

      // Show success toast
      toast.success('تم تحديث الحساب الدائن بنجاح');
    },
  });
};

/**
 * useDeletePayable Hook
 * Mutation to delete payable with optimistic update
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const deletePayable = useDeletePayable();
 *
 * const handleDelete = async () => {
 *   if (confirm('هل أنت متأكد من حذف هذا الحساب الدائن؟')) {
 *     await deletePayable.mutateAsync(payableId);
 *   }
 * };
 * ```
 */
export const useDeletePayable = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: payableService.delete,

    // Optimistic update
    onMutate: async (deletedId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.payables.all });

      // Snapshot current data
      const previousPayables = queryClient.getQueriesData<PaginatedResponse<Payable>>({
        queryKey: queryKeys.payables.all,
      });

      // Optimistically remove payable from all lists
      queryClient.setQueriesData<PaginatedResponse<Payable>>(
        { queryKey: queryKeys.payables.all },
        (old) => {
          // Only update if we have a valid PaginatedResponse with data array
          if (!old || !old.data || !Array.isArray(old.data)) return old;

          return {
            ...old,
            data: old.data.filter((payable) => payable.id !== deletedId),
            meta: {
              ...old.meta,
              total: old.meta.total - 1,
            },
          };
        }
      );

      // Remove payable detail from cache
      queryClient.removeQueries({
        queryKey: queryKeys.payables.detail(deletedId),
      });

      return { previousPayables };
    },

    onError: (error, _deletedId, context) => {
      // Rollback on error
      if (context?.previousPayables) {
        context.previousPayables.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Note: Error toast shown by global API interceptor
    },

    onSuccess: () => {
      // Invalidate payables
      queryClient.invalidateQueries({ queryKey: queryKeys.payables.all });

      // Invalidate dashboard (payable stats affected)
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });

      // Show success toast
      toast.success('تم حذف الحساب الدائن بنجاح');
    },
  });
};

/**
 * usePayPayable Hook
 * Mutation to record payment towards a payable
 * Special handling: invalidates payables AND transactions (backend creates transaction)
 * Optimistic update reduces remainingAmount and adds payment to payments array
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const payPayable = usePayPayable();
 *
 * const handlePayment = async () => {
 *   await payPayable.mutateAsync({
 *     id: payableId,
 *     data: {
 *       amountPaid: 2000,
 *       paymentDate: new Date().toISOString(),
 *       paymentMethod: 'CASH',
 *       notes: 'دفعة أولى',
 *     },
 *   });
 * };
 * ```
 */
export const usePayPayable = () => {
  const queryClient = useQueryClient();

  return useMutation<any, ApiError, { id: string; data: PayPayableInput }>({
    mutationFn: ({ id, data }) => payableService.payPayable(id, data),

    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.payables.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.payables.detail(id) });

      // Snapshot current data
      const previousPayable = queryClient.getQueryData<Payable>(queryKeys.payables.detail(id));
      const previousPayables = queryClient.getQueriesData<PaginatedResponse<Payable>>({
        queryKey: queryKeys.payables.all,
      });

      // Optimistically update payable detail
      queryClient.setQueryData<Payable>(queryKeys.payables.detail(id), (old) => {
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
              payableId: id,
              amountPaid: data.amountPaid,
              paymentDate: data.paymentDate,
              paymentMethod: data.paymentMethod,
              notes: data.notes || null,
              transactionId: null,
              recordedBy: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              deletedAt: null,
              deletedBy: null,
              isDeleted: false,
            },
          ],
        };
      });

      // Optimistically update payable in all lists
      queryClient.setQueriesData<PaginatedResponse<Payable>>(
        { queryKey: queryKeys.payables.all },
        (old) => {
          // Only update if we have a valid PaginatedResponse with data array
          if (!old || !old.data || !Array.isArray(old.data)) return old;

          return {
            ...old,
            data: old.data.map((payable) => {
              if (payable.id !== id) return payable;

              const newRemainingAmount = Number(payable.remainingAmount) - Number(data.amountPaid);
              const newStatus =
                newRemainingAmount <= 0
                  ? 'PAID'
                  : newRemainingAmount < payable.originalAmount
                    ? 'PARTIAL'
                    : payable.status;

              return {
                ...payable,
                remainingAmount: Math.max(0, newRemainingAmount),
                status: newStatus,
                updatedAt: new Date().toISOString(),
              };
            }),
          };
        }
      );

      return { previousPayable, previousPayables };
    },

    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousPayable) {
        queryClient.setQueryData(queryKeys.payables.detail(id), context.previousPayable);
      }
      if (context?.previousPayables) {
        context.previousPayables.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Note: Error toast shown by global API interceptor
    },

    onSuccess: (result, variables) => {
      // Invalidate payables and transactions (backend creates transaction for payment)
      queryClient.invalidateQueries({ queryKey: queryKeys.payables.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.payables.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });

      // Invalidate dashboard (payable payment affects stats)
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });

      // Show success toast
      const formattedAmount = new Intl.NumberFormat('ar-IQ', {
        style: 'currency',
        currency: 'IQD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(variables.data.amountPaid);

      if (result?.updatedPayable?.status === 'PAID') {
        toast.success(`✅ تم دفع الحساب بالكامل!`);
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
 * usePayableFilters Hook
 * Custom hook for managing payable filter state
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
 * } = usePayableFilters();
 *
 * // Update single filter
 * setFilter('status', 'ACTIVE');
 *
 * // Update multiple filters
 * setFilters({ status: 'PARTIAL', contactId: 'supplier-id' });
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
 * const { data } = usePayables(filters);
 * ```
 */
export const usePayableFilters = (initialFilters?: Partial<PayableQueryFilters>) => {
  const [filters, setFiltersState] = useState<PayableQueryFilters>(initialFilters || {});

  /**
   * Set all filters at once
   */
  const setFilters = useCallback((newFilters: Partial<PayableQueryFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Set a single filter
   */
  const setFilter = useCallback(
    <K extends keyof PayableQueryFilters>(key: K, value: PayableQueryFilters[K]) => {
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
   * Set date range (for payable creation date)
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
 * useActivePayables Hook
 * Query only active payables (no payments made)
 *
 * @param filters - Optional additional filters
 * @returns Query result with active payables
 */
export const useActivePayables = (filters?: Omit<PayableQueryFilters, 'status'>) => {
  return usePayables({ ...filters, status: 'ACTIVE' });
};

/**
 * usePaidPayables Hook
 * Query only paid payables (fully paid)
 *
 * @param filters - Optional additional filters
 * @returns Query result with paid payables
 */
export const usePaidPayables = (filters?: Omit<PayableQueryFilters, 'status'>) => {
  return usePayables({ ...filters, status: 'PAID' });
};

/**
 * usePartialPayables Hook
 * Query only partial payables (some payments made)
 *
 * @param filters - Optional additional filters
 * @returns Query result with partial payables
 */
export const usePartialPayables = (filters?: Omit<PayableQueryFilters, 'status'>) => {
  return usePayables({ ...filters, status: 'PARTIAL' });
};
