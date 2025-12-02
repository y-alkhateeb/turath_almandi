/**
 * Receivables React Query Hooks
 * Hooks for managing accounts receivable (money owed to us by customers)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient, { ApiError } from '@/api/apiClient';
import type { 
  AccountReceivable, 
  CreateReceivableDto, 
  UpdateReceivableDto, 
  CollectReceivableDto, 
  QueryReceivablesDto,
  ReceivablesSummary
} from '@/types/receivables.types';

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
 * Fetch paginated receivables list with filters
 */
export function useReceivables(filters?: QueryReceivablesDto) {
  return useQuery<PaginatedResponse<AccountReceivable>, ApiError>({
    queryKey: ['receivables', 'list', filters],
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
      const url = queryString ? `/receivables?${queryString}` : '/receivables';

      return apiClient.get<PaginatedResponse<AccountReceivable>>({ url });
    },
  });
}

/**
 * Fetch single receivable by ID
 */
export function useReceivable(id: string) {
  return useQuery<AccountReceivable, ApiError>({
    queryKey: ['receivables', 'detail', id],
    queryFn: async () => {
      return apiClient.get<AccountReceivable>({ url: `/receivables/${id}` });
    },
    enabled: !!id,
  });
}

/**
 * Fetch receivables summary
 */
export function useReceivablesSummary(branchId?: string) {
  return useQuery<ReceivablesSummary, ApiError>({
    queryKey: ['receivables', 'summary', branchId],
    queryFn: async () => {
      const url = branchId ? `/receivables/summary?branchId=${branchId}` : '/receivables/summary';
      return apiClient.get<ReceivablesSummary>({ url });
    },
  });
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Create a new receivable
 */
export function useCreateReceivable() {
  const queryClient = useQueryClient();

  return useMutation<AccountReceivable, ApiError, CreateReceivableDto>({
    mutationFn: async (data) => {
      return apiClient.post({ url: '/receivables', data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('تم إنشاء الذمة المدينة بنجاح');
    },
  });
}

/**
 * Update an existing receivable
 */
export function useUpdateReceivable() {
  const queryClient = useQueryClient();

  return useMutation<AccountReceivable, ApiError, { id: string; data: UpdateReceivableDto }>({
    mutationFn: async ({ id, data }) => {
      return apiClient.patch({ url: `/receivables/${id}`, data });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
      queryClient.invalidateQueries({ queryKey: ['receivables', 'detail', data.id] });
      toast.success('تم تحديث الذمة المدينة بنجاح');
    },
  });
}

/**
 * Delete a receivable
 */
export function useDeleteReceivable() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: async (id) => {
      return apiClient.delete({ url: `/receivables/${id}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('تم حذف الذمة المدينة بنجاح');
    },
  });
}

/**
 * Collect/record payment for receivable
 */
export function useCollectReceivable() {
  const queryClient = useQueryClient();

  return useMutation<any, ApiError, { id: string; data: CollectReceivableDto }>({
    mutationFn: async ({ id, data }) => {
      return apiClient.post({ 
        url: `/receivables/${id}/collect`,
        data,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
      queryClient.invalidateQueries({ queryKey: ['receivables', 'detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('تم تسجيل التحصيل بنجاح');
    },
  });
}
