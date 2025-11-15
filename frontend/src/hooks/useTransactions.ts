import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsService } from '../services/transactions.service';
import { toast } from '../utils/toast';
import type {
  Transaction,
  CreateTransactionInput,
  TransactionFilters,
} from '../types/transactions.types';

/**
 * Query Keys for Transactions
 * Centralized query key management for cache invalidation
 */
export const transactionsKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionsKeys.all, 'list'] as const,
  list: (filters?: TransactionFilters) => [...transactionsKeys.lists(), filters] as const,
  details: () => [...transactionsKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionsKeys.details(), id] as const,
};

/**
 * Hook to fetch all transactions with optional filters
 */
export const useTransactions = (filters?: TransactionFilters) => {
  return useQuery({
    queryKey: transactionsKeys.list(filters),
    queryFn: () => transactionsService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch a single transaction
 */
export const useTransaction = (id: string) => {
  return useQuery({
    queryKey: transactionsKeys.detail(id),
    queryFn: () => transactionsService.getOne(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to create a new transaction
 * Includes optimistic updates and cache invalidation
 */
export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransactionInput) => transactionsService.create(data),

    onMutate: async (newTransaction) => {
      // Cancel any outgoing refetches to avoid optimistic update being overwritten
      await queryClient.cancelQueries({ queryKey: transactionsKeys.lists() });

      // Snapshot the previous value
      const previousTransactions = queryClient.getQueryData<Transaction[]>(
        transactionsKeys.lists()
      );

      // Optimistically update to the new value
      queryClient.setQueryData<Transaction[]>(
        transactionsKeys.lists(),
        (old = []) => [
          {
            id: 'temp-' + Date.now(),
            amount: newTransaction.amount,
            type: newTransaction.type,
            paymentMethod: newTransaction.paymentMethod || null,
            category: newTransaction.category || null,
            date: newTransaction.date,
            employeeVendorName: newTransaction.employeeVendorName || null,
            notes: newTransaction.notes || null,
            branchId: 'temp',
            currency: 'IQD',
            createdBy: 'temp',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          ...old,
        ]
      );

      // Return context with snapshot for rollback
      return { previousTransactions };
    },

    onError: (error: any, _newTransaction, context) => {
      // Rollback on error
      if (context?.previousTransactions) {
        queryClient.setQueryData(
          transactionsKeys.lists(),
          context.previousTransactions
        );
      }

      // Show error message
      const errorMessage =
        error?.response?.data?.message || 'حدث خطأ أثناء إضافة العملية';
      toast.error(errorMessage, 4000);
    },

    onSuccess: (_data, variables) => {
      // Show success message based on transaction type
      const message = variables.type === 'INCOME'
        ? 'تم إضافة الإيراد بنجاح'
        : 'تم إضافة المصروف بنجاح';
      toast.success(message);
    },

    onSettled: () => {
      // Refetch to ensure data is in sync with backend
      queryClient.invalidateQueries({ queryKey: transactionsKeys.lists() });
    },
  });
};

/**
 * Hook to update a transaction
 */
export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTransactionInput> }) =>
      transactionsService.update(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: transactionsKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: transactionsKeys.lists() });

      const previousTransaction = queryClient.getQueryData(transactionsKeys.detail(id));

      // Optimistically update the detail
      queryClient.setQueryData<Transaction>(
        transactionsKeys.detail(id),
        (old) => {
          if (!old) return old;
          return { ...old, ...data, updatedAt: new Date().toISOString() };
        }
      );

      return { previousTransaction, id };
    },

    onError: (error: any, _variables, context) => {
      if (context?.previousTransaction && context?.id) {
        queryClient.setQueryData(
          transactionsKeys.detail(context.id),
          context.previousTransaction
        );
      }

      const errorMessage =
        error?.response?.data?.message || 'حدث خطأ أثناء تحديث العملية';
      toast.error(errorMessage, 4000);
    },

    onSuccess: () => {
      toast.success('تم تحديث العملية بنجاح');
    },

    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: transactionsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: transactionsKeys.lists() });
    },
  });
};

/**
 * Hook to delete a transaction
 */
export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionsService.delete(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: transactionsKeys.lists() });

      const previousTransactions = queryClient.getQueryData<Transaction[]>(
        transactionsKeys.lists()
      );

      // Optimistically remove from list
      queryClient.setQueryData<Transaction[]>(
        transactionsKeys.lists(),
        (old = []) => old.filter((transaction) => transaction.id !== id)
      );

      return { previousTransactions, id };
    },

    onError: (error: any, _id, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(
          transactionsKeys.lists(),
          context.previousTransactions
        );
      }

      const errorMessage =
        error?.response?.data?.message || 'حدث خطأ أثناء حذف العملية';
      toast.error(errorMessage, 4000);
    },

    onSuccess: () => {
      toast.success('تم حذف العملية بنجاح');
    },

    onSettled: (_data, _error, id) => {
      queryClient.invalidateQueries({ queryKey: transactionsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: transactionsKeys.lists() });
    },
  });
};
