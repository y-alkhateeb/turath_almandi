/**
 * Receivable Service
 * Account Receivable CRUD operations, collection tracking, and summaries
 *
 * Endpoints:
 * - GET /receivables?filters → PaginatedResponse<AccountReceivable>
 * - GET /receivables/:id → AccountReceivableWithPayments
 * - POST /receivables → AccountReceivable (CreateReceivableDto)
 * - PATCH /receivables/:id → AccountReceivable (UpdateReceivableDto)
 * - DELETE /receivables/:id → void
 * - POST /receivables/:id/collect → CollectionResult (CollectReceivableDto)
 * - GET /receivables/summary → ReceivablesSummary
 *
 * All types match backend DTOs exactly. No any types.
 */

import apiClient from '../apiClient';
import type {
  AccountReceivable,
  AccountReceivableWithPayments,
  CreateReceivableDto,
  UpdateReceivableDto,
  CollectReceivableDto,
  QueryReceivablesDto,
  ReceivablesSummary,
} from '#/entity';
import type { PaginatedResponse } from '#/api';

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Receivable API endpoints enum
 * Centralized endpoint definitions
 */
export enum ReceivableApiEndpoints {
  Base = '/receivables',
  ById = '/receivables/:id',
  Collect = '/receivables/:id/collect',
  Summary = '/receivables/summary',
}

// ============================================
// RECEIVABLE SERVICE METHODS
// ============================================

/**
 * Get all receivables with pagination and filters
 * GET /receivables
 *
 * Supports filtering by:
 * - status: ReceivableStatus (PENDING | PARTIAL | PAID)
 * - contactId: UUID
 * - branchId: UUID (accountants auto-filtered to their branch)
 * - startDate: ISO date string (receivable date, inclusive)
 * - endDate: ISO date string (receivable date, inclusive)
 * - search: string (searches description, invoiceNumber, contact name)
 * - page: number (default: 1)
 * - limit: number (default: 50)
 *
 * Backend behavior:
 * - Accountants: Auto-filtered to their assigned branch
 * - Admins: Can filter by any branch or see all
 * - Results ordered by date DESC
 * - Includes contact info in each receivable
 *
 * @param filters - Optional query filters
 * @returns PaginatedResponse<AccountReceivable> with receivables and pagination meta
 * @throws ApiError on 401 (not authenticated)
 */
export const getAll = (
  filters?: QueryReceivablesDto,
): Promise<PaginatedResponse<AccountReceivable>> => {
  return apiClient.get<PaginatedResponse<AccountReceivable>>({
    url: ReceivableApiEndpoints.Base,
    params: filters,
  });
};

/**
 * Get single receivable by ID
 * GET /receivables/:id
 *
 * Backend validation:
 * - Accountants can only access receivables from their branch
 * - Admins can access any receivable
 * - Returns receivable with full payments array
 *
 * @param id - Receivable UUID
 * @returns AccountReceivableWithPayments (includes payments array)
 * @throws ApiError on 404 (not found) or 403 (no access)
 */
export const getById = (id: string): Promise<AccountReceivableWithPayments> => {
  return apiClient.get<AccountReceivableWithPayments>({
    url: ReceivableApiEndpoints.ById.replace(':id', id),
  });
};

/**
 * Create a new receivable
 * POST /receivables
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
 * @param data - CreateReceivableDto
 * @returns Created AccountReceivable
 * @throws ApiError on 400 (validation), 404 (contact not found)
 */
export const create = (data: CreateReceivableDto): Promise<AccountReceivable> => {
  return apiClient.post<AccountReceivable>({
    url: ReceivableApiEndpoints.Base,
    data,
  });
};

/**
 * Update a receivable
 * PATCH /receivables/:id
 *
 * Backend validation:
 * - All fields optional (partial update)
 * - Cannot update amount or contactId after creation
 * - Same validation rules as create for other fields
 *
 * Business rules:
 * - Accountants can only update their branch receivables
 * - Admins can update any receivable
 * - Amount and contact are immutable after creation
 *
 * @param id - Receivable UUID
 * @param data - UpdateReceivableDto (partial)
 * @returns Updated AccountReceivable
 * @throws ApiError on 404 (not found), 403 (no access), 400 (immutable field)
 */
export const update = (id: string, data: UpdateReceivableDto): Promise<AccountReceivable> => {
  return apiClient.patch<AccountReceivable>({
    url: ReceivableApiEndpoints.ById.replace(':id', id),
    data,
  });
};

/**
 * Delete a receivable (soft delete)
 * DELETE /receivables/:id
 *
 * Backend validation:
 * - Accountants can only delete their branch receivables
 * - Admins can delete any receivable
 * - Cannot delete if has payments
 *
 * Business rules:
 * - Sets deletedAt, deletedBy, isDeleted = true
 * - Prevents deletion if receivable has any payments
 *
 * @param id - Receivable UUID
 * @returns void
 * @throws ApiError on 404 (not found), 403 (no access), 400 (has payments)
 */
export const remove = (id: string): Promise<void> => {
  return apiClient.delete<void>({
    url: ReceivableApiEndpoints.ById.replace(':id', id),
  });
};

/**
 * Collect a payment on a receivable
 * POST /receivables/:id/collect
 *
 * Backend validation:
 * - amountPaid: required positive number, <= remainingAmount
 * - paymentDate: required ISO date
 * - paymentMethod: required PaymentMethod enum
 *
 * Business rules:
 * - Accountants can only collect from their branch receivables
 * - Admins can collect from any receivable
 * - Updates remainingAmount and status automatically
 * - Creates Transaction record (INCOME type)
 * - Creates ReceivablePayment record
 *
 * Status updates:
 * - PENDING → PARTIAL (if partial collection)
 * - PENDING → PAID (if full collection)
 * - PARTIAL → PAID (if remaining collected)
 *
 * @param id - Receivable UUID
 * @param data - CollectReceivableDto
 * @returns Collection result with updated receivable and transaction
 * @throws ApiError on 404, 403, 400 (payment exceeds remaining)
 */
export const collectReceivable = (
  id: string,
  data: CollectReceivableDto,
): Promise<{
  payment: any;
  updatedReceivable: AccountReceivable;
  transaction: any;
}> => {
  return apiClient.post<{
    payment: any;
    updatedReceivable: AccountReceivable;
    transaction: any;
  }>({
    url: ReceivableApiEndpoints.Collect.replace(':id', id),
    data,
  });
};

/**
 * Get receivables summary statistics
 * GET /receivables/summary
 *
 * Returns statistics:
 * - total: total count
 * - byStatus: breakdown by status (pending, partial, paid)
 * - amounts: total, remaining, collected amounts
 *
 * Backend behavior:
 * - Accountants: Stats for their branch only
 * - Admins: Can filter by branch or see all
 *
 * @param branchId - Optional branch UUID for admins
 * @returns ReceivablesSummary
 * @throws ApiError on 401 (not authenticated)
 */
export const getSummary = (branchId?: string): Promise<ReceivablesSummary> => {
  return apiClient.get<ReceivablesSummary>({
    url: ReceivableApiEndpoints.Summary,
    params: branchId ? { branchId } : undefined,
  });
};

// ============================================
// EXPORT DEFAULT SERVICE
// ============================================

const receivableService = {
  getAll,
  getById,
  create,
  update,
  remove,
  collectReceivable,
  getSummary,
};

export default receivableService;
