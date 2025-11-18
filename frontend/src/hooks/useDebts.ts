/**
 * useDebts Hooks
 * React Query hooks for debt management with pagination and payment tracking
 *
 * Features:
 * - Paginated debts query with comprehensive filters
 * - Debt detail with payments array
 * - Debt summary statistics
 * - Create debt mutation with optimistic updates
 * - Pay debt mutation with special payment handling
 * - Auto-invalidation of debts, notifications, and dashboard caches
 * - Filter state management hook
 * - Arabic toast messages
 * - Full error handling and strict typing
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import debtService from '@/api/services/debtService';
import { queryKeys } from '@/hooks/queries/queryKeys';
import type {
  Debt,
  CreateDebtInput,
  UpdateDebtInput,
  PayDebtInput,
} from '#/entity';
import type {
  PaginatedResponse,
  DebtQueryFilters,
  DebtSummaryResponse,
} from '#/api';
import { ApiError } from '@/api/apiClient';

// ============================================
// QUERY HOOKS
// ============================================

/**
 * useDebts Hook
 * Query paginated debts with filters
 *
 * @param filters - Optional DebtQueryFilters (status, branchId, dates, page, limit)
 * @returns Query result with paginated debts
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useDebts({
 *   status: 'ACTIVE',
 *   startDate: '2025-01-01',
 *   page: 1,
 *   limit: 20,
 * });
 * const debts = data?.data || [];
 * const totalPages = data?.meta.totalPages || 0;
 * ```
 */
export const useDebts = (filters?: DebtQueryFilters) => {
  return useQuery<PaginatedResponse<Debt>, ApiError>({
    queryKey: queryKeys.debts.list(filters),
    queryFn: () => debtService.getAll(filters),
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });
};

/**
 * useDebt Hook
 * Query single debt by ID (includes payments array)
 *
 * Backend returns debt with full payments array, ordered by paymentDate DESC
 *
 * @param id - Debt UUID
 * @param options - Query options (enabled, etc.)
 * @returns Query result with debt data including payments
 *
 * @example
 * ```tsx
 * const { data: debt, isLoading } = useDebt(debtId);
 * if (debt) {
 *   console.log(debt.remainingAmount, debt.payments?.length);
 * }
 * ```
 */
export const useDebt = (
  id: string,
  options?: {
    enabled?: boolean;
  },
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
 * Query debt summary statistics
 *
 * Returns aggregated metrics:
 * - totalDebts, activeDebts, paidDebts, partialDebts
 * - totalOwed, overdueDebts
 *
 * @param branchId - Optional branch UUID
 * @returns Query result with debt statistics
 *
 * @example
 * ```tsx
 * const { data: summary } = useDebtSummary('branch-id');
 * console.log(summary?.totalOwed, summary?.overdueDebts);
 * ```
 */
export const useDebtSummary = (branchId?: string) => {
  return useQuery<DebtSummaryResponse, ApiError>({
    queryKey: queryKeys.debts.summary(branchId),
    queryFn: () => debtService.getSummary(branchId ? { branchId } : undefined),
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
 * Invalidates debts, notifications, and dashboard caches
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
 *       creditorName: 'أحمد محمد',
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
          if (!old) return old;

          // Create temporary debt with optimistic ID
          const tempDebt: Debt = {
            id: `temp-${Date.now()}`,
            creditorName: newDebt.creditorName,
            originalAmount: newDebt.amount,
            remainingAmount: newDebt.amount,
            currency: newDebt.currency || 'USD',
            status: 'ACTIVE',
            date: newDebt.date,
            dueDate: newDebt.dueDate,
            notes: newDebt.notes || null,
            branchId: newDebt.branchId || '',
            createdBy: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
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
        },
      );

      return { previousDebts };
    },

    onError: (error, _newDebt, context) => {
      // Rollback on error
      if (context?.previousDebts) {
        context.previousDebts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Show error toast
      if (error.statusCode === 400) {
        toast.error('الرجاء التحقق من البيانات المدخلة. تاريخ الاستحقاق يجب أن يكون بعد تاريخ الدين');
      } else if (error.statusCode === 403) {
        toast.error('ليس لديك صلاحية لإضافة ديون');
      } else if (error.statusCode === 404) {
        toast.error('الفرع المحدد غير موجود');
      } else {
        toast.error('حدث خطأ أثناء إضافة الدين');
      }
    },

    onSuccess: (newDebt) => {
      // Invalidate debts, notifications, and dashboard
      queryClient.invalidateQueries({ queryKey: queryKeys.debts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });

      // Show success toast
      toast.success(`تم إضافة الدين للدائن "${newDebt.creditorName}" بنجاح`);
    },
  });
};

/**
 * useUpdateDebt Hook
 * Mutation to update existing debt with optimistic update
 *
 * Note: Cannot change amount, currency, or date (use payments to reduce debt)
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
 *     data: { dueDate: '2025-12-31', notes: 'تم التمديد' },
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
      const previousDebt = queryClient.getQueryData<Debt>(
        queryKeys.debts.detail(id),
      );
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
          if (!old) return old;

          return {
            ...old,
            data: old.data.map((debt) =>
              debt.id === id
                ? { ...debt, ...data, updatedAt: new Date().toISOString() }
                : debt,
            ),
          };
        },
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

      // Show error toast
      if (error.statusCode === 404) {
        toast.error('الدين غير موجود');
      } else if (error.statusCode === 400) {
        toast.error('الرجاء التحقق من البيانات المدخلة');
      } else if (error.statusCode === 403) {
        toast.error('ليس لديك صلاحية لتعديل الديون');
      } else if (error.statusCode === 409) {
        toast.error('لا يمكن تعديل دين مدفوع بالكامل');
      } else {
        toast.error('حدث خطأ أثناء تحديث الدين');
      }
    },

    onSuccess: (updatedDebt) => {
      // Invalidate debts and dashboard
      queryClient.invalidateQueries({ queryKey: queryKeys.debts.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.debts.detail(updatedDebt.id),
      });
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
 *   if (confirm('هل أنت متأكد من حذف هذا الدين؟')) {
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
          if (!old) return old;

          return {
            ...old,
            data: old.data.filter((debt) => debt.id !== deletedId),
            meta: {
              ...old.meta,
              total: old.meta.total - 1,
            },
          };
        },
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

      // Show error toast
      if (error.statusCode === 404) {
        toast.error('الدين غير موجود');
      } else if (error.statusCode === 409) {
        toast.error('لا يمكن حذف الدين لأنه يحتوي على دفعات مسجلة');
      } else if (error.statusCode === 403) {
        toast.error('ليس لديك صلاحية لحذف الديون');
      } else {
        toast.error('حدث خطأ أثناء حذف الدين');
      }
    },

    onSuccess: () => {
      // Invalidate debts, notifications, and dashboard
      queryClient.invalidateQueries({ queryKey: queryKeys.debts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });

      // Show success toast
      toast.success('تم حذف الدين بنجاح');
    },
  });
};

/**
 * usePayDebt Hook
 * Mutation to record payment towards a debt
 *
 * Special handling:
 * - Creates DebtPayment record
 * - Updates debt remainingAmount
 * - Auto-updates debt status (PAID, PARTIAL, OVERDUE)
 * - Creates notification for payment
 * - Invalidates debts, notifications, and dashboard caches
 * - Optimistic update with payment added to debt.payments array
 *
 * Backend behavior:
 * - Validates amount > 0 and <= remainingAmount
 * - Cannot pay fully paid debts (status = PAID)
 * - Updates status: PAID (remaining = 0), PARTIAL (0 < remaining < original)
 * - Emits WebSocket event for real-time updates
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const payDebt = usePayDebt();
 *
 * const handlePayment = async () => {
 *   await payDebt.mutateAsync({
 *     debtId: debtId,
 *     payment: {
 *       amount: 500,
 *       paymentDate: new Date().toISOString(),
 *       notes: 'دفعة جزئية',
 *     },
 *   });
 * };
 * ```
 */
export const usePayDebt = () => {
  const queryClient = useQueryClient();

  return useMutation<Debt, ApiError, { debtId: string; payment: PayDebtInput }>({
    mutationFn: ({ debtId, payment }) => debtService.payDebt(debtId, payment),

    // Optimistic update for payment
    onMutate: async ({ debtId, payment }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.debts.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.debts.detail(debtId) });

      // Snapshot current data
      const previousDebt = queryClient.getQueryData<Debt>(
        queryKeys.debts.detail(debtId),
      );
      const previousDebts = queryClient.getQueriesData<PaginatedResponse<Debt>>({
        queryKey: queryKeys.debts.all,
      });

      // Optimistically update debt detail with new payment
      queryClient.setQueryData<Debt>(queryKeys.debts.detail(debtId), (old) => {
        if (!old) return old;

        const newRemainingAmount = old.remainingAmount - payment.amount;
        const newStatus =
          newRemainingAmount === 0
            ? 'PAID'
            : newRemainingAmount < old.originalAmount
              ? 'PARTIAL'
              : old.status;

        // Create temporary payment with optimistic ID
        const tempPayment = {
          id: `temp-${Date.now()}`,
          debtId,
          amountPaid: payment.amount,
          currency: payment.currency || old.currency,
          paymentDate: payment.paymentDate,
          notes: payment.notes || null,
          recordedBy: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return {
          ...old,
          remainingAmount: newRemainingAmount,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          payments: [tempPayment, ...(old.payments || [])],
        };
      });

      // Optimistically update debt in all lists
      queryClient.setQueriesData<PaginatedResponse<Debt>>(
        { queryKey: queryKeys.debts.all },
        (old) => {
          if (!old) return old;

          return {
            ...old,
            data: old.data.map((debt) => {
              if (debt.id !== debtId) return debt;

              const newRemainingAmount = debt.remainingAmount - payment.amount;
              const newStatus =
                newRemainingAmount === 0
                  ? 'PAID'
                  : newRemainingAmount < debt.originalAmount
                    ? 'PARTIAL'
                    : debt.status;

              return {
                ...debt,
                remainingAmount: newRemainingAmount,
                status: newStatus,
                updatedAt: new Date().toISOString(),
              };
            }),
          };
        },
      );

      return { previousDebt, previousDebts };
    },

    onError: (error, { debtId }, context) => {
      // Rollback on error
      if (context?.previousDebt) {
        queryClient.setQueryData(queryKeys.debts.detail(debtId), context.previousDebt);
      }
      if (context?.previousDebts) {
        context.previousDebts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Show error toast
      if (error.statusCode === 404) {
        toast.error('الدين غير موجود');
      } else if (error.statusCode === 400) {
        const message = error.validationErrors?.[0] || error.message;
        if (message.includes('amount')) {
          toast.error('المبلغ المدفوع يجب أن يكون أكبر من صفر وأقل من أو يساوي المبلغ المتبقي');
        } else if (message.includes('paymentDate')) {
          toast.error('تاريخ الدفع لا يمكن أن يكون في المستقبل');
        } else {
          toast.error('الرجاء التحقق من البيانات المدخلة');
        }
      } else if (error.statusCode === 403) {
        toast.error('ليس لديك صلاحية لتسجيل دفعات');
      } else if (error.statusCode === 409) {
        toast.error('لا يمكن دفع دين مدفوع بالكامل');
      } else {
        toast.error('حدث خطأ أثناء تسجيل الدفعة');
      }
    },

    onSuccess: (updatedDebt, { payment }) => {
      // Invalidate debts, notifications, and dashboard
      queryClient.invalidateQueries({ queryKey: queryKeys.debts.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.debts.detail(updatedDebt.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });

      // Show success toast based on new status
      if (updatedDebt.status === 'PAID') {
        toast.success(
          `تم دفع الدين بالكامل! المبلغ المدفوع: ${payment.amount} ${payment.currency || updatedDebt.currency}`,
        );
      } else {
        toast.success(
          `تم تسجيل الدفعة بنجاح. المبلغ المتبقي: ${updatedDebt.remainingAmount} ${updatedDebt.currency}`,
        );
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
 *   setDueDateRange,
 *   setPage,
 * } = useDebtFilters();
 *
 * // Update single filter
 * setFilter('status', 'ACTIVE');
 *
 * // Update multiple filters
 * setFilters({ status: 'ACTIVE', branchId: 'branch-id' });
 *
 * // Set debt date range
 * setDateRange('2025-01-01', '2025-01-31');
 *
 * // Set due date range
 * setDueDateRange('2025-01-01', '2025-12-31');
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
  const [filters, setFiltersState] = useState<DebtQueryFilters>(
    initialFilters || {},
  );

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
    [],
  );

  /**
   * Reset all filters
   */
  const resetFilters = useCallback(() => {
    setFiltersState(initialFilters || {});
  }, [initialFilters]);

  /**
   * Set debt date range (creation date)
   */
  const setDateRange = useCallback((startDate?: string, endDate?: string) => {
    setFiltersState((prev) => ({ ...prev, startDate, endDate }));
  }, []);

  /**
   * Set due date range
   */
  const setDueDateRange = useCallback(
    (dueDateStart?: string, dueDateEnd?: string) => {
      setFiltersState((prev) => ({ ...prev, dueDateStart, dueDateEnd }));
    },
    [],
  );

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
 * Query only fully paid debts
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

/**
 * useDebtsDueSoon Hook
 * Query debts due within next 7 days
 *
 * @param filters - Optional additional filters
 * @returns Query result with debts due soon
 */
export const useDebtsDueSoon = (
  filters?: Omit<DebtQueryFilters, 'dueDateStart' | 'dueDateEnd'>,
) => {
  const today = new Date();
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(today.getDate() + 7);

  return useDebts({
    ...filters,
    dueDateStart: today.toISOString().split('T')[0],
    dueDateEnd: sevenDaysFromNow.toISOString().split('T')[0],
    status: 'ACTIVE',
  });
};
