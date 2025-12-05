/**
 * Employee Service
 * Employee CRUD operations
 *
 * Backend Endpoints (employees.controller.ts):
 * - POST /employees → Create employee
 * - GET /employees → List with filters (no pagination)
 * - GET /employees/active/:branchId → Active employees by branch
 * - GET /employees/:id → Get one employee
 * - PUT /employees/:id → Update employee
 * - DELETE /employees/:id → Delete employee
 * - POST /employees/:id/resign → Mark as resigned
 *
 * Note: Salary payments are handled by /payroll/* endpoints
 */

import apiClient from '../apiClient';
import type {
  Employee,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  ResignEmployeeInput,
  EmployeeFilters,
} from '#/entity';

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
}

// ============================================
// EMPLOYEE SERVICE METHODS
// ============================================

/**
 * Get all employees with filters
 * GET /employees
 *
 * Supports filtering by:
 * - status: EmployeeStatus (ACTIVE | RESIGNED)
 * - branchId: UUID (accountants auto-filtered to their branch)
 * - search: string (searches name, position)
 *
 * Backend behavior:
 * - Accountants: Auto-filtered to their assigned branch
 * - Admins: Can filter by any branch or see all
 * - Soft-deleted employees excluded automatically
 * - Results ordered by hireDate DESC
 *
 * @param filters - Optional query filters
 * @returns Array of employees
 * @throws ApiError on 401 (not authenticated)
 */
export const getAll = (
  filters?: EmployeeFilters
): Promise<Employee[]> => {
  return apiClient.get<Employee[]>({
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
 * PUT /employees/:id
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
 * @param branchId - Branch UUID
 * @returns Array of active employees
 */
export const getActive = (branchId: string): Promise<Employee[]> => {
  return apiClient.get<Employee[]>({
    url: `/employees/active/${branchId}`,
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
};
