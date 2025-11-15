import api from './axios';
import type {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  CreatePurchaseExpenseInput,
  TransactionFilters,
  PaginatedTransactionsResponse,
  DashboardSummary,
  DashboardSummaryFilters,
} from '../types/transactions.types';

/**
 * Transactions Service
 * Handles all transaction-related API calls
 */
export const transactionsService = {
  /**
   * Get all transactions with optional filters and pagination
   */
  getAll: async (filters?: TransactionFilters): Promise<PaginatedTransactionsResponse> => {
    const params = new URLSearchParams();

    if (filters?.branchId) {
      params.append('branchId', filters.branchId);
    }
    if (filters?.type) {
      params.append('type', filters.type);
    }
    if (filters?.category) {
      params.append('category', filters.category);
    }
    if (filters?.paymentMethod) {
      params.append('paymentMethod', filters.paymentMethod);
    }
    if (filters?.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      params.append('endDate', filters.endDate);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `/transactions?${queryString}` : '/transactions';

    const response = await api.get<PaginatedTransactionsResponse>(url);
    return response.data;
  },

  /**
   * Get a single transaction by ID
   */
  getOne: async (id: string): Promise<Transaction> => {
    const response = await api.get<Transaction>(`/transactions/${id}`);
    return response.data;
  },

  /**
   * Create a new transaction
   * Note: branchId is auto-filled by backend from user's branch
   */
  create: async (data: CreateTransactionInput): Promise<Transaction> => {
    const response = await api.post<Transaction>('/transactions', data);
    return response.data;
  },

  /**
   * Create a purchase expense transaction with optional inventory update
   * Note: branchId is auto-filled by backend from user's branch
   */
  createPurchase: async (data: CreatePurchaseExpenseInput): Promise<Transaction> => {
    const response = await api.post<Transaction>('/transactions/purchase', data);
    return response.data;
  },

  /**
   * Update an existing transaction
   */
  update: async (id: string, data: UpdateTransactionInput): Promise<Transaction> => {
    const response = await api.put<Transaction>(`/transactions/${id}`, data);
    return response.data;
  },

  /**
   * Delete a transaction
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  },

  /**
   * Get financial summary for a specific date and branch
   * Admin can filter by branch, accountant automatically filtered by their branch
   */
  getSummary: async (filters?: DashboardSummaryFilters): Promise<DashboardSummary> => {
    const params = new URLSearchParams();

    if (filters?.date) {
      params.append('date', filters.date);
    }
    if (filters?.branchId) {
      params.append('branchId', filters.branchId);
    }

    const queryString = params.toString();
    const url = queryString ? `/transactions/summary?${queryString}` : '/transactions/summary';

    const response = await api.get<DashboardSummary>(url);
    return response.data;
  },
};
