/**
 * Transaction Service
 * Transaction CRUD operations and financial summaries
 *
 * Endpoints:
 * - GET /transactions?filters → PaginatedResponse<Transaction>
 * - GET /transactions/:id → Transaction
 * - POST /transactions/income → Transaction (CreateIncomeInput)
 * - POST /transactions/expense → Transaction (CreateExpenseInput)
 * - PUT /transactions/:id → Transaction (UpdateTransactionInput)
 * - DELETE /transactions/:id → void
 * - GET /transactions/summary → TransactionStatsResponse
 *
 * All types match backend DTOs exactly. No any types.
 */

import apiClient from '../apiClient';
import type { Transaction, UpdateTransactionInput } from '#/entity';
import type { PaginatedResponse, TransactionQueryFilters, TransactionStatsResponse } from '#/api';
import { DiscountType, InventoryOperationType, PaymentMethod } from '@/types/enum';

// ============================================
// TYPES
// ============================================

/**
 * Transaction Item DTO for multi-item transactions
 * Matches backend TransactionItemDto exactly
 */
export interface TransactionItemDto {
  inventoryItemId: string;
  quantity: number;
  unitPrice: number;
  operationType: InventoryOperationType;
  discountType?: DiscountType;
  discountValue?: number;
  notes?: string;
}

/**
 * Input for creating INCOME transactions
 * Matches backend CreateIncomeDto
 */
export interface CreateIncomeInput {
  date: string;
  category: string;
  paymentMethod: PaymentMethod;
  amount?: number;
  items?: TransactionItemDto[];
  discountType?: DiscountType;
  discountValue?: number;
  discountReason?: string;
  branchId?: string;
  notes?: string;
  createReceivable?: boolean;
  contactId?: string;
  receivableDueDate?: string;
}

/**
 * Input for creating EXPENSE transactions
 * Matches backend CreateExpenseDto
 */
export interface CreateExpenseInput {
  date: string;
  category: string;
  paymentMethod?: PaymentMethod;
  amount?: number;
  items?: TransactionItemDto[];
  employeeId?: string;
  paidAmount?: number;
  createDebtForRemaining?: boolean;
  contactId?: string;
  payableDueDate?: string;
  branchId?: string;
  notes?: string;
}

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Transaction API endpoints enum
 * Centralized endpoint definitions
 */
export enum TransactionApiEndpoints {
  Base = '/transactions',
  ById = '/transactions/:id',
  Summary = '/transactions/summary',
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
 * - branchId: UUID (accountants auto-filtered to their branch)
 * - startDate: ISO date string (inclusive)
 * - endDate: ISO date string (inclusive)

 * - page: string (default: 1)
 * - limit: string (default: 10)
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
  filters?: TransactionQueryFilters
): Promise<PaginatedResponse<Transaction>> => {
  return apiClient.get<PaginatedResponse<Transaction>>({
    url: TransactionApiEndpoints.Base,
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
 * Create new INCOME transaction
 * POST /transactions/income
 *
 * Backend validation (from CreateIncomeDto):
 * - date: Required, ISO date string, not future
 * - category: Required, IncomeCategory enum
 * - paymentMethod: Required, CASH | MASTER
 * - amount: Required if no items, positive
 * - items: Optional TransactionItemDto[] (for multi-item)
 * - discountType: Optional, DiscountType enum
 * - discountValue: Optional, >= 0
 * - discountReason: Optional, max 200 chars
 * - branchId: Optional for admins, auto-assigned for accountants

 * - notes: Optional
 *
 * @param data - CreateIncomeInput
 * @returns Created Transaction with relations
 * @throws ApiError on 400 (validation), 401, 403
 */
export const createIncome = (data: CreateIncomeInput): Promise<Transaction> => {
  return apiClient.post<Transaction>({
    url: '/transactions/income',
    data,
  });
};

/**
 * Create new EXPENSE transaction
 * POST /transactions/expense
 *
 * Backend validation (from CreateExpenseDto):
 * - date: Required, ISO date string, not future
 * - category: Required, ExpenseCategory enum
 * - paymentMethod: Optional, CASH | MASTER
 * - amount: Required if no items, positive
 * - items: Optional TransactionItemDto[] (for multi-item inventory operations)
 * - employeeId: Required if category === 'EMPLOYEE_SALARIES'
 * - paidAmount: Optional, for partial payment
 * - createDebtForRemaining: Optional, auto-create debt
 * - contactId: Required if partial payment
 * - payableDueDate: Optional
 * - branchId: Optional for admins, auto-assigned for accountants

 * - notes: Optional
 *
 * @param data - CreateExpenseInput
 * @returns Created Transaction with relations
 * @throws ApiError on 400 (validation), 401, 403
 */
export const createExpense = (data: CreateExpenseInput): Promise<Transaction> => {
  return apiClient.post<Transaction>({
    url: '/transactions/expense',
    data,
  });
};

/**
 * Update transaction
 * PUT /transactions/:id
 *
 * Backend allows partial updates of:
 * - type: Optional, TransactionType
 * - amount: Optional, >= 0.01
 * - paymentMethod: Optional, PaymentMethod
 * - category: Optional
 * - date: Optional, ISO date string, not future

 * - notes: Optional
 * - discountType: Optional, DiscountType
 * - discountValue: Optional, >= 0
 * - discountReason: Optional
 *
 * Backend restrictions:
 * - Accountants can only update their branch's transactions
 * - Cannot update if linked to payables/receivables
 *
 * @param id - Transaction UUID
 * @param data - UpdateTransactionInput (partial fields)
 * @returns Updated Transaction
 * @throws ApiError on 400 (validation), 401, 403 (wrong branch), 404 (not found)
 */
export const update = (id: string, data: UpdateTransactionInput): Promise<Transaction> => {
  return apiClient.put<Transaction>({
    url: `/transactions/${id}`,
    data,
  });
};

/**
 * Delete transaction (soft delete)
 * DELETE /transactions/:id
 *
 * Backend behavior:
 * - Soft delete: Sets deletedAt, isDeleted
 * - Accountants can only delete their branch's transactions
 * - Cannot delete if linked to payables/receivables
 *
 * @param id - Transaction UUID
 * @returns void
 * @throws ApiError on 401, 403 (wrong branch), 404 (not found), 400 (has linked records)
 */
export const deleteTransaction = (id: string): Promise<void> => {
  return apiClient.delete<void>({
    url: `/transactions/${id}`,
  });
};

/**
 * Get transaction summary statistics
 * GET /transactions/summary
 *
 * Returns daily/branch summary with income, expense, net totals
 *
 * Supports filtering by:
 * - date: Optional ISO date
 * - branchId: Optional UUID
 *
 * Backend behavior:
 * - Accountants: Auto-filtered to their branch
 * - Admins: Can filter by branch or see all
 *
 * @param filters - Optional query filters (same as getAll)
 * @returns TransactionStatsResponse with financial statistics
 * @throws ApiError on 401 (not authenticated)
 */
export const getSummary = (
  filters?: TransactionQueryFilters
): Promise<TransactionStatsResponse> => {
  return apiClient.get<TransactionStatsResponse>({
    url: TransactionApiEndpoints.Summary,
    params: filters,
  });
};

// ============================================
// EXPORTS
// ============================================

const transactionService = {
  getAll,
  getOne,
  createIncome,
  createExpense,
  update,
  delete: deleteTransaction,
  getSummary,
};

export default transactionService;
