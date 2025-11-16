/**
 * Entity type definitions
 * Domain models for the application
 */

import type { UserRole, TransactionType, PaymentMethod, DebtStatus, InventoryUnit } from './enum';

// ============================================
// USER & AUTH ENTITIES
// ============================================

export interface UserToken {
  accessToken?: string;
  refreshToken?: string;
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  branchId?: string;
  isActive: boolean;
  branch?: Branch;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

// ============================================
// BRANCH ENTITY
// ============================================

export interface Branch {
  id: string;
  name: string;
  location: string;
  managerName: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchInput {
  name: string;
  location: string;
  managerName: string;
  phone: string;
}

export interface UpdateBranchInput {
  name?: string;
  location?: string;
  managerName?: string;
  phone?: string;
  isActive?: boolean;
}

// ============================================
// TRANSACTION ENTITY
// ============================================

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  date: string;
  branchId: string;
  createdById: string;
  // Expense-specific fields
  employeeName?: string;
  vendorName?: string;
  inventoryItemId?: string;
  // Relations
  branch?: Branch;
  createdBy?: User;
  inventoryItem?: InventoryItem;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFilters {
  type?: TransactionType;
  category?: string;
  paymentMethod?: PaymentMethod;
  branchId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  category: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  date: string;
  branchId: string;
  // Expense-specific
  employeeName?: string;
  vendorName?: string;
  inventoryItemId?: string;
}

export interface UpdateTransactionInput {
  amount?: number;
  category?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  date?: string;
  employeeName?: string;
  vendorName?: string;
}

// ============================================
// DEBT ENTITY
// ============================================

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  paymentDate: string;
  notes?: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  creditorName: string;
  amount: number;
  remainingAmount: number;
  date: string;
  dueDate: string;
  status: DebtStatus;
  notes?: string;
  branchId: string;
  createdById: string;
  // Relations
  branch?: Branch;
  createdBy?: User;
  payments?: DebtPayment[];
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface CreateDebtInput {
  creditorName: string;
  amount: number;
  date: string;
  dueDate: string;
  notes?: string;
  branchId: string;
}

export interface PayDebtInput {
  debtId: string;
  amount: number;
  paymentDate: string;
  notes?: string;
}

// ============================================
// INVENTORY ENTITY
// ============================================

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: InventoryUnit;
  costPerUnit: number;
  totalCost: number;
  notes?: string;
  branchId: string;
  autoAdded: boolean;
  transactionId?: string;
  // Relations
  branch?: Branch;
  transaction?: Transaction;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface InventoryFilters {
  unit?: InventoryUnit;
  branchId?: string;
  autoAdded?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateInventoryInput {
  name: string;
  quantity: number;
  unit: InventoryUnit;
  costPerUnit: number;
  notes?: string;
  branchId: string;
}

export interface UpdateInventoryInput {
  name?: string;
  quantity?: number;
  unit?: InventoryUnit;
  costPerUnit?: number;
  notes?: string;
}

// ============================================
// DASHBOARD ENTITY
// ============================================

export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  todayTransactions: number;
  revenueData: RevenueDataPoint[];
  categoryData: CategoryDataPoint[];
  recentTransactions: Transaction[];
  // Additional stats
  cashRevenue?: number;
  masterRevenue?: number;
  totalDebts?: number;
  activeDebts?: number;
  inventoryValue?: number;
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
  expenses: number;
}

export interface CategoryDataPoint {
  category: string;
  value: number;
  color?: string;
}

export interface DashboardFilters {
  date?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
}

// ============================================
// USER MANAGEMENT (for admin)
// ============================================

export interface UserWithBranch extends User {
  branch: Branch;
}

export interface CreateUserInput {
  username: string;
  password: string;
  role: UserRole;
  branchId?: string;
}

export interface UpdateUserInput {
  role?: UserRole;
  branchId?: string;
  isActive?: boolean;
}
