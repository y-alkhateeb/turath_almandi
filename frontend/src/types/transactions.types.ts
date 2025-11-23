/**
 * Transaction Type Definitions
 * Based on backend Prisma schema and DTOs
 */

import { InventoryUnit } from './inventory.types';
import { TransactionInventoryItem } from './inventoryOperation.types';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum PaymentMethod {
  CASH = 'CASH',
  MASTER = 'MASTER',
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: InventoryUnit;
  costPerUnit?: number;
}

export interface Transaction {
  id: string;
  branchId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod | null;
  category: string | null;
  date: string; // ISO date string
  employeeVendorName: string | null;
  notes: string | null;
  inventoryItemId?: string | null;
  paidAmount?: number | null;
  totalAmount?: number | null;
  linkedDebtId?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  branch?: {
    id: string;
    name: string;
    location: string;
  };
  creator?: {
    id: string;
    username: string;
    role: string;
  };
  inventoryItem?: InventoryItem | null;
  linkedDebt?: {
    id: string;
    creditorName: string;
    originalAmount: number;
    remainingAmount: number;
    status: string;
  } | null;
  transactionInventoryItems?: TransactionInventoryItem[];
}

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  paymentMethod?: PaymentMethod;
  category?: string;
  date: string; // ISO date string
  employeeVendorName?: string;
  notes?: string;
}

export interface CreateIncomeInput {
  amount: number;
  paymentMethod: PaymentMethod;
  category?: string;
  date: string; // ISO date string
  notes?: string;
}

export interface CreateExpenseInput {
  amount: number;
  category?: string;
  date: string; // ISO date string
  employeeVendorName?: string;
  notes?: string;
}

export interface IncomeFormData {
  date: Date;
  amount: string; // String for form input, converted to number on submit
  paymentMethod: PaymentMethod;
  category: string;
  notes: string;
}

export interface SalaryExpenseFormData {
  date: Date;
  amount: string; // String for form input, converted to number on submit
  employee_name: string;
  notes: string;
}

export interface PurchaseExpenseFormData {
  date: Date;
  amount: string; // String for form input, converted to number on submit
  vendorName: string;
  addToInventory: boolean;
  itemName: string;
  quantity: string; // String for form input, converted to number on submit
  unit: InventoryUnit;
  notes: string;
}

export interface CreatePurchaseExpenseInput {
  date: string; // ISO date string
  amount: number;
  vendorName: string;
  addToInventory: boolean;
  itemName?: string;
  quantity?: number;
  unit?: InventoryUnit;
  notes?: string;
}

export interface UpdateTransactionInput {
  type?: TransactionType;
  amount?: number;
  paymentMethod?: PaymentMethod;
  category?: string;
  date?: string; // ISO date string
  employeeVendorName?: string;
  notes?: string;
}

export interface TransactionFilters {
  branchId?: string;
  type?: TransactionType;
  category?: string;
  paymentMethod?: PaymentMethod;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedTransactionsResponse {
  data: Transaction[];
  pagination: PaginationMeta;
}

export interface DashboardSummary {
  date: string; // ISO date string
  branchId: string | null;
  income_cash: number;
  income_master: number;
  total_income: number;
  total_expense: number;
  net: number;
}

export interface DashboardSummaryFilters {
  date?: string; // ISO date string, defaults to today
  branchId?: string; // Optional, admin only
}
