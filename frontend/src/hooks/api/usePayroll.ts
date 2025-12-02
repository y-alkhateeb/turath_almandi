/**
 * Payroll React Query Hooks
 * Hooks for payroll management, adjustments, and salary payments
 *
 * Backend Endpoints (payroll.controller.ts):
 * - POST /payroll/adjustments → Create adjustment
 * - GET /payroll/employee/:employeeId/salary-details → Get salary details
 * - POST /payroll/pay-salary → Pay salary
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';

/**
 * Salary details response
 * Matches backend PayrollService.getEmployeeSalaryDetails response
 */
interface SalaryDetailsResponse {
  employeeId: string;
  employeeName: string;
  baseSalary: number;
  allowance: number;
  totalSalary: number;
  adjustments: {
    advances: number;
    bonuses: number;
    deductions: number;
    total: number;
  };
  netSalary: number;
  pendingAdjustments: Array<{
    id: string;
    type: 'BONUS' | 'DEDUCTION' | 'ADVANCE';
    amount: number;
    date: string;
    description: string | null;
    status: string;
  }>;
}

/**
 * Create adjustment input
 * Matches backend CreateAdjustmentDto exactly
 */
interface CreateAdjustmentInput {
  employeeId: string;
  type: 'BONUS' | 'DEDUCTION' | 'ADVANCE';
  amount: number;
  date: string;
  description?: string;
}

/**
 * Pay salary input
 * Matches backend PaySalaryDto exactly
 */
interface PaySalaryInput {
  employeeId: string;
  salaryMonth: string; // YYYY-MM format
  paymentDate: string;
  paymentMethod: 'CASH';
  notes?: string;
}

/**
 * Fetch employee salary details for a specific month
 */
export function useEmployeeSalaryDetails(employeeId: string, month: string) {
  return useQuery({
    queryKey: ['payroll', 'salary-details', employeeId, month],
    queryFn: async () => {
      return apiClient.get<SalaryDetailsResponse>({ 
        url: `/payroll/employee/${employeeId}/salary-details?month=${month}`
      });
    },
    enabled: !!employeeId && !!month,
  });
}

/**
 * Create payroll adjustment (advance, bonus, deduction)
 */
export function useCreateAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAdjustmentInput) => {
      return apiClient.post({ 
        url: '/payroll/adjustments',
        data,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['payroll', 'salary-details', variables.employeeId] 
      });
      toast.success('تم إضافة التسوية بنجاح');
    },
    onError: () => {
      toast.error('فشل إضافة التسوية');
    },
  });
}

/**
 * Pay employee salary
 */
export function usePaySalary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PaySalaryInput) => {
      return apiClient.post({ 
        url: '/payroll/pay-salary',
        data,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['payroll', 'salary-details', variables.employeeId] 
      });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('تم صرف الراتب بنجاح');
    },
    onError: () => {
      toast.error('فشل صرف الراتب');
    },
  });
}
