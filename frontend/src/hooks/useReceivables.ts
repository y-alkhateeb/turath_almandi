/**
 * useReceivables Hooks
 * React Query hooks for receivable management (accounts receivable)
 *
 * Features:
 * - Paginated receivables query with comprehensive filters
 * - Receivable summary statistics
 * - Create/Update/Delete mutations with optimistic updates
 * - Special useCollectReceivable mutation with optimistic updates
 * - Auto-invalidation of receivables and transactions caches
 * - Filter state management hook
 * - Arabic toast messages
 * - Full error handling and strict typing
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import receivableService from '@/api/services/receivableService';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { useAuth } from './useAuth';
import type { Receivable, CreateReceivableInput, UpdateReceivableInput, CollectReceivableInput } from '#/entity';
import type { PaginatedResponse, ReceivableQueryFilters, ReceivableSummaryResponse } from '#/api';
import { ApiError } from '@/api/apiClient';

// ============================================
// QUERY HOOKS
// ============================================

/**
 * useReceivables Hook
 * Query paginated receivables with filters
 * Auto-filters for accountants to show only their branch's receivables
 *
 * @param filters - Optional ReceivableQueryFilters (status, contactId, branchId, dates, page, limit)
 * @returns Query result with paginated receivables (including payments array)
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useReceivables({
 *   status: 'ACTIVE',
 *   page: 1,
 *   limit: 20,
 * });
 * const receivables = data?.data || [];
 * const totalPages = data?.meta.totalPages || 0;
 * ```
 */
export const useReceivables = (filters?: ReceivableQueryFilters) => {
  const { user, isAccountant } = useAuth();

  // Auto-filter accountants to their branch
  const appliedFilters: ReceivableQueryFilters = {
    ...filters,
    branchId: isAccountant && user?.branchId ? user.branchId : filters?.branchId,
  };

  return useQuery<PaginatedResponse<Receivable>, ApiError>({
    queryKey: queryKeys.receivables.list(appliedFilters),
    queryFn: () => receivableService.getAll(appliedFilters),
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });
};

/**
 * useReceivable Hook
 * Query single receivable by ID
 * Returns receivable with full payments array
 *
 * @param id - Receivable UUID
 * @param options - Query options (enabled, etc.)
 * @returns Query result with receivable data including payments
 *
 * @example
 * ```tsx
 * const { data: receivable, isLoading } = useReceivable(receivableId);
 * if (receivable) {
 *   console.log(receivable.contact.name, receivable.remainingAmount);
 *   console.log('Payments:', receivable.payments);
 * }
 * ```
 */
export const useReceivable = (
  id: string,
  options?: {
    enabled?: boolean;
  }
) => {
  return useQuery<Receivable, ApiError>({
    queryKey: queryKeys.receivables.detail(id),
    queryFn: () => receivableService.getOne(id),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    enabled: options?.enabled ?? !!id,
  });
};

/**
 * useReceivableSummary Hook
 * Query receivable statistics and summary
 *
 * @param branchId - Optional branch UUID (accountants auto-filtered)
 * @returns Query result with receivable statistics
 *
 * @example
 * ```tsx
 * const { data: summary } = useReceivableSummary('branch-id');
 * console.log(summary?.total, summary?.totalAmount);
 * ```
 */
export const useReceivableSummary = (branchId?: string) => {
  const { user, isAccountant } = useAuth();

  // Auto-filter accountants to their branch
  const filters = {
    branchId: isAccountant && user?.branchId ? user.branchId : branchId,
  };

  return useQuery<ReceivableSummaryResponse, ApiError>({
    queryKey: queryKeys.receivables.summary(filters.branchId),
    queryFn: () => receivableService.getSummary(filters),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * useCreateReceivable Hook
 * Mutation to create new receivable with optimistic update
 * Invalidates receivables and transactions caches
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const createReceivable = useCreateReceivable();
 *
 * const handleCreate = async () => {
 *   try {
 *     await createReceivable.mutateAsync({
 *       contactId: 'customer-id',
 *       amount: 3000,
 *       date: new Date().toISOString(),
 *       dueDate: '2025-12-31',
 *       description: 'فاتورة بيع',
 *     });
 *   } catch (error) {
 *     // Error already handled with toast
 *   }
 * };
 * ```
 */
export const useCreateReceivable = () => {
  const queryClient = useQueryClient();

  return useMutation<Receivable, ApiError, CreateReceivableInput>({
    mutationFn: receivableService.create,

    // Optimistic update
    onMutate: async (newReceivable) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.receivables.all });

      // Snapshot current data
      const previousReceivables = queryClient.getQueriesData<PaginatedResponse<Receivable>>({
        queryKey: queryKeys.receivables.all,
      });

      // Optimistically update all receivable lists
      queryClient.setQueriesData<PaginatedResponse<Receivable>>(
        { queryKey: queryKeys.receivables.all },
        (old) => {
          // Only update if we have a valid PaginatedResponse with data array
          if (!old || !old.data || !Array.isArray(old.data)) return old;

          // Create temporary receivable with optimistic ID
          const tempReceivable: Receivable = {
            id: `temp-${Date.now()}`,
            contactId: newReceivable.contactId,
            originalAmount: newReceivable.amount,
            remainingAmount: newReceivable.amount,
            date: newReceivable.date,
            dueDate: newReceivable.dueDate || null,
            status: 'ACTIVE',
            description: newReceivable.description || null,
            invoiceNumber: newReceivable.invoiceNumber || null,
            notes: newReceivable.notes || null,
            linkedSaleTransactionId: null,
            branchId: newReceivable.branchId || null,
            createdBy: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
            deletedBy: null,
            isDeleted: false,
            payments: [],
          } as Receivable;

          return {
            ...old,
            data: [tempReceivable, ...old.data],
            meta: {
              ...old.meta,
              total: old.meta.total + 1,
            },
          };
        }
      );

      return { previousReceivables };
    },

    onError: (_error, _newReceivable, context) => {
      // Rollback on error
      if (context?.previousReceivables) {
        context.previousReceivables.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Note: Error toast shown by global API interceptor
    },

    onSuccess: (_data, variables) => {
      // Invalidate receivables and transactions
      queryClient.invalidateQueries({ queryKey: queryKeys.receivables.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });

      // Invalidate dashboard (new receivable affects stats)
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });

      // Show success toast
      const formattedAmount = new Intl.NumberFormat('ar-IQ', {
        style: 'currency',
        currency: 'IQD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(variables.amount);

      toast.success(`تم إضافة حساب مدين بقيمة ${formattedAmount}`);
    },
  });
};

/**
 * useUpdateReceivable Hook
 * Mutation to update existing receivable with optimistic update
 * Note: Cannot update amount - use useCollectReceivable for collections
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const updateReceivable = useUpdateReceivable();
 *
 * const handleUpdate = async () => {
 *   await updateReceivable.mutateAsync({
 *     id: receivableId,
 *     data: { dueDate: '2026-01-31' },
 *   });
 * };
 * ```
 */
export const useUpdateReceivable = () => {
  const queryClient = useQueryClient();

  return useMutation<Receivable, ApiError, { id: string; data: UpdateReceivableInput }>({
    mutationFn: ({ id, data }) => receivableService.update(id, data),

    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.receivables.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.receivables.detail(id) });

      // Snapshot current data
      const previousReceivable = queryClient.getQueryData<Receivable>(queryKeys.receivables.detail(id));
      const previousReceivables = queryClient.getQueriesData<PaginatedResponse<Receivable>>({
        queryKey: queryKeys.receivables.all,
      });

      // Optimistically update receivable detail
      queryClient.setQueryData<Receivable>(queryKeys.receivables.detail(id), (old) => {
        if (!old) return old;
        return { ...old, ...data, updatedAt: new Date().toISOString() };
      });

      // Optimistically update receivable in all lists
      queryClient.setQueriesData<PaginatedResponse<Receivable>>(
        { queryKey: queryKeys.receivables.all },
        (old) => {
          // Only update if we have a valid PaginatedResponse with data array
          if (!old || !old.data || !Array.isArray(old.data)) return old;

          return {
            ...old,
            data: old.data.map((receivable) =>
              receivable.id === id ? { ...receivable, ...data, updatedAt: new Date().toISOString() } : receivable
            ),
          };
        }
      );

      return { previousReceivable, previousReceivables };
    },

    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousReceivable) {
        queryClient.setQueryData(queryKeys.receivables.detail(id), context.previousReceivable);
      }
      if (context?.previousReceivables) {
        context.previousReceivables.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Note: Error toast shown by global API interceptor
    },

    onSuccess: (updatedReceivable) => {
      // Invalidate receivables
      queryClient.invalidateQueries({ queryKey: queryKeys.receivables.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.receivables.detail(updatedReceivable.id),
      });

      // Invalidate dashboard (receivable stats may have changed)
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });

      // Show success toast
      toast.success('تم تحديث الحساب المدين بنجاح');
    },
  });
};

/**
 * useDeleteReceivable Hook
 * Mutation to delete receivable with optimistic update
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const deleteReceivable = useDeleteReceivable();
 *
 * const handleDelete = async () => {
 *   if (confirm('هل أنت متأكد من حذف هذا الحساب المدين؟')) {
 *     await deleteReceivable.mutateAsync(receivableId);
 *   }
 * };
 * ```
 */
export const useDeleteReceivable = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: receivableService.delete,

    // Optimistic update
    onMutate: async (deletedId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.receivables.all });

      // Snapshot current data
      const previousReceivables = queryClient.getQueriesData<PaginatedResponse<Receivable>>({
        queryKey: queryKeys.receivables.all,
      });

      // Optimistically remove receivable from all lists
      queryClient.setQueriesData<PaginatedResponse<Receivable>>(
        { queryKey: queryKeys.receivables.all },
        (old) => {
          // Only update if we have a valid PaginatedResponse with data array
          if (!old || !old.data || !Array.isArray(old.data)) return old;

          return {
            ...old,
            data: old.data.filter((receivable) => receivable.id !== deletedId),
            meta: {
              ...old.meta,
              total: old.meta.total - 1,
            },
          };
        }
      );

      // Remove receivable detail from cache
      queryClient.removeQueries({
        queryKey: queryKeys.receivables.detail(deletedId),
      });

      return { previousReceivables };
    },

    onError: (error, _deletedId, context) => {
      // Rollback on error
      if (context?.previousReceivables) {
        context.previousReceivables.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Note: Error toast shown by global API interceptor
    },

    onSuccess: () => {
      // Invalidate receivables
      queryClient.invalidateQueries({ queryKey: queryKeys.receivables.all });

      // Invalidate dashboard (receivable stats affected)
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });

      // Show success toast
      toast.success('تم حذف الحساب المدين بنجاح');
    },
  });
};

/**
 * useCollectReceivable Hook
 * Mutation to record collection/payment from customer
 * Special handling: invalidates receivables AND transactions (backend creates transaction)
 * Optimistic update reduces remainingAmount and adds payment to payments array
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const collectReceivable = useCollectReceivable();
 *
 * const handleCollection = async () => {
 *   await collectReceivable.mutateAsync({
 *     id: receivableId,
 *     data: {
 *       amountPaid: 1500,
 *       paymentDate: new Date().toISOString(),
 *       paymentMethod: 'CASH',
 *       notes: 'دفعة من العميل',
 *     },
 *   });
 * };
 * ```
 */
export const useCollectReceivable = () => {
  const queryClient = useQueryClient();

  return useMutation<any, ApiError, { id: string; data: CollectReceivableInput }>({
    mutationFn: ({ id, data }) => receivableService.collectReceivable(id, data),

    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.receivables.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.receivables.detail(id) });

      // Snapshot current data
      const previousReceivable = queryClient.getQueryData<Receivable>(queryKeys.receivables.detail(id));
      const previousReceivables = queryClient.getQueriesData<PaginatedResponse<Receivable>>({
        queryKey: queryKeys.receivables.all,
      });

      // Optimistically update receivable detail
      queryClient.setQueryData<Receivable>(queryKeys.receivables.detail(id), (old) => {
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
              receivableId: id,
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

      // Optimistically update receivable in all lists
      queryClient.setQueriesData<PaginatedResponse<Receivable>>(
        { queryKey: queryKeys.receivables.all },
        (old) => {
          // Only update if we have a valid PaginatedResponse with data array
          if (!old || !old.data || !Array.isArray(old.data)) return old;

          return {
            ...old,
            data: old.data.map((receivable) => {
              if (receivable.id !== id) return receivable;

              const newRemainingAmount = Number(receivable.remainingAmount) - Number(data.amountPaid);
              const newStatus =
                newRemainingAmount <= 0
                  ? 'PAID'
                  : newRemainingAmount < receivable.originalAmount
                    ? 'PARTIAL'
                    : receivable.status;

              return {
                ...receivable,
                remainingAmount: Math.max(0, newRemainingAmount),
                status: newStatus,
                updatedAt: new Date().toISOString(),
              };
            }),
          };
        }
      );

      return { previousReceivable, previousReceivables };
    },

    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousReceivable) {
        queryClient.setQueryData(queryKeys.receivables.detail(id), context.previousReceivable);
      }
      if (context?.previousReceivables) {
        context.previousReceivables.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Note: Error toast shown by global API interceptor
    },

    onSuccess: (result, variables) => {
      // Invalidate receivables and transactions (backend creates transaction for collection)
      queryClient.invalidateQueries({ queryKey: queryKeys.receivables.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.receivables.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });

      // Invalidate dashboard (receivable collection affects stats)
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });

      // Show success toast
      const formattedAmount = new Intl.NumberFormat('ar-IQ', {
        style: 'currency',
        currency: 'IQD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(variables.data.amountPaid);

      if (result?.updatedReceivable?.status === 'PAID') {
        toast.success(`✅ تم تحصيل الحساب بالكامل!`);
      } else {
        toast.success(`تم تسجيل تحصيل ${formattedAmount}`);
      }
    },
  });
};

// ============================================
// FILTER MANAGEMENT HOOK
// ============================================

/**
 * useReceivableFilters Hook
 * Custom hook for managing receivable filter state
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
 * } = useReceivableFilters();
 *
 * // Update single filter
 * setFilter('status', 'ACTIVE');
 *
 * // Update multiple filters
 * setFilters({ status: 'PARTIAL', contactId: 'customer-id' });
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
 * const { data } = useReceivables(filters);
 * ```
 */
export const useReceivableFilters = (initialFilters?: Partial<ReceivableQueryFilters>) => {
  const [filters, setFiltersState] = useState<ReceivableQueryFilters>(initialFilters || {});

  /**
   * Set all filters at once
   */
  const setFilters = useCallback((newFilters: Partial<ReceivableQueryFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Set a single filter
   */
  const setFilter = useCallback(
    <K extends keyof ReceivableQueryFilters>(key: K, value: ReceivableQueryFilters[K]) => {
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
   * Set date range (for receivable creation date)
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
 * useActiveReceivables Hook
 * Query only active receivables (no payments collected)
 *
 * @param filters - Optional additional filters
 * @returns Query result with active receivables
 */
export const useActiveReceivables = (filters?: Omit<ReceivableQueryFilters, 'status'>) => {
  return useReceivables({ ...filters, status: 'ACTIVE' });
};

/**
 * usePaidReceivables Hook
 * Query only paid receivables (fully collected)
 *
 * @param filters - Optional additional filters
 * @returns Query result with paid receivables
 */
export const usePaidReceivables = (filters?: Omit<ReceivableQueryFilters, 'status'>) => {
  return useReceivables({ ...filters, status: 'PAID' });
};

/**
 * usePartialReceivables Hook
 * Query only partial receivables (some payments collected)
 *
 * @param filters - Optional additional filters
 * @returns Query result with partial receivables
 */
export const usePartialReceivables = (filters?: Omit<ReceivableQueryFilters, 'status'>) => {
  return useReceivables({ ...filters, status: 'PARTIAL' });
};
