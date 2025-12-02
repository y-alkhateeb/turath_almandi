/**
 * Employees React Query Hooks
 * Hooks for fetching and managing employees
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';
import type { Employee, EmployeeFilters, CreateEmployeeInput, UpdateEmployeeInput } from '#/entity';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Fetch paginated employees list with filters
 */
export function useEmployees(filters?: EmployeeFilters) {
  return useQuery({
    queryKey: ['employees', 'list', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.status) params.append('status', filters.status);
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const url = queryString ? `/employees?${queryString}` : '/employees';

      return apiClient.get<PaginatedResponse<Employee>>({ url });
    },
  });
}

/**
 * Fetch active employees only (for dropdowns)
 */
export function useActiveEmployees() {
  return useQuery({
    queryKey: ['employees', 'active'],
    queryFn: async () => {
      return apiClient.get<PaginatedResponse<Employee>>({ 
        url: '/employees?status=ACTIVE&limit=1000'
      });
    },
    select: (data) => data.data, // Return just the array
  });
}

/**
 * Fetch single employee by ID
 */
export function useEmployee(id: string) {
  return useQuery({
    queryKey: ['employees', 'detail', id],
    queryFn: async () => {
      return apiClient.get<Employee>({ url: `/employees/${id}` });
    },
    enabled: !!id,
  });
}

/**
 * Create new employee
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEmployeeInput) => {
      return apiClient.post<Employee>({ 
        url: '/employees',
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('تم إضافة الموظف بنجاح');
    },
    onError: () => {
      toast.error('فشل إضافة الموظف');
    },
  });
}

/**
 * Update employee
 */
export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateEmployeeInput) => {
      return apiClient.put<Employee>({ 
        url: `/employees/${id}`,
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('تم تحديث بيانات الموظف بنجاح');
    },
    onError: () => {
      toast.error('فشل تحديث بيانات الموظف');
    },
  });
}

/**
 * Delete employee
 */
export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete({ url: `/employees/${id}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('تم حذف الموظف بنجاح');
    },
    onError: () => {
      toast.error('فشل حذف الموظف');
    },
  });
}
