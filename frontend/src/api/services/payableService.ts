/**
 * Payable Service
 * Account Payable CRUD operations, payment tracking, and summaries
 *
 * Endpoints:
 * - GET /payables?filters → PaginatedResponse<AccountPayable>
 * - GET /payables/:id → AccountPayableWithPayments
 * - POST /payables → AccountPayable (CreatePayableDto)
 * - PATCH /payables/:id → AccountPayable (UpdatePayableDto)
 * - DELETE /payables/:id → void
 * - POST /payables/:id/pay → PaymentResult (PayPayableDto)
 * - GET /payables/summary → PayablesSummary
 *
 * All types match backend DTOs exactly. No any types.
 */

import apiClient from '../apiClient';
import type {
  AccountPayable,
  AccountPayableWithPayments,
  CreatePayableDto,
  UpdatePayableDto,
  PayPayableDto,
  QueryPayablesDto,
  PayablesSummary,
} from '#/payables.types';
import type { PaginatedResponse } from '#/api';

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Payable API endpoints enum
 * Centralized endpoint definitions
 */
export enum PayableApiEndpoints {
  Base = '/payables',
  ById = '/payables/:id',
  Pay = '/payables/:id/pay',
  Summary = '/payables/summary',
}

// ============================================
// PAYABLE SERVICE METHODS
// ============================================

/**
 * Get all payables with pagination and filters
 * GET /payables
 *
 * Supports filtering by:
 * - status: PayableStatus (PENDING | PARTIAL | PAID)
 * - contactId: UUID
 * - branchId: UUID (accountants auto-filtered to their branch)
 * - startDate: ISO date string (payable date, inclusive)
 * - endDate: ISO date string (payable date, inclusive)
 * - search: string (searches description, invoiceNumber, contact name)
 * - page: number (default: 1)
 * - limit: number (default: 50)
 *
 * Backend behavior:
 * - Accountants: Auto-filtered to their assigned branch
 * - Admins: Can filter by any branch or see all
 * - Results ordered by date DESC
 * - Includes contact info in each payable
 *
 * @param filters - Optional query filters
 * @returns PaginatedResponse<AccountPayable> with payables and pagination meta
 * @throws ApiError on 401 (not authenticated)
 */
export const getAll = (
  filters?: QueryPayablesDto,
): Promise<PaginatedResponse<AccountPayable>> => {
  return apiClient.get<PaginatedResponse<AccountPayable>>({
    url: PayableApiEndpoints.Base,
    params: filters,
  });
};

/**
 * Get single payable by ID
 * GET /payables/:id
 *
 * Backend validation:
 * - Accountants can only access payables from their branch
 * - Admins can access any payable
 * - Returns payable with full payments array
 *
 * @param id - Payable UUID
 * @returns AccountPayableWithPayments (includes payments array)
 * @throws ApiError on 404 (not found) or 403 (no access)
 */
export const getById = (id: string): Promise<AccountPayableWithPayments> => {
  return apiClient.get<AccountPayableWithPayments>({
    url: PayableApiEndpoints.ById.replace(':id', id),
  });
};

/**
 * Create a new payable
 * POST /payables
 *
 * Backend validation:
 * - contactId: required UUID, must exist
 * - amount: required positive number
 * - date: required ISO date
 * - dueDate: optional, must be >= date
 * - branchId: optional for admins, auto-assigned for accountants
 *
 * Business rules:
 * - Accountants can only create for their branch
 * - Admins can specify branch or leave null
 * - Contact must exist and belong to same branch (if applicable)
 * - Creates with status PENDING, remainingAmount = originalAmount
 *
 * @param data - CreatePayableDto
 * @returns Created AccountPayable
 * @throws ApiError on 400 (validation), 404 (contact not found)
 */
export const create = (data: CreatePayableDto): Promise<AccountPayable> => {
  return apiClient.post<AccountPayable>({
    url: PayableApiEndpoints.Base,
    data,
  });
};

/**
 * Update a payable
 * PATCH /payables/:id
 *
 * Backend validation:
 * - All fields optional (partial update)
 * - Cannot update amount or contactId after creation
 * - Same validation rules as create for other fields
 *
 * Business rules:
 * - Accountants can only update their branch payables
 * - Admins can update any payable
 * - Amount and contact are immutable after creation
 *
 * @param id - Payable UUID
 * @param data - UpdatePayableDto (partial)
 * @returns Updated AccountPayable
 * @throws ApiError on 404 (not found), 403 (no access), 400 (immutable field)
 */
export const update = (id: string, data: UpdatePayableDto): Promise<AccountPayable> => {
  return apiClient.patch<AccountPayable>({
    url: PayableApiEndpoints.ById.replace(':id', id),
    data,
  });
};

/**
 * Delete a payable (soft delete)
 * DELETE /payables/:id
 *
 * Backend validation:
 * - Accountants can only delete their branch payables
 * - Admins can delete any payable
 * - Cannot delete if has payments
 *
 * Business rules:
 * - Sets deletedAt, deletedBy, isDeleted = true
 * - Prevents deletion if payable has any payments
 *
 * @param id - Payable UUID
 * @returns void
 * @throws ApiError on 404 (not found), 403 (no access), 400 (has payments)
 */
export const remove = (id: string): Promise<void> => {
  return apiClient.delete<void>({
    url: PayableApiEndpoints.ById.replace(':id', id),
  });
};

/**
 * Make a payment on a payable
 * POST /payables/:id/pay
 *
 * Backend validation:
 * - amountPaid: required positive number, <= remainingAmount
 * - paymentDate: required ISO date
 * - paymentMethod: required PaymentMethod enum
 *
 * Business rules:
 * - Accountants can only pay their branch payables
 * - Admins can pay any payable
 * - Updates remainingAmount and status automatically
 * - Creates Transaction record (EXPENSE type)
 * - Creates PayablePayment record
 *
 * Status updates:
 * - PENDING → PARTIAL (if partial payment)
 * - PENDING → PAID (if full payment)
 * - PARTIAL → PAID (if remaining paid)
 *
 * @param id - Payable UUID
 * @param data - PayPayableDto
 * @returns Payment result with updated payable and transaction
 * @throws ApiError on 404, 403, 400 (payment exceeds remaining)
 */
export const payPayable = (
  id: string,
  data: PayPayableDto,
): Promise<{
  payment: any;
  updatedPayable: AccountPayable;
  transaction: any;
}> => {
  return apiClient.post<{
    payment: any;
    updatedPayable: AccountPayable;
    transaction: any;
  }>({
    url: PayableApiEndpoints.Pay.replace(':id', id),
    data,
  });
};

/**
 * Get payables summary statistics
 * GET /payables/summary
 *
 * Returns statistics:
 * - total: total count
 * - byStatus: breakdown by status (pending, partial, paid)
 * - amounts: total, remaining, paid amounts
 *
 * Backend behavior:
 * - Accountants: Stats for their branch only
 * - Admins: Can filter by branch or see all
 *
 * @param branchId - Optional branch UUID for admins
 * @returns PayablesSummary
 * @throws ApiError on 401 (not authenticated)
 */
export const getSummary = (branchId?: string): Promise<PayablesSummary> => {
  return apiClient.get<PayablesSummary>({
    url: PayableApiEndpoints.Summary,
    params: branchId ? { branchId } : undefined,
  });
};

// ============================================
// EXPORT DEFAULT SERVICE
// ============================================

const payableService = {
  getAll,
  getById,
  create,
  update,
  remove,
  payPayable,
  getSummary,
};

export default payableService;
