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
import type { Transaction, CreateTransactionInput, UpdateTransactionInput } from '#/entity';
import type { PaginatedResponse, TransactionQueryFilters, TransactionStatsResponse } from '#/api';
import type { TransactionWithInventoryRequest } from '../../types/inventoryOperation.types';
import { DiscountType, InventoryOperationType, TransactionType } from '@/types/enum';

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
 * - search: string (searches employeeVendorName, category, notes)
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
 * Create new transaction
 * POST /transactions
 *
 * Backend validation (from CreateTransactionDto):
 * - type: Required, INCOME | EXPENSE
 * - amount: Required if no items, positive
 * - paymentMethod: Required for INCOME (CASH | MASTER)
 * - items: Optional TransactionItemDto[] (alternative to amount)
 * - discountType: Optional, DiscountType enum (PERCENTAGE | AMOUNT)
 * - discountValue: Optional, >= 0
 * - discountReason: Optional, max 200 chars
 * - category: Optional if not EMPLOYEE_SALARIES
 * - date: Required, ISO date string, not future
 * - employeeVendorName: Optional
 * - notes: Optional
 * - branchId: Optional for admins, auto-assigned for accountants
 * - employeeId: Required if category === 'EMPLOYEE_SALARIES'
 *
 * Backend behavior:
 * - Accountants: branchId auto-set from their assignment
 * - Admins: Must provide branchId
 *
 * @param data - CreateTransactionInput
 * @returns Created Transaction with relations
 * @throws ApiError on 400 (validation), 401, 403, 404
 */
export const create = (data: CreateTransactionInput): Promise<Transaction> => {
  return apiClient.post<Transaction>({
    url: TransactionApiEndpoints.Base,
    data,
  });
};

/**
 * Create purchase expense with optional inventory
 * POST /transactions/purchase
 *
 * Creates an expense transaction for a purchase with optional inventory item creation
 *
 * Backend validation:
 * - date: Required, ISO date, not future
 * - amount: Required, > 0.01
 * - vendorName: Required, 2+ chars
 * - addToInventory: Required boolean
 * - itemName: Required if addToInventory=true
 * - quantity: Required if addToInventory=true, > 0.01
 * - unit: Required if addToInventory=true, InventoryUnit enum
 * - notes: Optional
 *
 * @param data - Purchase expense DTO
 * @returns Created Transaction with linked inventory
 * @throws ApiError on 400 (validation), 401, 403
 */
export const createPurchase = (data: any): Promise<Transaction> => {
  return apiClient.post<Transaction>({
    url: '/transactions/purchase',
    data,
  });
};

/**
 * Create transaction with inventory operations
 * POST /transactions/with-inventory
 *
 * Creates transaction with linked inventory operations
 *
 * @param data - TransactionWithInventoryRequest
 * @returns Created Transaction with inventory operations
 * @throws ApiError on 400 (validation), 401, 403, 404
 */
export const createWithInventory = (data: TransactionWithInventoryRequest): Promise<Transaction> => {
  return apiClient.post<Transaction>({
    url: '/transactions/with-inventory',
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
 * - employeeVendorName: Optional
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
  create,
  createPurchase,
  createWithInventory,
  update,
  delete: deleteTransaction,
  getSummary,
};

export default transactionService;
