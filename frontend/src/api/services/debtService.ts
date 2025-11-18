/**
 * Debt Service
 * Debt CRUD operations, payment tracking, and summaries
 *
 * Endpoints:
 * - GET /debts?filters → PaginatedResponse<Debt>
 * - GET /debts/:id → Debt (includes payments array)
 * - POST /debts → Debt (CreateDebtDto)
 * - PATCH /debts/:id → Debt (UpdateDebtDto)
 * - DELETE /debts/:id → void
 * - POST /debts/:id/payments → Debt (PayDebtDto)
 * - GET /debts/summary → DebtSummaryResponse
 *
 * All types match backend DTOs exactly. No any types.
 */

import apiClient from '../apiClient';
import type {
  Debt,
  CreateDebtInput,
  UpdateDebtInput,
  PayDebtInput,
} from '#/entity';
import type {
  PaginatedResponse,
  DebtQueryFilters,
  DebtSummaryResponse,
} from '#/api';

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Debt API endpoints enum
 * Centralized endpoint definitions
 */
export enum DebtApiEndpoints {
  GetAll = '/debts',
  GetOne = '/debts/:id',
  Create = '/debts',
  Update = '/debts/:id',
  Delete = '/debts/:id',
  PayDebt = '/debts/:id/payments',
  GetSummary = '/debts/summary',
}

// ============================================
// DEBT SERVICE METHODS
// ============================================

/**
 * Get all debts with pagination and filters
 * GET /debts
 *
 * Supports filtering by:
 * - status: DebtStatus (ACTIVE | PAID | PARTIAL | OVERDUE)
 * - branchId: UUID (accountants auto-filtered to their branch)
 * - startDate: ISO date string (debt creation date, inclusive)
 * - endDate: ISO date string (debt creation date, inclusive)
 * - dueDateStart: ISO date string (due date filter)
 * - dueDateEnd: ISO date string (due date filter)
 * - search: string (searches creditorName, notes)
 * - page: number (default: 1)
 * - limit: number (default: 50)
 *
 * Backend behavior:
 * - Accountants: Auto-filtered to their assigned branch
 * - Admins: Can filter by any branch or see all
 * - Results ordered by dueDate ASC (soonest due dates first)
 * - Includes payments array in each Debt object
 * - Auto-calculates remainingAmount and status
 *
 * @param filters - Optional query filters
 * @returns PaginatedResponse<Debt> with debts (including payments) and pagination meta
 * @throws ApiError on 401 (not authenticated)
 */
export const getAll = (
  filters?: DebtQueryFilters,
): Promise<PaginatedResponse<Debt>> => {
  return apiClient.get<PaginatedResponse<Debt>>({
    url: DebtApiEndpoints.GetAll,
    params: filters,
  });
};

/**
 * Get single debt by ID
 * GET /debts/:id
 *
 * Backend validation:
 * - Accountants can only access debts from their branch
 * - Admins can access any debt
 * - Returns debt with full payments array
 *
 * @param id - Debt UUID
 * @returns Debt with branch, createdBy relations, and payments array
 * @throws ApiError on 401, 403 (wrong branch), 404 (not found)
 */
export const getOne = (id: string): Promise<Debt> => {
  return apiClient.get<Debt>({
    url: `/debts/${id}`,
  });
};

/**
 * Create new debt
 * POST /debts
 *
 * Backend validation (from CreateDebtDto):
 * - creditorName: Required, string, trimmed, escaped
 * - amount: Required, >= 0.01
 * - currency: Optional, USD | IQD (defaults to USD)
 * - date: Required, ISO date string (debt creation date)
 * - dueDate: Required, ISO date string, cannot be before debt date
 * - notes: Optional, text
 * - branchId: Auto-set from user for accountants, required for admins
 *
 * Backend behavior:
 * - Accountants: branchId auto-set from their assignment
 * - Admins: Must provide branchId
 * - Auto-creates notification for new debt
 * - Sets status to ACTIVE initially
 * - Sets remainingAmount to full amount
 * - Emits WebSocket event for real-time updates
 *
 * @param data - CreateDebtInput
 * @returns Created Debt with relations
 * @throws ApiError on 400 (validation), 401, 403, 404 (invalid branchId)
 */
export const create = (data: CreateDebtInput): Promise<Debt> => {
  return apiClient.post<Debt>({
    url: DebtApiEndpoints.Create,
    data,
  });
};

/**
 * Update debt
 * PATCH /debts/:id
 *
 * Backend allows partial updates of:
 * - creditorName: Optional, string
 * - dueDate: Optional, ISO date string, cannot be before debt date
 * - notes: Optional, text
 *
 * Backend restrictions:
 * - Cannot change amount (use payments to reduce debt)
 * - Cannot change currency
 * - Cannot change date (debt creation date)
 * - Cannot change branchId
 * - Cannot change createdBy
 * - Accountants can only update their branch's debts
 * - Cannot update PAID debts (remainingAmount = 0)
 *
 * @param id - Debt UUID
 * @param data - UpdateDebtInput (partial fields)
 * @returns Updated Debt
 * @throws ApiError on 400 (validation), 401, 403 (wrong branch), 404 (not found), 409 (already paid)
 */
export const update = (id: string, data: UpdateDebtInput): Promise<Debt> => {
  return apiClient.patch<Debt>({
    url: `/debts/${id}`,
    data,
  });
};

/**
 * Delete debt
 * DELETE /debts/:id
 *
 * Permanently deletes debt and all associated payments
 * Can only delete debts with no payments or ACTIVE debts
 *
 * Backend behavior:
 * - Accountants can only delete their branch's debts
 * - Cannot delete debts with payments (must delete payments first or use cascade)
 * - Audit log entry created
 *
 * @param id - Debt UUID
 * @returns void
 * @throws ApiError on 401, 403 (wrong branch), 404 (not found), 409 (has payments)
 */
export const deleteDebt = (id: string): Promise<void> => {
  return apiClient.delete<void>({
    url: `/debts/${id}`,
  });
};

/**
 * Record payment towards a debt
 * POST /debts/:id/payments
 *
 * Backend validation (from PayDebtDto):
 * - amount: Required, > 0, <= remainingAmount
 * - currency: Must match debt currency (auto-validated)
 * - paymentDate: Required, ISO date string, cannot be future date
 * - notes: Optional, text
 *
 * Backend behavior:
 * - Creates DebtPayment record
 * - Updates debt.remainingAmount (remainingAmount -= payment amount)
 * - Auto-updates debt.status:
 *   - PAID if remainingAmount = 0
 *   - PARTIAL if 0 < remainingAmount < originalAmount
 *   - OVERDUE if remainingAmount > 0 and past dueDate
 * - Creates notification for payment
 * - Records current user as payment recorder
 * - Emits WebSocket event
 * - Returns updated Debt with new payments array
 *
 * @param id - Debt UUID
 * @param data - PayDebtInput (amount, paymentDate, notes?)
 * @returns Updated Debt with payments array including new payment
 * @throws ApiError on 400 (validation, overpayment), 401, 403 (wrong branch), 404 (not found), 409 (already fully paid)
 */
export const payDebt = (id: string, data: PayDebtInput): Promise<Debt> => {
  return apiClient.post<Debt>({
    url: `/debts/${id}/payments`,
    data,
  });
};

/**
 * Get debt statistics and summary
 * GET /debts/summary
 *
 * Calculates debt statistics based on filters:
 * - totalDebts: Total number of debts
 * - activeDebts: Number of ACTIVE debts (no payments)
 * - paidDebts: Number of fully PAID debts (remainingAmount = 0)
 * - partialDebts: Number of PARTIAL debts (some payments made)
 * - totalOwed: Sum of all remainingAmount across all unpaid debts
 * - overdueDebts: Number of OVERDUE debts (past dueDate with remainingAmount > 0)
 *
 * Supports same filters as getAll:
 * - branchId: Filter by specific branch
 * - status: Filter by debt status
 * - startDate: ISO date string (debt creation date)
 * - endDate: ISO date string (debt creation date)
 * - dueDateStart: Due date range start
 * - dueDateEnd: Due date range end
 *
 * Backend behavior:
 * - Accountants: Auto-filtered to their branch
 * - Admins: Can see summary for any branch or all branches
 * - Calculations include only unpaid/partial debts for totalOwed
 *
 * @param filters - Optional query filters (same as getAll, without pagination)
 * @returns DebtSummaryResponse with debt statistics
 * @throws ApiError on 401 (not authenticated)
 */
export const getSummary = (
  filters?: Omit<DebtQueryFilters, 'page' | 'limit'>,
): Promise<DebtSummaryResponse> => {
  return apiClient.get<DebtSummaryResponse>({
    url: DebtApiEndpoints.GetSummary,
    params: filters,
  });
};

// ============================================
// HELPER METHODS
// ============================================

/**
 * Get all debts without pagination (for exports, reports)
 * GET /debts?limit=10000
 *
 * Warning: Use with caution on large datasets
 * Consider using pagination for better performance
 *
 * @param filters - Optional query filters (without page/limit)
 * @returns Debt[] array (each with payments array)
 * @throws ApiError on 401
 */
export const getAllUnpaginated = (
  filters?: Omit<DebtQueryFilters, 'page' | 'limit'>,
): Promise<Debt[]> => {
  return apiClient
    .get<PaginatedResponse<Debt>>({
      url: DebtApiEndpoints.GetAll,
      params: { ...filters, limit: 10000 },
    })
    .then((response) => {
      // Extract data from paginated response
      return response.data;
    });
};

/**
 * Get only active debts (no payments made)
 * GET /debts?status=ACTIVE
 *
 * Convenience method for filtering by status
 *
 * @param filters - Optional additional filters
 * @returns PaginatedResponse<Debt>
 * @throws ApiError on 401
 */
export const getActiveDebts = (
  filters?: Omit<DebtQueryFilters, 'status'>,
): Promise<PaginatedResponse<Debt>> => {
  return getAll({
    ...filters,
    status: 'ACTIVE',
  });
};

/**
 * Get only paid debts (fully paid)
 * GET /debts?status=PAID
 *
 * Convenience method for filtering by status
 *
 * @param filters - Optional additional filters
 * @returns PaginatedResponse<Debt>
 * @throws ApiError on 401
 */
export const getPaidDebts = (
  filters?: Omit<DebtQueryFilters, 'status'>,
): Promise<PaginatedResponse<Debt>> => {
  return getAll({
    ...filters,
    status: 'PAID',
  });
};

/**
 * Get only partial debts (some payments made)
 * GET /debts?status=PARTIAL
 *
 * Convenience method for filtering by status
 *
 * @param filters - Optional additional filters
 * @returns PaginatedResponse<Debt>
 * @throws ApiError on 401
 */
export const getPartialDebts = (
  filters?: Omit<DebtQueryFilters, 'status'>,
): Promise<PaginatedResponse<Debt>> => {
  return getAll({
    ...filters,
    status: 'PARTIAL',
  });
};

/**
 * Get only overdue debts (past due date with remaining amount)
 * GET /debts?status=OVERDUE
 *
 * Convenience method for filtering by status
 *
 * @param filters - Optional additional filters
 * @returns PaginatedResponse<Debt>
 * @throws ApiError on 401
 */
export const getOverdueDebts = (
  filters?: Omit<DebtQueryFilters, 'status'>,
): Promise<PaginatedResponse<Debt>> => {
  return getAll({
    ...filters,
    status: 'OVERDUE',
  });
};

/**
 * Get debts by due date range
 * GET /debts?dueDateStart=X&dueDateEnd=Y
 *
 * Convenience method for due date range queries
 *
 * @param dueDateStart - ISO date string (inclusive)
 * @param dueDateEnd - ISO date string (inclusive)
 * @param additionalFilters - Additional optional filters
 * @returns PaginatedResponse<Debt>
 * @throws ApiError on 401
 */
export const getByDueDateRange = (
  dueDateStart: string,
  dueDateEnd: string,
  additionalFilters?: Omit<DebtQueryFilters, 'dueDateStart' | 'dueDateEnd'>,
): Promise<PaginatedResponse<Debt>> => {
  return getAll({
    ...additionalFilters,
    dueDateStart,
    dueDateEnd,
  });
};

/**
 * Get debts due soon (within next 7 days)
 * GET /debts?dueDateStart=today&dueDateEnd=7daysFromNow
 *
 * Convenience method for dashboard/overview
 *
 * @returns PaginatedResponse<Debt>
 * @throws ApiError on 401
 */
export const getDebtsDueSoon = (): Promise<PaginatedResponse<Debt>> => {
  const today = new Date();
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(today.getDate() + 7);

  return getByDueDateRange(
    today.toISOString().split('T')[0],
    sevenDaysFromNow.toISOString().split('T')[0],
    { status: 'ACTIVE' },
  );
};

// ============================================
// EXPORTS
// ============================================

/**
 * Debt service object with all methods
 * Use named exports or default object
 */
const debtService = {
  getAll,
  getAllUnpaginated,
  getOne,
  create,
  update,
  delete: deleteDebt,
  payDebt,
  getSummary,
  getActiveDebts,
  getPaidDebts,
  getPartialDebts,
  getOverdueDebts,
  getByDueDateRange,
  getDebtsDueSoon,
};

export default debtService;
