/**
 * useEmployees Hooks
 * React Query hooks for employee management with optimistic updates
 *
 * Features:
 * - Employee queries (all, single, active, payroll summary)
 * - Create/Update/Delete/Resign mutations with optimistic updates
 * - Automatic cache invalidation
 * - Arabic toast messages
 * - Full error handling and strict typing
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import employeeService from '@/api/services/employeeService';
import { queryKeys } from '@/hooks/queries/queryKeys';
import type {
  Employee,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  CreateSalaryPaymentInput,
  CreateSalaryIncreaseInput,
  CreateBonusInput,
  CreateAdvanceInput,
  RecordDeductionInput,
  SalaryPayment,
  SalaryIncrease,
  Bonus,
  EmployeeAdvance,
  EmployeeAdvancesResponse,
  BranchAdvancesSummaryResponse,
  PayrollSummary,
} from '@/types';
import { ApiError } from '@/api/apiClient';

// ============================================
// QUERY HOOKS
// ============================================

/**
 * useEmployees Hook
 * Query all employees
 *
 * @returns Query result with employees array
 *
 * @example
 * ```tsx
 * const { data: employees, isLoading } = useEmployees();
 * ```
 */
export const useEmployees = () => {
  return useQuery<Employee[], ApiError>({
    queryKey: queryKeys.employees.all,
    queryFn: async () => {
      const response = await employeeService.getAll();
      return response.data; // Extract data array from paginated response
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
};

/**
 * useEmployee Hook
 * Query single employee by ID
 *
 * @param id - Employee UUID
 * @returns Query result with employee data
 *
 * @example
 * ```tsx
 * const { data: employee, isLoading } = useEmployee(employeeId);
 * ```
 */
export const useEmployee = (id: string) => {
  return useQuery<Employee, ApiError>({
    queryKey: queryKeys.employees.detail(id),
    queryFn: () => employeeService.getOne(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
};

/**
 * useActiveEmployees Hook
 * Query only active employees (status = ACTIVE)
 *
 * @returns Query result with active employees array
 *
 * @example
 * ```tsx
 * const { data: activeEmployees } = useActiveEmployees();
 * ```
 */
export const useActiveEmployees = (branchId?: string) => {
  return useQuery<Employee[], ApiError>({
    queryKey: ['employees', 'active', branchId],
    queryFn: () => employeeService.getActive(branchId || ''),
    enabled: branchId !== undefined,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
};

/**
 * useActiveEmployeesByBranch Hook
 * Query active employees for a specific branch
 *
 * @param branchId - Branch UUID
 * @returns Query result with active employees array
 *
 * @example
 * ```tsx
 * const { data: employees } = useActiveEmployeesByBranch(branchId);
 * ```
 */
export const useActiveEmployeesByBranch = (branchId: string | null | undefined) => {
  return useQuery<Employee[], ApiError>({
    queryKey: ['employees', 'active', branchId],
    queryFn: () => employeeService.getActive(branchId!),
    enabled: !!branchId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
};

/**
 * usePayrollSummary Hook
 * Query payroll summary for given month/year
 *
 * @param month - Month (1-12)
 * @param year - Year (e.g., 2025)
 * @returns Query result with payroll summary
 *
 * @example
 * ```tsx
 * const { data: summary } = usePayrollSummary(11, 2025);
 * ```
 */
export const usePayrollSummary = (month: number, year: number) => {
  return useQuery<PayrollSummary, ApiError>({
    queryKey: queryKeys.employees.payroll(month, year),
    queryFn: () => employeeService.getPayrollSummary(month, year),
    enabled: !!month && !!year,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
};

/**
 * useSalaryPaymentHistory Hook
 * Query salary payment history for an employee
 *
 * @param employeeId - Employee UUID
 * @returns Query result with salary payments array
 *
 * @example
 * ```tsx
 * const { data: payments } = useSalaryPaymentHistory(employeeId);
 * ```
 */
export const useSalaryPaymentHistory = (employeeId: string) => {
  return useQuery<SalaryPayment[], ApiError>({
    queryKey: queryKeys.employees.salaryPayments(employeeId),
    queryFn: () => employeeService.getPaymentHistory(employeeId),
    enabled: !!employeeId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
};

/**
 * useSalaryIncreaseHistory Hook
 * Query salary increase history for an employee
 *
 * @param employeeId - Employee UUID
 * @returns Query result with salary increases array
 *
 * @example
 * ```tsx
 * const { data: increases } = useSalaryIncreaseHistory(employeeId);
 * ```
 */
export const useSalaryIncreaseHistory = (employeeId: string) => {
  return useQuery<SalaryIncrease[], ApiError>({
    queryKey: queryKeys.employees.salaryIncreases(employeeId),
    queryFn: () => employeeService.getIncreaseHistory(employeeId),
    enabled: !!employeeId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * useCreateEmployee Hook
 * Mutation to create new employee
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const createEmployee = useCreateEmployee();
 *
 * const handleCreate = async () => {
 *   await createEmployee.mutateAsync({
 *     name: 'أحمد محمد',
 *     position: 'طباخ',
 *     baseSalary: 1000,
 *     branchId: 'branch-id',
 *   });
 * };
 * ```
 */
export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation<Employee, ApiError, CreateEmployeeInput>({
    mutationFn: (data: CreateEmployeeInput) => employeeService.create(data),

    onSuccess: () => {
      // Invalidate employee queries
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.active });

      toast.success('تم إضافة الموظف بنجاح');
    },

    onError: () => {
      // Error toast shown by global API interceptor
    },
  });
};

/**
 * useUpdateEmployee Hook
 * Mutation to update existing employee
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const updateEmployee = useUpdateEmployee();
 *
 * const handleUpdate = async () => {
 *   await updateEmployee.mutateAsync({
 *     id: employeeId,
 *     data: { position: 'رئيس طباخين' },
 *   });
 * };
 * ```
 */
export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation<Employee, ApiError, { id: string; data: UpdateEmployeeInput }>({
    mutationFn: ({ id, data }) => employeeService.update(id, data),

    onSuccess: (updatedEmployee) => {
      // Invalidate employee queries
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.active });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(updatedEmployee.id) });

      toast.success('تم تحديث بيانات الموظف بنجاح');
    },

    onError: () => {
      // Error toast shown by global API interceptor
    },
  });
};

/**
 * useDeleteEmployee Hook
 * Mutation to delete employee (soft delete)
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const deleteEmployee = useDeleteEmployee();
 *
 * const handleDelete = async () => {
 *   await deleteEmployee.mutateAsync(employeeId);
 * };
 * ```
 */
export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id: string) => employeeService.delete(id),

    onSuccess: () => {
      // Invalidate employee queries
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.active });

      toast.success('تم حذف الموظف بنجاح');
    },

    onError: () => {
      // Error toast shown by global API interceptor
    },
  });
};

/**
 * useResignEmployee Hook
 * Mutation to mark employee as resigned
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const resignEmployee = useResignEmployee();
 *
 * const handleResign = async () => {
 *   await resignEmployee.mutateAsync({
 *     id: employeeId,
 *     resignDate: '2025-11-22',
 *   });
 * };
 * ```
 */
export const useResignEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation<Employee, ApiError, { id: string; resignDate: string }>({
    mutationFn: ({ id, resignDate }) => employeeService.resign(id, resignDate),

    onSuccess: (updatedEmployee) => {
      // Invalidate employee queries
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.active });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(updatedEmployee.id) });

      toast.success('تم تسجيل استقالة الموظف بنجاح');
    },

    onError: () => {
      // Error toast shown by global API interceptor
    },
  });
};

/**
 * useRecordSalaryPayment Hook
 * Mutation to record salary payment (creates Transaction automatically)
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const recordPayment = useRecordSalaryPayment();
 *
 * const handlePayment = async () => {
 *   await recordPayment.mutateAsync({
 *     employeeId: employeeId,
 *     data: {
 *       amount: 1000,
 *       paymentDate: '2025-11-22',
 *       notes: 'راتب شهر نوفمبر',
 *     },
 *   });
 * };
 * ```
 */
export const useRecordSalaryPayment = () => {
  const queryClient = useQueryClient();

  return useMutation<
    SalaryPayment,
    ApiError,
    { employeeId: string; data: CreateSalaryPaymentInput }
  >({
    mutationFn: ({ employeeId, data }) => employeeService.recordSalaryPayment(employeeId, data),

    onSuccess: (_, { employeeId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.salaryPayments(employeeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(employeeId) });
      queryClient.invalidateQueries({ queryKey: ['transactions'] }); // Refresh transactions list

      toast.success('تم تسجيل دفع الراتب بنجاح');
    },

    onError: () => {
      // Error toast shown by global API interceptor
    },
  });
};

/**
 * useDeleteSalaryPayment Hook
 * Mutation to delete salary payment (soft delete)
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const deletePayment = useDeleteSalaryPayment();
 *
 * const handleDelete = async () => {
 *   await deletePayment.mutateAsync({
 *     employeeId: employeeId,
 *     paymentId: paymentId,
 *   });
 * };
 * ```
 */
export const useDeleteSalaryPayment = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { employeeId: string; paymentId: string }>({
    mutationFn: ({ employeeId, paymentId }) =>
      employeeService.deleteSalaryPayment(employeeId, paymentId),

    onSuccess: (_, { employeeId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.salaryPayments(employeeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(employeeId) });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });

      toast.success('تم حذف دفعة الراتب بنجاح');
    },

    onError: () => {
      // Error toast shown by global API interceptor
    },
  });
};

/**
 * useRecordSalaryIncrease Hook
 * Mutation to record salary increase (updates Employee.baseSalary immediately)
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const recordIncrease = useRecordSalaryIncrease();
 *
 * const handleIncrease = async () => {
 *   await recordIncrease.mutateAsync({
 *     employeeId: employeeId,
 *     data: {
 *       previousSalary: 1000,
 *       newSalary: 1200,
 *       effectiveDate: '2025-11-22',
 *       reason: 'ترقية',
 *     },
 *   });
 * };
 * ```
 */
export const useRecordSalaryIncrease = () => {
  const queryClient = useQueryClient();

  return useMutation<
    SalaryIncrease,
    ApiError,
    { employeeId: string; data: CreateSalaryIncreaseInput }
  >({
    mutationFn: ({ employeeId, data }) => employeeService.recordSalaryIncrease(employeeId, data),

    onSuccess: (_, { employeeId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.salaryIncreases(employeeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(employeeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.active });

      toast.success('تم تسجيل الزيادة على الراتب بنجاح');
    },

    onError: () => {
      // Error toast shown by global API interceptor
    },
  });
};

/**
 * useCreateBonus Hook
 * Mutation to create a bonus for an employee
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const createBonus = useCreateBonus();
 *
 * const handleCreateBonus = async () => {
 *   await createBonus.mutateAsync({
 *     employeeId: 'employee-id',
 *     data: {
 *       amount: 500000,
 *       bonusDate: '2025-11-23',
 *       reason: 'أداء متميز',
 *     },
 *   });
 * };
 * ```
 */
export const useCreateBonus = () => {
  const queryClient = useQueryClient();

  return useMutation<Bonus, ApiError, { employeeId: string; data: CreateBonusInput }>({
    mutationFn: ({ employeeId, data }) => employeeService.createBonus(employeeId, data),

    onSuccess: (_, { employeeId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.bonuses(employeeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(employeeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });

      toast.success('تم إضافة المكافأة بنجاح');
    },

    onError: () => {
      // Error toast shown by global API interceptor
    },
  });
};

/**
 * useBonusHistory Hook
 * Query bonus history for an employee
 *
 * @param employeeId - Employee UUID
 * @param startDate - Optional start date filter
 * @param endDate - Optional end date filter
 * @returns Query result with bonuses array
 *
 * @example
 * ```tsx
 * const { data: bonuses } = useBonusHistory(employeeId);
 * ```
 */
export const useBonusHistory = (employeeId: string, startDate?: string, endDate?: string) => {
  return useQuery<Bonus[], ApiError>({
    queryKey: queryKeys.employees.bonuses(employeeId, startDate, endDate),
    queryFn: () => employeeService.getBonusHistory(employeeId, startDate, endDate),
    enabled: !!employeeId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
};

/**
 * useDeleteBonus Hook
 * Mutation to delete a bonus (soft delete)
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const deleteBonus = useDeleteBonus();
 *
 * const handleDelete = async (bonusId: string) => {
 *   await deleteBonus.mutateAsync({ id: bonusId, employeeId });
 * };
 * ```
 */
export const useDeleteBonus = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { id: string; employeeId: string }>({
    mutationFn: ({ id }) => employeeService.deleteBonus(id),

    onSuccess: (_, { employeeId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.bonuses(employeeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(employeeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });

      toast.success('تم حذف المكافأة بنجاح');
    },

    onError: () => {
      // Error toast shown by global API interceptor
    },
  });
};

// ============================================
// ADVANCE HOOKS (السلف)
// ============================================

/**
 * useEmployeeAdvances Hook
 * Query advances for a specific employee
 *
 * @param employeeId - Employee UUID
 * @returns Query result with advances and summary
 *
 * @example
 * ```tsx
 * const { data } = useEmployeeAdvances(employeeId);
 * // data.advances - Array of advances
 * // data.summary - Total, paid, remaining
 * ```
 */
export const useEmployeeAdvances = (employeeId: string) => {
  return useQuery<EmployeeAdvancesResponse, ApiError>({
    queryKey: queryKeys.employees.advances(employeeId),
    queryFn: () => employeeService.getEmployeeAdvances(employeeId),
    enabled: !!employeeId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
};

/**
 * useBranchAdvancesSummary Hook
 * Query advances summary for all employees in a branch
 *
 * @param branchId - Branch UUID
 * @returns Query result with branch advances summary
 *
 * @example
 * ```tsx
 * const { data } = useBranchAdvancesSummary(branchId);
 * // data.employees - Array of employee advance summaries
 * // data.totals - Branch-wide totals
 * ```
 */
export const useBranchAdvancesSummary = (branchId: string) => {
  return useQuery<BranchAdvancesSummaryResponse, ApiError>({
    queryKey: queryKeys.employees.branchAdvances(branchId),
    queryFn: () => employeeService.getBranchAdvancesSummary(branchId),
    enabled: !!branchId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
};

/**
 * useCreateAdvance Hook
 * Mutation to create a new advance for an employee
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const createAdvance = useCreateAdvance();
 *
 * const handleCreate = async () => {
 *   await createAdvance.mutateAsync({
 *     employeeId: 'employee-id',
 *     amount: 2000000, // 2 million IQD
 *     monthlyDeduction: 200000, // 200k monthly
 *     advanceDate: '2025-11-25',
 *     reason: 'سلفة شخصية',
 *   });
 * };
 * ```
 */
export const useCreateAdvance = () => {
  const queryClient = useQueryClient();

  return useMutation<EmployeeAdvance, ApiError, CreateAdvanceInput>({
    mutationFn: (data) => employeeService.createAdvance(data),

    onSuccess: (advance) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.advances(advance.employeeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(advance.employeeId) });

      // Show warning if advance exceeds 2 months salary
      if (advance.exceedsTwoMonthsSalary) {
        toast.warning('تحذير: مبلغ السلفة يتجاوز راتب شهرين!', {
          description: 'تم تسجيل السلفة بنجاح',
          duration: 5000,
        });
      } else {
        toast.success('تم تسجيل السلفة بنجاح');
      }
    },

    onError: () => {
      // Error toast shown by global API interceptor
    },
  });
};

/**
 * useRecordAdvanceDeduction Hook
 * Mutation to record a deduction from an advance
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const recordDeduction = useRecordAdvanceDeduction();
 *
 * const handleDeduction = async () => {
 *   await recordDeduction.mutateAsync({
 *     advanceId: 'advance-id',
 *     amount: 200000,
 *     deductionDate: '2025-11-25',
 *     salaryPaymentId: 'salary-payment-id', // optional
 *     notes: 'خصم شهر نوفمبر',
 *   });
 * };
 * ```
 */
export const useRecordAdvanceDeduction = () => {
  const queryClient = useQueryClient();

  return useMutation<
    EmployeeAdvance,
    ApiError,
    RecordDeductionInput & { employeeId: string }
  >({
    mutationFn: ({ employeeId, ...data }) => employeeService.recordAdvanceDeduction(data),

    onSuccess: (advance, { employeeId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.advances(employeeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(employeeId) });

      // Check if advance is fully paid
      if (advance.status === 'PAID') {
        toast.success('تم سداد السلفة بالكامل!', {
          description: 'المبلغ المتبقي: 0',
        });
      } else {
        toast.success('تم تسجيل الخصم بنجاح', {
          description: `المبلغ المتبقي: ${advance.remainingAmount.toLocaleString()}`,
        });
      }
    },

    onError: () => {
      // Error toast shown by global API interceptor
    },
  });
};

/**
 * useCancelAdvance Hook
 * Mutation to cancel an advance (only if no deductions made)
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const cancelAdvance = useCancelAdvance();
 *
 * const handleCancel = async () => {
 *   await cancelAdvance.mutateAsync({
 *     advanceId: 'advance-id',
 *     employeeId: 'employee-id',
 *   });
 * };
 * ```
 */
export const useCancelAdvance = () => {
  const queryClient = useQueryClient();

  return useMutation<EmployeeAdvance, ApiError, { advanceId: string; employeeId: string }>({
    mutationFn: ({ advanceId }) => employeeService.cancelAdvance(advanceId),

    onSuccess: (_, { employeeId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.advances(employeeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(employeeId) });

      toast.success('تم إلغاء السلفة بنجاح');
    },

    onError: () => {
      // Error toast shown by global API interceptor
    },
  });
};
