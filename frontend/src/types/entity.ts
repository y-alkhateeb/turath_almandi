/**
 * Entity type definitions
 * Domain models for the application
 *
 * IMPORTANT: These types match the backend Prisma schema and response DTOs exactly.
 * All nullable fields use `| null` (not `| undefined`) to match database nullability.
 */

import type {
  UserRole,
  TransactionType,
  PaymentMethod,
  Currency,
  DebtStatus,
  InventoryUnit,
  NotificationSeverity,
  DisplayMethod,
} from './enum';

// ============================================
// USER & AUTH ENTITIES
// ============================================

/**
 * Branch relation object (minimal select)
 * Used in User and other entities
 */
export interface BranchRelation {
  id: string;
  name: string;
  location: string;
}

/**
 * User relation object (minimal select)
 * Used in entities that have creator, recordedBy, etc.
 */
export interface UserRelation {
  id: string;
  username: string;
  role: UserRole;
}

/**
 * User entity
 * Matches backend User model and service responses
 */
export interface User {
  id: string;
  username: string;
  role: UserRole;
  branchId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Optional relation - included when fetched with branch
  branch?: BranchRelation;
}

export interface UserToken {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Auth response from login endpoint
 * Matches LoginResponseDto from backend
 */
export interface AuthResponse {
  user: {
    id: string;
    username: string;
    role: string;
    branchId: string | null;
    isActive: boolean;
  };
  access_token: string;
  refresh_token: string;
}

// ============================================
// BRANCH ENTITY
// ============================================

/**
 * Branch entity
 * Matches backend Branch model
 */
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

/**
 * Inventory item relation (minimal select)
 * Used in Transaction responses
 */
export interface InventoryItemRelation {
  id: string;
  name: string;
  quantity: number;
  unit: InventoryUnit;
}

/**
 * Transaction entity
 * Matches backend Transaction model and service responses
 */
export interface Transaction {
  id: string;
  branchId: string;
  type: TransactionType;
  amount: number; // Decimal in DB, returned as number
  currency: Currency;
  paymentMethod: PaymentMethod | null;
  category: string;
  date: string; // ISO date string
  employeeVendorName: string;
  notes: string | null;
  inventoryItemId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  // Relations - included when fetched with relations
  branch?: BranchRelation;
  creator?: UserRelation;
  inventoryItem?: InventoryItemRelation | null;
}

export interface TransactionFilters {
  type?: TransactionType;
  category?: string;
  paymentMethod?: PaymentMethod;
  branchId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  currency?: Currency;
  paymentMethod?: PaymentMethod;
  category?: string;
  date: string;
  employeeVendorName?: string;
  notes?: string;
}

export interface UpdateTransactionInput {
  amount?: number;
  currency?: Currency;
  paymentMethod?: PaymentMethod;
  category?: string;
  date?: string;
  employeeVendorName?: string;
  notes?: string;
}

// ============================================
// DEBT ENTITY
// ============================================

/**
 * DebtPayment entity
 * Matches backend DebtPayment model and service responses
 */
export interface DebtPayment {
  id: string;
  debtId: string;
  amountPaid: number; // Decimal in DB, returned as number
  currency: Currency;
  paymentDate: string; // ISO date string
  notes: string | null;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
  // Relations - included when fetched with relations
  recorder?: UserRelation;
}

/**
 * Debt entity
 * Matches backend Debt model and service responses
 */
export interface Debt {
  id: string;
  branchId: string;
  creditorName: string;
  originalAmount: number; // Decimal in DB, returned as number
  remainingAmount: number; // Decimal in DB, returned as number
  currency: Currency;
  date: string; // ISO date string
  dueDate: string | null; // ISO date string, nullable
  status: DebtStatus;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  // Relations - included when fetched with relations
  branch?: BranchRelation;
  creator?: UserRelation;
  payments?: DebtPayment[];
}

export interface CreateDebtInput {
  creditorName: string;
  amount: number;
  currency?: Currency;
  date: string;
  dueDate: string;
  notes?: string;
  branchId?: string;
}

export interface PayDebtInput {
  amountPaid: number;
  currency?: Currency;
  paymentDate: string;
  notes?: string;
}

// ============================================
// INVENTORY ENTITY
// ============================================

/**
 * Transaction relation for inventory (minimal select)
 * Used in InventoryItem responses
 */
export interface TransactionForInventory {
  id: string;
  amount: number;
  date: string;
  employeeVendorName: string;
  category: string;
}

/**
 * InventoryConsumption entity
 * Matches backend InventoryConsumption model
 */
export interface InventoryConsumption {
  id: string;
  inventoryItemId: string;
  branchId: string;
  quantity: number; // Decimal in DB, returned as number
  unit: InventoryUnit;
  reason: string | null;
  consumedAt: string;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  recorder?: UserRelation;
}

/**
 * InventoryItem entity
 * Matches backend InventoryItem model and service responses
 */
export interface InventoryItem {
  id: string;
  branchId: string;
  name: string;
  quantity: number; // Decimal in DB, returned as number
  unit: InventoryUnit;
  costPerUnit: number; // Decimal in DB, returned as number
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  // Relations - included when fetched with relations
  branch?: BranchRelation;
  transactions?: TransactionForInventory[];
  consumptions?: InventoryConsumption[];
}

export interface InventoryFilters {
  unit?: InventoryUnit;
  branchId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateInventoryInput {
  name: string;
  quantity: number;
  unit: InventoryUnit;
  costPerUnit: number;
  notes?: string;
  branchId?: string;
}

export interface UpdateInventoryInput {
  name?: string;
  quantity?: number;
  unit?: InventoryUnit;
  costPerUnit?: number;
  notes?: string;
}

export interface RecordConsumptionInput {
  quantity: number;
  reason?: string;
  consumedAt?: string;
}

// ============================================
// NOTIFICATION ENTITY
// ============================================

/**
 * Notification entity
 * Matches backend Notification model and service responses
 */
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  relatedId: string | null;
  relatedType: string | null;
  branchId: string | null;
  createdBy: string;
  isRead: boolean;
  readAt: string | null; // ISO timestamp, nullable
  severity: NotificationSeverity;
  createdAt: string;
  updatedAt: string;
  // Relations - included when fetched with relations
  branch?: BranchRelation | null;
  creator?: UserRelation;
}

/**
 * NotificationSetting entity
 * Matches backend NotificationSetting model and service responses
 */
export interface NotificationSettings {
  id: string;
  userId: string;
  notificationType: string;
  isEnabled: boolean;
  minAmount: number | null; // Decimal in DB, returned as number, nullable
  selectedBranches: string[] | null; // JSON in DB, parsed as array, nullable
  displayMethod: DisplayMethod;
  createdAt: string;
  updatedAt: string;
  // Relations - included when fetched with relations
  user?: UserRelation;
}

export interface UpdateNotificationSettingsInput {
  notificationType: string;
  isEnabled?: boolean;
  minAmount?: number;
  selectedBranches?: string[];
  displayMethod?: DisplayMethod;
}

// ============================================
// AUDIT LOG ENTITY
// ============================================

/**
 * AuditLog entity
 * Matches backend AuditLog model and service responses
 */
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: Record<string, unknown>; // JSON in DB
  ipAddress: string | null;
  createdAt: string;
  updatedAt: string;
  // Relations - included when fetched with relations
  user?: UserRelation;
}

export interface QueryAuditLogsInput {
  entityType?: string;
  entityId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
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
  branch: BranchRelation;
}

export interface CreateUserInput {
  username: string;
  password: string;
  role: UserRole;
  branchId?: string | null;
}

export interface UpdateUserInput {
  role?: UserRole;
  branchId?: string | null;
  isActive?: boolean;
}
