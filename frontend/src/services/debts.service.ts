import api from './axios';
import type { Debt, CreateDebtInput, PayDebtInput } from '../types/debts.types';

/**
 * Debts Service
 * Handles all debt-related API calls
 */
export const debtsService = {
  /**
   * Get all debts
   * Accountants can only see debts from their branch (filtered by backend)
   * Admins can see all debts
   */
  getAll: async (): Promise<Debt[]> => {
    const response = await api.get<Debt[]>('/debts');
    return response.data;
  },

  /**
   * Create a new debt
   * Note: branchId is auto-filled by backend from user's branch
   * Auto-sets: original_amount = amount, remaining_amount = amount, status = 'ACTIVE'
   */
  create: async (data: CreateDebtInput): Promise<Debt> => {
    const response = await api.post<Debt>('/debts', data);
    return response.data;
  },

  /**
   * Pay a debt
   * Creates a payment record and updates debt remaining_amount and status
   * Backend validates: amount_paid <= remaining_amount
   * Auto-updates status: PAID if remaining = 0, PARTIAL if 0 < remaining < original
   */
  payDebt: async (debtId: string, data: PayDebtInput): Promise<Debt> => {
    const response = await api.post<Debt>(`/debts/${debtId}/payments`, data);
    return response.data;
  },
};
