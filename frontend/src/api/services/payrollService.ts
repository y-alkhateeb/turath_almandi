import apiClient from '@/api/apiClient';
import {
  CreateAdjustmentInput,
  EmployeeAdjustment,
  PaySalaryInput,
  SalaryDetails,
  SalaryPayment,
} from '@/types/entity';

export const payrollService = {
  // Create a new adjustment (bonus/deduction)
  createAdjustment: async (data: CreateAdjustmentInput): Promise<EmployeeAdjustment> => {
    return apiClient.post<EmployeeAdjustment>({
      url: '/payroll/adjustments',
      data,
    });
  },

  // Get salary details for a specific employee and month
  getSalaryDetails: async (employeeId: string, month: string): Promise<SalaryDetails> => {
    return apiClient.get<SalaryDetails>({
      url: `/payroll/employee/${employeeId}/salary-details`,
      params: { month },
    });
  },

  // Pay salary
  paySalary: async (data: PaySalaryInput): Promise<SalaryPayment> => {
    return apiClient.post<SalaryPayment>({
      url: '/payroll/pay-salary',
      data,
    });
  },
};
