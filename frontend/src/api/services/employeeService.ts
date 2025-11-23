/**
 * Employee Service
 * Employee CRUD operations, salary payments, and salary increases
 *
 * Endpoints:
 * - GET /employees?filters → PaginatedResponse<Employee>
 * - GET /employees/:id → Employee
 * - POST /employees → Employee (CreateEmployeeDto)
 * - PATCH /employees/:id → Employee (UpdateEmployeeDto)
 * - DELETE /employees/:id → void
 * - POST /employees/:id/resign → Employee
 * - GET /employees/active/:branchId → Employee[]
 * - POST /employees/:id/salary-payments → SalaryPayment
 * - GET /employees/:id/salary-payments → SalaryPayment[]
 * - POST /employees/:id/salary-increases → SalaryIncrease
 * - GET /employees/:id/salary-increases → SalaryIncrease[]
 *
 * All types match backend DTOs exactly. No any types.
 */

import apiClient from '../apiClient';
import type {
  Employee,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  CreateSalaryPaymentInput,
  RecordSalaryIncreaseInput,
  CreateBonusInput,
  ResignEmployeeInput,
  SalaryPayment,
  SalaryIncrease,
  Bonus,
  PayrollSummary,
  EmployeeFilters,
} from '#/entity';
import type { PaginatedResponse } from '#/api';

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Employee API endpoints enum
 * Centralized endpoint definitions
 */
export enum EmployeeApiEndpoints {
  Base = '/employees',
  ById = '/employees/:id',
  Active = '/employees/active/:branchId',
  Resign = '/employees/:id/resign',
  SalaryPayments = '/employees/:id/salary-payments',
  SalaryIncreases = '/employees/:id/salary-increases',
  PayrollSummary = '/employees/branch/:branchId/payroll-summary',
  RecentIncreases = '/employees/branch/:branchId/recent-increases',
}

// ============================================
// EMPLOYEE SERVICE METHODS
// ============================================

/**
 * Get all employees with pagination and filters
 * GET /employees
 *
 * Supports filtering by:
 * - status: EmployeeStatus (ACTIVE | RESIGNED)
 * - branchId: UUID (accountants auto-filtered to their branch)
 * - search: string (searches name, position)
 * - page: number (default: 1)
 * - limit: number (default: 20)
 *
 * Backend behavior:
 * - Accountants: Auto-filtered to their assigned branch
 * - Admins: Can filter by any branch or see all
 * - Soft-deleted employees excluded automatically
 * - Results ordered by hireDate DESC
 *
 * @param filters - Optional query filters
 * @returns PaginatedResponse<Employee> with employees and pagination meta
 * @throws ApiError on 401 (not authenticated)
 */
export const getAll = (
  filters?: EmployeeFilters
): Promise<PaginatedResponse<Employee>> => {
  return apiClient.get<PaginatedResponse<Employee>>({
    url: EmployeeApiEndpoints.Base,
    params: filters,
  });
};

/**
 * Get single employee by ID
 * GET /employees/:id
 *
 * Backend validation:
 * - Accountants can only access employees from their branch
 * - Admins can access any employee
 * - Soft-deleted employees are excluded
 *
 * @param id - Employee UUID
 * @returns Employee with branch, creator, salaryPayments, and salaryIncreases relations
 * @throws ApiError on 401, 403 (wrong branch), 404 (not found or deleted)
 */
export const getOne = (id: string): Promise<Employee> => {
  return apiClient.get<Employee>({
    url: `/employees/${id}`,
  });
};

/**
 * Create new employee
 * POST /employees
 *
 * Backend validation (from CreateEmployeeDto):
 * - name: Required, max 200 chars
 * - position: Required, max 100 chars
 * - baseSalary: Required, > 0
 * - allowance: Optional, >= 0 (defaults to 0)
 * - hireDate: Required, ISO date string, not in future
 * - branchId: Required for Admins, auto-assigned for Accountants
 * - status: Optional, defaults to ACTIVE
 *
 * Backend behavior:
 * - Admins must provide branchId
 * - Accountants use their assigned branch
 * - Creates audit log entry
 *
 * @param data - CreateEmployeeInput matching backend DTO
 * @returns Created Employee with relations
 * @throws ApiError on 400 (validation), 401, 404 (branch not found)
 */
export const create = (data: CreateEmployeeInput): Promise<Employee> => {
  return apiClient.post<Employee>({
    url: EmployeeApiEndpoints.Base,
    data,
  });
};

/**
 * Update employee
 * PATCH /employees/:id
 *
 * Backend validation (from UpdateEmployeeDto):
 * - All fields optional
 * - name: max 200 chars
 * - position: max 100 chars
 * - baseSalary: > 0
 * - allowance: >= 0
 * - hireDate: ISO date string, not in future
 * - status: ACTIVE | RESIGNED
 *
 * Backend behavior:
 * - Accountants can only update employees from their branch
 * - Creates audit log entry with old/new comparison
 *
 * @param id - Employee UUID
 * @param data - UpdateEmployeeInput (partial update)
 * @returns Updated Employee with relations
 * @throws ApiError on 400 (validation), 401, 403 (wrong branch), 404
 */
export const update = (id: string, data: UpdateEmployeeInput): Promise<Employee> => {
  return apiClient.put<Employee>({
    url: `/employees/${id}`,
    data,
  });
};

/**
 * Soft delete employee
 * DELETE /employees/:id
 *
 * Backend behavior:
 * - Sets deletedAt timestamp (soft delete)
 * - Preserves employee data for reports
 * - Accountants can only delete employees from their branch
 * - Creates audit log entry
 *
 * @param id - Employee UUID
 * @returns void
 * @throws ApiError on 401, 403 (wrong branch), 404
 */
export const deleteEmployee = (id: string): Promise<void> => {
  return apiClient.delete<void>({
    url: `/employees/${id}`,
  });
};

/**
 * Resign employee
 * POST /employees/:id/resign
 *
 * Backend validation (from ResignEmployeeDto):
 * - resignDate: Required, ISO date string, not in future
 *
 * Backend behavior:
 * - Sets status to RESIGNED
 * - Sets resignDate field
 * - Validates employee not already resigned
 * - Creates audit log entry
 *
 * @param id - Employee UUID
 * @param data - ResignEmployeeInput with resignDate
 * @returns Updated Employee with RESIGNED status
 * @throws ApiError on 400 (already resigned), 401, 403, 404
 */
export const resign = (id: string, data: ResignEmployeeInput): Promise<Employee> => {
  return apiClient.post<Employee>({
    url: `/employees/${id}/resign`,
    data,
  });
};

/**
 * Get active employees for branch
 * GET /employees/active/:branchId
 *
 * Backend behavior:
 * - Returns only ACTIVE status employees
 * - Excludes soft-deleted employees
 * - Accountants can only access their branch
 * - Results ordered by name ASC
 * - Returns minimal fields (id, name, position, baseSalary, allowance)
 *
 * @param branchId - Branch UUID
 * @returns Array of active employees (minimal select)
 * @throws ApiError on 401, 403 (wrong branch)
 */
export const getActive = (branchId: string): Promise<Employee[]> => {
  return apiClient.get<Employee[]>({
    url: `/employees/active/${branchId}`,
  });
};

/**
 * Record salary payment
 * POST /employees/:id/salary-payments
 *
 * Backend validation (from CreateSalaryPaymentDto):
 * - amount: Required, > 0
 * - paymentDate: Required, ISO date string, not in future
 * - notes: Optional, text
 *
 * Backend behavior:
 * - Creates SalaryPayment record
 * - Auto-creates linked Transaction (EXPENSE, category='salaries')
 * - Uses Prisma transaction for atomicity
 * - Sets Transaction.employeeVendorName to employee.name
 * - Accountants can only create for employees in their branch
 * - Creates audit log entry
 *
 * @param employeeId - Employee UUID
 * @param data - CreateSalaryPaymentInput
 * @returns Created SalaryPayment with employee, transaction, and recorder relations
 * @throws ApiError on 400 (validation), 401, 403, 404 (employee not found)
 */
export const recordSalaryPayment = (
  employeeId: string,
  data: CreateSalaryPaymentInput,
): Promise<SalaryPayment> => {
  return apiClient.post<SalaryPayment>({
    url: `/employees/${employeeId}/salary-payments`,
    data,
  });
};

/**
 * Get salary payment history for employee
 * GET /employees/:id/salary-payments?startDate&endDate
 *
 * Supports filtering by:
 * - startDate: ISO date string (inclusive)
 * - endDate: ISO date string (inclusive)
 *
 * Backend behavior:
 * - Returns payments ordered by paymentDate DESC
 * - Excludes soft-deleted payments
 * - Accountants can only access employees from their branch
 *
 * @param employeeId - Employee UUID
 * @param startDate - Optional start date filter
 * @param endDate - Optional end date filter
 * @returns Array of SalaryPayment with relations
 * @throws ApiError on 401, 403, 404
 */
export const getPaymentHistory = (
  employeeId: string,
  startDate?: string,
  endDate?: string,
): Promise<SalaryPayment[]> => {
  return apiClient.get<SalaryPayment[]>({
    url: `/employees/${employeeId}/salary-payments`,
    params: { startDate, endDate },
  });
};

/**
 * Record salary increase
 * POST /employees/:id/salary-increases
 *
 * Backend validation (from RecordSalaryIncreaseDto):
 * - newSalary: Required, > 0
 * - effectiveDate: Required, ISO date string
 * - reason: Optional, text
 *
 * Backend behavior:
 * - Creates SalaryIncrease record
 * - Auto-updates Employee.baseSalary to newSalary
 * - Calculates increaseAmount (newSalary - oldSalary)
 * - Validates newSalary >= oldSalary (no decreases)
 * - Uses Prisma transaction for atomicity
 * - Creates audit log entry
 *
 * @param employeeId - Employee UUID
 * @param data - RecordSalaryIncreaseInput
 * @returns Created SalaryIncrease with employee and recorder relations
 * @throws ApiError on 400 (new salary less than old), 401, 403, 404
 */
export const recordSalaryIncrease = (
  employeeId: string,
  data: RecordSalaryIncreaseInput,
): Promise<SalaryIncrease> => {
  return apiClient.post<SalaryIncrease>({
    url: `/employees/${employeeId}/salary-increases`,
    data,
  });
};

/**
 * Get salary increase history for employee
 * GET /employees/:id/salary-increases
 *
 * Backend behavior:
 * - Returns increases ordered by effectiveDate DESC
 * - Accountants can only access employees from their branch
 *
 * @param employeeId - Employee UUID
 * @returns Array of SalaryIncrease with relations
 * @throws ApiError on 401, 403, 404
 */
export const getIncreaseHistory = (employeeId: string): Promise<SalaryIncrease[]> => {
  return apiClient.get<SalaryIncrease[]>({
    url: `/employees/${employeeId}/salary-increases`,
  });
};

/**
 * Record a bonus for employee
 * POST /employees/:id/bonuses
 *
 * Request body:
 * - amount: Required, number > 0
 * - bonusDate: Required, ISO date string
 * - reason: Optional, text
 *
 * Backend behavior:
 * - Creates Bonus record
 * - Auto-creates linked Transaction (EXPENSE, category='bonuses')
 * - Uses Prisma transaction for atomicity
 * - Creates audit log entry
 *
 * @param employeeId - Employee UUID
 * @param data - CreateBonusInput
 * @returns Created Bonus with employee, transaction, and recorder relations
 * @throws ApiError on 400 (amount <= 0), 401, 403, 404
 */
export const createBonus = (
  employeeId: string,
  data: CreateBonusInput,
): Promise<Bonus> => {
  return apiClient.post<Bonus>({
    url: `/employees/${employeeId}/bonuses`,
    data,
  });
};

/**
 * Get bonus history for employee
 * GET /employees/:id/bonuses?startDate&endDate
 *
 * Supports filtering by:
 * - startDate: ISO date string (inclusive)
 * - endDate: ISO date string (inclusive)
 *
 * Backend behavior:
 * - Returns bonuses ordered by bonusDate DESC
 * - Excludes soft-deleted bonuses
 * - Accountants can only access employees from their branch
 *
 * @param employeeId - Employee UUID
 * @param startDate - Optional start date filter
 * @param endDate - Optional end date filter
 * @returns Array of Bonus with relations
 * @throws ApiError on 401, 403, 404
 */
export const getBonusHistory = (
  employeeId: string,
  startDate?: string,
  endDate?: string,
): Promise<Bonus[]> => {
  return apiClient.get<Bonus[]>({
    url: `/employees/${employeeId}/bonuses`,
    params: { startDate, endDate },
  });
};

/**
 * Delete a bonus
 * DELETE /employees/bonuses/:id
 *
 * Backend behavior:
 * - Soft deletes bonus (sets deletedAt)
 * - Soft deletes linked transaction (if exists)
 * - Uses Prisma transaction for atomicity
 * - Creates audit log entry
 * - Accountants can only delete bonuses from their branch
 *
 * @param id - Bonus UUID
 * @returns void
 * @throws ApiError on 401, 403 (wrong branch), 404 (not found or already deleted)
 */
export const deleteBonus = (id: string): Promise<void> => {
  return apiClient.delete<void>({
    url: `/employees/bonuses/${id}`,
  });
};

/**
 * Get payroll summary for branch
 * GET /employees/branch/:branchId/payroll-summary?startDate&endDate
 *
 * Supports filtering by:
 * - startDate: ISO date string (inclusive)
 * - endDate: ISO date string (inclusive)
 *
 * Backend behavior:
 * - Calculates total paid, payment count
 * - Groups by employee with totals
 * - Excludes soft-deleted payments
 * - Accountants can only access their branch
 *
 * @param branchId - Branch UUID
 * @param startDate - Optional start date filter
 * @param endDate - Optional end date filter
 * @returns PayrollSummary with breakdown by employee
 * @throws ApiError on 401, 403
 */
export const getPayrollSummary = (
  branchId: string,
  startDate?: string,
  endDate?: string,
): Promise<PayrollSummary> => {
  return apiClient.get<PayrollSummary>({
    url: `/employees/branch/${branchId}/payroll-summary`,
    params: { startDate, endDate },
  });
};

/**
 * Get recent salary increases for branch
 * GET /employees/branch/:branchId/recent-increases?limit
 *
 * Supports filtering by:
 * - limit: number (default: 10, max recent increases to return)
 *
 * Backend behavior:
 * - Returns most recent increases ordered by effectiveDate DESC
 * - Excludes soft-deleted employees
 * - Accountants can only access their branch
 *
 * @param branchId - Branch UUID
 * @param limit - Max number of increases to return (default: 10)
 * @returns Array of recent SalaryIncrease with relations
 * @throws ApiError on 401, 403
 */
export const getRecentIncreases = (
  branchId: string,
  limit?: number,
): Promise<SalaryIncrease[]> => {
  return apiClient.get<SalaryIncrease[]>({
    url: `/employees/branch/${branchId}/recent-increases`,
    params: { limit },
  });
};

/**
 * Soft delete salary payment
 * DELETE /employees/salary-payments/:id
 *
 * Backend behavior:
 * - Soft deletes SalaryPayment (sets deletedAt)
 * - Also soft deletes linked Transaction
 * - Uses Prisma transaction for atomicity
 * - Accountants can only delete payments for employees in their branch
 * - Creates audit log entry
 *
 * @param id - SalaryPayment UUID
 * @returns void
 * @throws ApiError on 401, 403, 404
 */
export const deleteSalaryPayment = (id: string): Promise<void> => {
  return apiClient.delete<void>({
    url: `/employees/salary-payments/${id}`,
  });
};

// ============================================
// DEFAULT EXPORT
// ============================================

/**
 * Default export with all employee service methods
 * Can be imported as: import employeeService from '@/api/services/employeeService'
 */
export default {
  getAll,
  getOne,
  create,
  update,
  delete: deleteEmployee,
  resign,
  getActive,
  recordSalaryPayment,
  getPaymentHistory,
  recordSalaryIncrease,
  getIncreaseHistory,
  getPayrollSummary,
  getRecentIncreases,
  deleteSalaryPayment,
  createBonus,
  getBonusHistory,
  deleteBonus,
};
