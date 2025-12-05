/**
 * Transactions React Query Hooks
 * Hooks for fetching and managing transactions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';
import type { Transaction, TransactionFilters, CreateTransactionInput, UpdateTransactionInput } from '#/entity';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Fetch paginated transactions list with filters
 */
export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', 'list', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.type) params.append('type', filters.type);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.employeeId) params.append('employeeId', filters.employeeId);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const url = queryString ? `/transactions?${queryString}` : '/transactions';

      return apiClient.get<PaginatedResponse<Transaction>>({ url });
    },
  });
}

/**
 * Fetch single transaction by ID
 */
export function useTransaction(id: string) {
  return useQuery({
    queryKey: ['transactions', 'detail', id],
    queryFn: async () => {
      return apiClient.get<Transaction>({ url: `/transactions/${id}` });
    },
    enabled: !!id,
  });
}

/**
 * Create new transaction
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTransactionInput) => {
      return apiClient.post<Transaction>({ 
        url: '/transactions',
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('تم إنشاء المعاملة بنجاح');
    },
    onError: () => {
      toast.error('فشل إنشاء المعاملة');
    },
  });
}

/**
 * Create transaction with inventory (multi-item support)
 */
export function useCreateTransactionWithInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      return apiClient.post<Transaction>({ 
        url: '/transactions/with-inventory',
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['payables'] });
      toast.success('تم إنشاء المعاملة بنجاح');
    },
    onError: () => {
      toast.error('فشل إنشاء المعاملة');
    },
  });
}

/**
 * Update transaction
 */
export function useUpdateTransaction(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateTransactionInput) => {
      return apiClient.put<Transaction>({ 
        url: `/transactions/${id}`,
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('تم تحديث المعاملة بنجاح');
    },
    onError: () => {
      toast.error('فشل تحديث المعاملة');
    },
  });
}

/**
 * Delete transaction
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete({ url: `/transactions/${id}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('تم حذف المعاملة بنجاح');
    },
    onError: () => {
      toast.error('فشل حذف المعاملة');
    },
  });
}
