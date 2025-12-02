/**
 * Payables React Query Hooks
 * Hooks for managing accounts payable (money we owe to suppliers)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient, { ApiError } from '@/api/apiClient';
import type { 
  AccountPayable, 
  CreatePayableDto, 
  UpdatePayableDto, 
  PayPayableDto, 
  QueryPayablesDto,
  PayablesSummary
} from '@/types/payables.types';

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Fetch paginated payables list with filters
 */
export function usePayables(filters?: QueryPayablesDto) {
  return useQuery<PaginatedResponse<AccountPayable>, ApiError>({
    queryKey: ['payables', 'list', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.status) params.append('status', filters.status);
      if (filters?.contactId) params.append('contactId', filters.contactId);
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const url = queryString ? `/payables?${queryString}` : '/payables';

      return apiClient.get<PaginatedResponse<AccountPayable>>({ url });
    },
  });
}

/**
 * Fetch single payable by ID
 */
export function usePayable(id: string) {
  return useQuery<AccountPayable, ApiError>({
    queryKey: ['payables', 'detail', id],
    queryFn: async () => {
      return apiClient.get<AccountPayable>({ url: `/payables/${id}` });
    },
    enabled: !!id,
  });
}

/**
 * Fetch payables summary
 */
export function usePayablesSummary(branchId?: string) {
  return useQuery<PayablesSummary, ApiError>({
    queryKey: ['payables', 'summary', branchId],
    queryFn: async () => {
      const url = branchId ? `/payables/summary?branchId=${branchId}` : '/payables/summary';
      return apiClient.get<PayablesSummary>({ url });
    },
  });
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Create a new payable
 */
export function useCreatePayable() {
  const queryClient = useQueryClient();

  return useMutation<AccountPayable, ApiError, CreatePayableDto>({
    mutationFn: async (data) => {
      return apiClient.post({ url: '/payables', data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payables'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('تم إنشاء الذمة الدائنة بنجاح');
    },
    onError: (error) => {
      // Error is handled globally, but we can add specific logic here if needed
    }
  });
}

/**
 * Update an existing payable
 */
export function useUpdatePayable() {
  const queryClient = useQueryClient();

  return useMutation<AccountPayable, ApiError, { id: string; data: UpdatePayableDto }>({
    mutationFn: async ({ id, data }) => {
      return apiClient.patch({ url: `/payables/${id}`, data });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payables'] });
      queryClient.invalidateQueries({ queryKey: ['payables', 'detail', data.id] });
      toast.success('تم تحديث الذمة الدائنة بنجاح');
    },
  });
}

/**
 * Delete a payable
 */
export function useDeletePayable() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: async (id) => {
      return apiClient.delete({ url: `/payables/${id}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payables'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('تم حذف الذمة الدائنة بنجاح');
    },
  });
}

/**
 * Pay/record payment for payable
 */
export function usePayPayable() {
  const queryClient = useQueryClient();

  return useMutation<any, ApiError, { id: string; data: PayPayableDto }>({
    mutationFn: async ({ id, data }) => {
      return apiClient.post({ 
        url: `/payables/${id}/pay`,
        data,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payables'] });
      queryClient.invalidateQueries({ queryKey: ['payables', 'detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('تم تسجيل الدفعة بنجاح');
    },
  });
}
