import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debtsService } from '../services/debts.service';
import { toast } from '../utils/toast';
import type { Debt, CreateDebtInput, PayDebtInput } from '../types/debts.types';

/**
 * Query Keys for Debts
 * Centralized query key management for cache invalidation
 */
export const debtsKeys = {
  all: ['debts'] as const,
  lists: () => [...debtsKeys.all, 'list'] as const,
  list: () => [...debtsKeys.lists()] as const,
};

/**
 * Hook to fetch all debts
 * Accountants can only see debts from their branch
 */
export const useDebts = () => {
  return useQuery({
    queryKey: debtsKeys.list(),
    queryFn: () => debtsService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to create a new debt
 * Includes optimistic updates and cache invalidation
 */
export const useCreateDebt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDebtInput) => debtsService.create(data),

    onMutate: async (newDebt) => {
      // Cancel any outgoing refetches to avoid optimistic update being overwritten
      await queryClient.cancelQueries({ queryKey: debtsKeys.lists() });

      // Snapshot the previous value
      const previousDebts = queryClient.getQueryData<Debt[]>(debtsKeys.lists());

      // Optimistically update to the new value
      queryClient.setQueryData<Debt[]>(debtsKeys.lists(), (old = []) => [
        {
          id: 'temp-' + Date.now(),
          creditorName: newDebt.creditorName,
          originalAmount: newDebt.amount,
          remainingAmount: newDebt.amount,
          date: newDebt.date,
          dueDate: newDebt.dueDate,
          status: 'ACTIVE',
          notes: newDebt.notes || null,
          branchId: 'temp',
          createdBy: 'temp',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...old,
      ]);

      // Return context with snapshot for rollback
      return { previousDebts };
    },

    onError: (error: any, _newDebt, context) => {
      // Rollback on error
      if (context?.previousDebts) {
        queryClient.setQueryData(debtsKeys.lists(), context.previousDebts);
      }

      // Show error message
      const errorMessage =
        error?.response?.data?.message || 'حدث خطأ أثناء إضافة الدين';
      toast.error(errorMessage, 4000);
    },

    onSuccess: () => {
      // Show success message
      toast.success('تم إضافة الدين بنجاح');
    },

    onSettled: () => {
      // Refetch to ensure data is in sync with backend
      queryClient.invalidateQueries({ queryKey: debtsKeys.lists() });
    },
  });
};

/**
 * Hook to pay a debt
 * Creates a payment record and updates debt remaining_amount and status
 * Includes cache invalidation
 */
export const usePayDebt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ debtId, data }: { debtId: string; data: PayDebtInput }) =>
      debtsService.payDebt(debtId, data),

    onError: (error: any) => {
      // Show error message
      const errorMessage =
        error?.response?.data?.message || 'حدث خطأ أثناء دفع الدين';
      toast.error(errorMessage, 4000);
    },

    onSuccess: () => {
      // Show success message
      toast.success('تم دفع الدين بنجاح');
    },

    onSettled: () => {
      // Refetch to ensure data is in sync with backend
      queryClient.invalidateQueries({ queryKey: debtsKeys.lists() });
    },
  });
};
