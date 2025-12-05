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
import type { Employee, EmployeeAdjustment } from '@/types/entity';

/**
 * Backend salary details response
 * Matches backend PayrollService.getEmployeeSalaryDetails response exactly
 */
interface SalaryDetailsResponse {
  employee: Employee;
  salaryMonth: string;
  baseSalary: number;
  allowance: number;
  grossSalary: number;
  pendingAdjustments: EmployeeAdjustment[];
  summary: {
    totalBonuses: number;
    totalDeductions: number;
    totalAdvances: number;
    netSalary: number;
  };
}

/**
 * Transformed salary details response for frontend use
 * This is the transformed version that components consume
 */
interface TransformedSalaryDetailsResponse {
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
  pendingAdjustments: EmployeeAdjustment[];
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
 * Transform backend salary details response to frontend format
 * Type-safe transformation without using any
 */
function transformSalaryDetailsResponse(
  backendResponse: SalaryDetailsResponse,
  employeeId: string
): TransformedSalaryDetailsResponse {
  const { employee, baseSalary, allowance, grossSalary, pendingAdjustments, summary } = backendResponse;

  return {
    employeeId: employee.id ?? employeeId,
    employeeName: employee.name ?? '',
    baseSalary: baseSalary ?? 0,
    allowance: allowance ?? 0,
    totalSalary: grossSalary ?? 0,
    adjustments: {
      bonuses: summary.totalBonuses ?? 0,
      deductions: summary.totalDeductions ?? 0,
      advances: summary.totalAdvances ?? 0,
      total: (summary.totalBonuses ?? 0) - (summary.totalDeductions ?? 0) - (summary.totalAdvances ?? 0),
    },
    netSalary: summary.netSalary ?? grossSalary ?? 0,
    pendingAdjustments: pendingAdjustments ?? [],
  };
}

/**
 * Fetch employee salary details for a specific month
 */
export function useEmployeeSalaryDetails(employeeId: string, month: string) {
  return useQuery({
    queryKey: ['payroll', 'salary-details', employeeId, month],
    queryFn: async () => {
      const backendResponse = await apiClient.get<SalaryDetailsResponse>({ 
        url: `/payroll/employee/${employeeId}/salary-details?month=${month}`
      });
      
      return transformSalaryDetailsResponse(backendResponse, employeeId);
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
