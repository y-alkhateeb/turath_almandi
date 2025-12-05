import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import employeeService from '@/api/services/employeeService';
import type {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  ResignEmployeeInput,
  EmployeeFilters,
} from '@/types';
import { toast } from 'sonner';

// Query Keys
export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (filters: EmployeeFilters) => [...employeeKeys.lists(), { ...filters }] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
  active: (branchId: string) => [...employeeKeys.all, 'active', branchId] as const,
};

// Hooks

/**
 * Hook to fetch employees with filters
 * Returns array of employees (no pagination)
 *
 * @param filters - Optional EmployeeFilters (status, branchId, search)
 * @returns Query result with array of employees
 */
export function useEmployees(filters: EmployeeFilters = {}) {
  return useQuery({
    queryKey: employeeKeys.list(filters),
    queryFn: () => employeeService.getAll(filters),
  });
}

/**
 * Hook to fetch a single employee by ID
 */
export function useEmployee(id: string) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: () => employeeService.getOne(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch active employees for a branch
 */
export function useActiveEmployees(branchId: string) {
  return useQuery({
    queryKey: employeeKeys.active(branchId),
    queryFn: () => employeeService.getActive(branchId),
    enabled: !!branchId,
  });
}

/**
 * Hook to create a new employee
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEmployeeInput) => employeeService.create(data),
    onSuccess: () => {
      toast.success('تمت الإضافة بنجاح', {
        description: 'تم إضافة الموظف الجديد بنجاح',
      });
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
    onError: (error: any) => {
      toast.error('خطأ في الإضافة', {
        description: error.response?.data?.message || 'حدث خطأ أثناء إضافة الموظف',
      });
    },
  });
}

/**
 * Hook to update an existing employee
 */
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeInput }) =>
      employeeService.update(id, data),
    onSuccess: (data) => {
      toast.success('تم التحديث بنجاح', {
        description: 'تم تحديث بيانات الموظف بنجاح',
      });
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
    onError: (error: any) => {
      toast.error('خطأ في التحديث', {
        description: error.response?.data?.message || 'حدث خطأ أثناء تحديث الموظف',
      });
    },
  });
}

/**
 * Hook to resign an employee
 */
export function useResignEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResignEmployeeInput }) =>
      employeeService.resign(id, data),
    onSuccess: (data) => {
      toast.success('تم تسجيل الاستقالة', {
        description: 'تم تسجيل استقالة الموظف بنجاح',
      });
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
    onError: (error: any) => {
      toast.error('خطأ', {
        description: error.response?.data?.message || 'حدث خطأ أثناء تسجيل الاستقالة',
      });
    },
  });
}

/**
 * Hook to delete an employee
 */
export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => employeeService.delete(id),
    onSuccess: () => {
      toast.success('تم الحذف بنجاح', {
        description: 'تم حذف الموظف بنجاح',
      });
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
    onError: (error: any) => {
      toast.error('خطأ في الحذف', {
        description: error.response?.data?.message || 'حدث خطأ أثناء حذف الموظف',
      });
    },
  });
}
