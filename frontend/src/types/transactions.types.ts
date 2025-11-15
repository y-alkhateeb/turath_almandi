/**
 * Transaction Type Definitions
 * Based on backend Prisma schema and DTOs
 */

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum PaymentMethod {
  CASH = 'CASH',
  MASTER = 'MASTER',
}

export enum InventoryUnit {
  KG = 'KG',
  PIECE = 'PIECE',
  LITER = 'LITER',
  OTHER = 'OTHER',
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

export interface TransactionFilters {
  branchId?: string;
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
}
