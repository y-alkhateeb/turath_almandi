/**
 * Transaction Service
 * Transaction management and financial summary endpoints
 */

import apiClient from '../apiClient';
import type {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilters,
} from '#/entity';
import type { PaginatedResponse } from '#/api';

// Dashboard summary types (to be added to entity.ts if not present)
interface DashboardSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  transactionCount: number;
  cashRevenue?: number;
  masterRevenue?: number;
}

interface DashboardSummaryFilters {
  date?: string;
  branchId?: string;
}

// Purchase expense input (extends CreateTransactionInput)
interface CreatePurchaseExpenseInput extends CreateTransactionInput {
  addToInventory?: boolean;
  inventoryName?: string;
  inventoryQuantity?: number;
  inventoryUnit?: string;
  inventoryCostPerUnit?: number;
}

// API endpoints enum
export enum TransactionApi {
  GetAll = '/transactions',
  GetOne = '/transactions/:id',
  Create = '/transactions',
  CreatePurchase = '/transactions/purchase',
  Update = '/transactions/:id',
  Delete = '/transactions/:id',
  GetSummary = '/transactions/summary',
}

// Build query string from filters
const buildQueryString = (filters?: TransactionFilters): string => {
  if (!filters) return '';

  const params = new URLSearchParams();

  if (filters.branchId) params.append('branchId', filters.branchId);
  if (filters.type) params.append('type', filters.type);
  if (filters.category) params.append('category', filters.category);
  if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  return params.toString();
};

// Get all transactions with optional filters and pagination
export const getAll = (filters?: TransactionFilters) => {
  const queryString = buildQueryString(filters);
  const url = queryString ? `/transactions?${queryString}` : '/transactions';

  return apiClient.get<PaginatedResponse<Transaction>>({
    url,
  });
};

// Get single transaction by ID
export const getOne = (id: string) =>
  apiClient.get<Transaction>({
    url: `/transactions/${id}`,
  });

// Create new transaction
export const create = (data: CreateTransactionInput) =>
  apiClient.post<Transaction>({
    url: TransactionApi.Create,
    data,
  });

// Create purchase expense with optional inventory update
export const createPurchase = (data: CreatePurchaseExpenseInput) =>
  apiClient.post<Transaction>({
    url: TransactionApi.CreatePurchase,
    data,
  });

// Update transaction
export const update = (id: string, data: UpdateTransactionInput) =>
  apiClient.put<Transaction>({
    url: `/transactions/${id}`,
    data,
  });

// Delete transaction
export const deleteTransaction = (id: string) =>
  apiClient.delete<void>({
    url: `/transactions/${id}`,
  });

// Get financial summary
export const getSummary = (filters?: DashboardSummaryFilters) => {
  const params = new URLSearchParams();

  if (filters?.date) params.append('date', filters.date);
  if (filters?.branchId) params.append('branchId', filters.branchId);

  const queryString = params.toString();
  const url = queryString ? `/transactions/summary?${queryString}` : '/transactions/summary';

  return apiClient.get<DashboardSummary>({
    url,
  });
};

// Export as default object
export default {
  getAll,
  getOne,
  create,
  createPurchase,
  update,
  delete: deleteTransaction,
  getSummary,
};

// Export types
export type { DashboardSummary, DashboardSummaryFilters, CreatePurchaseExpenseInput };
