import api from './axios';
import type { Debt, CreateDebtInput } from '../types/debts.types';

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
};
