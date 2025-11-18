/**
 * Transaction Service
 * Transaction CRUD operations and financial summaries
 *
 * Endpoints:
 * - GET /transactions?filters → PaginatedResponse<Transaction>
 * - GET /transactions/:id → Transaction
 * - POST /transactions → Transaction (CreateTransactionDto)
 * - PATCH /transactions/:id → Transaction (UpdateTransactionDto)
 * - DELETE /transactions/:id → void
 * - GET /transactions/summary → TransactionStatsResponse
 *
 * All types match backend DTOs exactly. No any types.
 */

import apiClient from '../apiClient';
import type {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
} from '#/entity';
import type {
  PaginatedResponse,
  TransactionQueryFilters,
  TransactionStatsResponse,
} from '#/api';

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Transaction API endpoints enum
 * Centralized endpoint definitions
 */
export enum TransactionApiEndpoints {
  GetAll = '/transactions',
  GetOne = '/transactions/:id',
  Create = '/transactions',
  Update = '/transactions/:id',
  Delete = '/transactions/:id',
  GetSummary = '/transactions/summary',
}

// ============================================
// TRANSACTION SERVICE METHODS
// ============================================

/**
 * Get all transactions with pagination and filters
 * GET /transactions
 *
 * Supports filtering by:
 * - type: TransactionType (INCOME | EXPENSE)
 * - category: string
 * - paymentMethod: PaymentMethod (CASH | MASTER)
 * - currency: Currency (USD | IQD)
 * - branchId: UUID (accountants auto-filtered to their branch)
 * - startDate: ISO date string (inclusive)
 * - endDate: ISO date string (inclusive)
 * - search: string (searches employeeVendorName, category, notes)
 * - page: number (default: 1)
 * - limit: number (default: 50)
 *
 * Backend behavior:
 * - Accountants: Auto-filtered to their assigned branch
 * - Admins: Can filter by any branch or see all
 * - Soft-deleted transactions excluded automatically
 * - Results ordered by date DESC
 *
 * @param filters - Optional query filters
 * @returns PaginatedResponse<Transaction> with transactions and pagination meta
 * @throws ApiError on 401 (not authenticated)
 */
export const getAll = (
  filters?: TransactionQueryFilters,
): Promise<PaginatedResponse<Transaction>> => {
  return apiClient.get<PaginatedResponse<Transaction>>({
    url: TransactionApiEndpoints.GetAll,
    params: filters,
  });
};

/**
 * Get single transaction by ID
 * GET /transactions/:id
 *
 * Backend validation:
 * - Accountants can only access transactions from their branch
 * - Admins can access any transaction
 * - Soft-deleted transactions are excluded
 *
 * @param id - Transaction UUID
 * @returns Transaction with branch, creator, and inventoryItem relations
 * @throws ApiError on 401, 403 (wrong branch), 404 (not found or deleted)
 */
export const getOne = (id: string): Promise<Transaction> => {
  return apiClient.get<Transaction>({
    url: `/transactions/${id}`,
  });
};

/**
 * Create new transaction
 * POST /transactions
 *
 * Backend validation (from CreateTransactionDto):
 * - type: Required, INCOME | EXPENSE
 * - amount: Required, >= 0.01
 * - currency: Optional, USD | IQD (defaults to USD)
 * - paymentMethod: Optional for EXPENSE, required for INCOME (CASH | MASTER)
 * - category: Optional, validated against allowed categories
 * - date: Required, ISO date string, cannot be future date
 * - employeeVendorName: Optional, string for employee/vendor name
 * - notes: Optional, text
 * - branchId: Auto-set from user for accountants, required for admins
 * - inventoryItemId: Optional, links transaction to inventory item
 *
 * Backend behavior:
 * - Accountants: branchId auto-set from their assignment
 * - Admins: Must provide branchId
 * - Auto-creates notification for large transactions
 * - Emits WebSocket event for real-time updates
 *
 * @param data - CreateTransactionInput
 * @returns Created Transaction with relations
 * @throws ApiError on 400 (validation), 401, 403, 404 (invalid inventoryItemId)
 */
export const create = (data: CreateTransactionInput): Promise<Transaction> => {
  return apiClient.post<Transaction>({
    url: TransactionApiEndpoints.Create,
    data,
  });
};

/**
 * Update transaction
 * PATCH /transactions/:id
 *
 * Backend allows partial updates of:
 * - amount: Optional, >= 0.01
 * - currency: Optional, USD | IQD
 * - paymentMethod: Optional, CASH | MASTER
 * - category: Optional, validated against allowed categories
 * - date: Optional, ISO date string, cannot be future date
 * - employeeVendorName: Optional, string
 * - notes: Optional, text
 *
 * Backend restrictions:
 * - Cannot change type (INCOME/EXPENSE)
 * - Cannot change branchId
 * - Cannot change createdBy
 * - Accountants can only update their branch's transactions
 * - Cannot update soft-deleted transactions
 *
 * @param id - Transaction UUID
 * @param data - UpdateTransactionInput (partial fields)
 * @returns Updated Transaction
 * @throws ApiError on 400 (validation), 401, 403 (wrong branch), 404 (not found)
 */
export const update = (id: string, data: UpdateTransactionInput): Promise<Transaction> => {
  return apiClient.patch<Transaction>({
    url: `/transactions/${id}`,
    data,
  });
};

/**
 * Delete transaction (soft delete)
 * DELETE /transactions/:id
 *
 * Backend behavior:
 * - Soft delete: Sets deletedAt timestamp, keeps in database
 * - Excluded from future queries automatically
 * - Accountants can only delete their branch's transactions
 * - Audit log entry created
 *
 * @param id - Transaction UUID
 * @returns void
 * @throws ApiError on 401, 403 (wrong branch), 404 (not found or already deleted)
 */
export const deleteTransaction = (id: string): Promise<void> => {
  return apiClient.delete<void>({
    url: `/transactions/${id}`,
  });
};

/**
 * Get transaction statistics and summary
 * GET /transactions/summary
 *
 * Calculates financial statistics based on filters:
 * - Total income (sum of all INCOME transactions)
 * - Total expenses (sum of all EXPENSE transactions)
 * - Net profit (income - expenses)
 * - Transaction count
 * - Breakdown by currency (if multiple currencies)
 * - Breakdown by payment method
 * - Breakdown by category
 *
 * Supports same filters as getAll:
 * - branchId: Filter by specific branch
 * - startDate: ISO date string (inclusive)
 * - endDate: ISO date string (inclusive)
 * - type: Filter by transaction type
 * - category: Filter by category
 * - paymentMethod: Filter by payment method
 * - currency: Filter by currency
 *
 * Backend behavior:
 * - Accountants: Auto-filtered to their branch
 * - Admins: Can see summary for any branch or all branches
 * - Excludes soft-deleted transactions
 *
 * @param filters - Optional query filters (same as getAll)
 * @returns TransactionStatsResponse with financial statistics
 * @throws ApiError on 401 (not authenticated)
 */
export const getSummary = (
  filters?: TransactionQueryFilters,
): Promise<TransactionStatsResponse> => {
  return apiClient.get<TransactionStatsResponse>({
    url: TransactionApiEndpoints.GetSummary,
    params: filters,
  });
};

// ============================================
// HELPER METHODS
// ============================================

/**
 * Get all transactions without pagination (for exports, reports)
 * GET /transactions?limit=10000
 *
 * Warning: Use with caution on large datasets
 * Consider using pagination for better performance
 *
 * @param filters - Optional query filters (without page/limit)
 * @returns Transaction[] array
 * @throws ApiError on 401
 */
export const getAllUnpaginated = (
  filters?: Omit<TransactionQueryFilters, 'page' | 'limit'>,
): Promise<Transaction[]> => {
  return apiClient
    .get<PaginatedResponse<Transaction>>({
      url: TransactionApiEndpoints.GetAll,
      params: { ...filters, limit: 10000 },
    })
    .then((response) => {
      // Extract data from paginated response
      return response.data;
    });
};

/**
 * Get today's transactions for current user's branch
 * GET /transactions?date=today
 *
 * Convenience method for dashboard/overview
 *
 * @returns PaginatedResponse<Transaction> for today
 * @throws ApiError on 401
 */
export const getTodayTransactions = (): Promise<PaginatedResponse<Transaction>> => {
  const today = new Date().toISOString().split('T')[0];
  return getAll({
    startDate: today,
    endDate: today,
  });
};

/**
 * Get transactions for a specific date range
 * GET /transactions?startDate=X&endDate=Y
 *
 * Convenience method for date range queries
 *
 * @param startDate - ISO date string (inclusive)
 * @param endDate - ISO date string (inclusive)
 * @param additionalFilters - Additional optional filters
 * @returns PaginatedResponse<Transaction>
 * @throws ApiError on 401
 */
export const getByDateRange = (
  startDate: string,
  endDate: string,
  additionalFilters?: Omit<TransactionQueryFilters, 'startDate' | 'endDate'>,
): Promise<PaginatedResponse<Transaction>> => {
  return getAll({
    ...additionalFilters,
    startDate,
    endDate,
  });
};

/**
 * Get income transactions only
 * GET /transactions?type=INCOME
 *
 * Convenience method for filtering by type
 *
 * @param filters - Optional additional filters
 * @returns PaginatedResponse<Transaction>
 * @throws ApiError on 401
 */
export const getIncome = (
  filters?: Omit<TransactionQueryFilters, 'type'>,
): Promise<PaginatedResponse<Transaction>> => {
  return getAll({
    ...filters,
    type: 'INCOME',
  });
};

/**
 * Get expense transactions only
 * GET /transactions?type=EXPENSE
 *
 * Convenience method for filtering by type
 *
 * @param filters - Optional additional filters
 * @returns PaginatedResponse<Transaction>
 * @throws ApiError on 401
 */
export const getExpenses = (
  filters?: Omit<TransactionQueryFilters, 'type'>,
): Promise<PaginatedResponse<Transaction>> => {
  return getAll({
    ...filters,
    type: 'EXPENSE',
  });
};

// ============================================
// EXPORTS
// ============================================

/**
 * Transaction service object with all methods
 * Use named exports or default object
 */
const transactionService = {
  getAll,
  getAllUnpaginated,
  getOne,
  create,
  update,
  delete: deleteTransaction,
  getSummary,
  getTodayTransactions,
  getByDateRange,
  getIncome,
  getExpenses,
};

export default transactionService;
