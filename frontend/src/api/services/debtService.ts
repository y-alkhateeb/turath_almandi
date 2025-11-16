/**
 * Debt Service
 * Debt management and payment tracking endpoints
 */

import apiClient from '../apiClient';
import type { Debt, CreateDebtInput, PayDebtInput } from '#/entity';

// API endpoints enum
export enum DebtApi {
  GetAll = '/debts',
  Create = '/debts',
  PayDebt = '/debts/:id/payments',
}

// Get all debts
// Accountants see only their branch debts (filtered by backend)
// Admins see all debts
export const getAll = () =>
  apiClient.get<Debt[]>({
    url: DebtApi.GetAll,
  });

// Create new debt
// Note: branchId auto-filled by backend from user's branch
// Auto-sets: amount, remainingAmount, status = 'ACTIVE'
export const create = (data: CreateDebtInput) =>
  apiClient.post<Debt>({
    url: DebtApi.Create,
    data,
  });

// Pay a debt
// Creates payment record and updates remaining amount and status
// Backend validates: amount <= remainingAmount
// Auto-updates status: PAID if remaining = 0, PARTIAL otherwise
export const payDebt = (debtId: string, data: PayDebtInput) =>
  apiClient.post<Debt>({
    url: `/debts/${debtId}/payments`,
    data,
  });

// Export as default object
export default {
  getAll,
  create,
  payDebt,
};
