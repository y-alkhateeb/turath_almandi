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
  EmployeeStatus,
  InventoryOperationType,
  DiscountType,
  EmployeeAdjustmentType,
  EmployeeAdjustmentStatus,
} from './enum';
import type { AccountPayable } from './payables.types';
import type { AccountReceivable } from './receivables.types';

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
 * Matches backend User model from Prisma schema
 */
export interface User {
  id: string;
  username: string;
  role: UserRole;
  branchId: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedBy: string | null;
  createdAt: string;
  updatedAt: string;
  // Optional relation - included when fetched with branch
  branch?: BranchRelation | null;
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
  };
  access_token: string;
  refresh_token: string;
}

// ============================================
// BRANCH ENTITY
// ============================================

/**
 * Branch entity
 * Matches backend Branch model from Prisma schema
 */
export interface Branch {
  id: string;
  name: string;
  location: string;
  managerName: string;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchInput {
  name: string;
  location: string;
  managerName: string;
}

export interface UpdateBranchInput {
  name?: string;
  location?: string;
  managerName?: string;
  isDeleted?: boolean;
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
 * Contact relation (minimal select)
 * Used in Transaction responses
 */
export interface ContactRelation {
  id: string;
  name: string;
  type: string;
}

/**
 * Employee relation (minimal select)
 * Used in Transaction responses
 */
export interface EmployeeRelation {
  id: string;
  name: string;
  position: string;
}

/**
 * Transaction inventory item
 * Links transaction to multiple inventory items
 */
export interface TransactionInventoryItem {
  id: string;
  transactionId: string;
  inventoryItemId: string;
  quantity: number;
  operationType: InventoryOperationType;
  unitPrice: number;
  subtotal: number;
  discountType: DiscountType | null;
  discountValue: number | null;
  total: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  deletedBy: string | null;
  isDeleted: boolean;
  inventoryItem?: InventoryItemRelation;
}

/**
 * Transaction item DTO for creating multi-item transactions
 * Matches backend TransactionItemDto
 */
export interface TransactionItemDto {
  inventoryItemId: string;
  quantity: number;
  unitPrice: number;
  operationType: InventoryOperationType;
  discountType?: DiscountType;
  discountValue?: number;
  notes?: string;
}

/**
 * Transaction entity
 * Matches backend Transaction model and service responses
 */
export interface Transaction {
  id: string;
  branchId: string | null;
  type: TransactionType;
  amount: number;
  paymentMethod: PaymentMethod | null;
  category: string;
  date: string;
  notes: string | null;
  inventoryItemId: string | null;
  paidAmount: number | null;
  totalAmount: number | null;
  discountType: string | null;
  discountValue: number | null;
  discountReason: string | null;
  subtotal: number | null;
  contactId: string | null;
  linkedPayableId: string | null;
  employeeId: string | null;
  linkedReceivableId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  deletedBy: string | null;
  isDeleted: boolean;
  // Relations
  branch?: BranchRelation;
  creator?: UserRelation;
  inventoryItem?: InventoryItemRelation | null;
  contact?: ContactRelation;
  employee?: EmployeeRelation;
  linkedPayable?: AccountPayable;
  linkedReceivable?: AccountReceivable;
  transactionInventoryItems?: TransactionInventoryItem[];
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
  amount?: number;
  paymentMethod?: PaymentMethod;
  items?: TransactionItemDto[];
  discountType?: string;
  discountValue?: number;
  discountReason?: string;
  category?: string;
  date: string;
  notes?: string;
  branchId?: string;
  employeeId?: string;
  paidAmount?: number;
  contactId?: string;
  payableDueDate?: string;
}

export interface UpdateTransactionInput {
  type?: TransactionType;
  amount?: number;
  paymentMethod?: PaymentMethod;
  category?: string;
  date?: string;
  notes?: string;
  discountType?: string;
  discountValue?: number;
  discountReason?: string;
  transactionInventoryItems?: Array<{
    id: string;
    quantity?: number;
    unitPrice?: number;
    notes?: string;
  }>;
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
 * InventorySubUnit relation (minimal select)
 * Used in InventoryItem responses
 */
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
  costPerUnit: number; // سعر الشراء - Decimal in DB, returned as number
  sellingPrice: number | null; // سعر البيع - Decimal in DB, returned as number
  autoAdded: boolean; // True if auto-added via transaction, false if manually added
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
  costPerUnit: number; // سعر الشراء
  sellingPrice?: number | null; // سعر البيع
  notes?: string;
  branchId?: string;
}

export interface UpdateInventoryInput {
  name?: string;
  quantity?: number;
  unit?: InventoryUnit;
  costPerUnit?: number; // سعر الشراء
  sellingPrice?: number | null; // سعر البيع
  notes?: string;
}

/**
 * Input for recording consumption/damage of inventory
 * Matches backend RecordConsumptionDto (without inventoryItemId - passed as route param)
 */
export interface RecordConsumptionInput {
  quantity: number;
  unit: InventoryUnit;
  reason?: string;
  consumedAt: string; // ISO date string, required by backend
}

/**
 * Item in daily consumption summary
 */
export interface ConsumptionSummaryItem {
  inventoryItemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  reason?: string;
}

/**
 * Daily consumption summary response
 * Matches backend DailyConsumptionSummary interface
 */
export interface DailyConsumptionSummary {
  date: string;
  totalConsumptions: number;
  itemsConsumed: ConsumptionSummaryItem[];
}

/**
 * Consumption history item (with relations)
 * Response from GET /inventory/:id/consumption-history
 */
export interface ConsumptionHistoryItem extends InventoryConsumption {
  recorder?: UserRelation;
  branch?: BranchRelation;
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

// ============================================
// DASHBOARD ENTITY
// ============================================

// Dashboard types moved to api.ts as they are API responses, not database entities

// ============================================
// USER MANAGEMENT (for admin)
// ============================================

export interface UserWithBranch extends User {
  branch: BranchRelation | null;
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
  isDeleted?: boolean;
  password?: string;
}

// ============================================
// EMPLOYEE & HR ENTITIES
// ============================================

/**
 * Employee Adjustment entity
 * Matches backend EmployeeAdjustment model (bonuses, deductions, advances)
 */
export interface EmployeeAdjustment {
  id: string;
  employeeId: string;
  type: EmployeeAdjustmentType;
  amount: number;
  date: string; // ISO date string
  description: string | null;
  status: EmployeeAdjustmentStatus;
  salaryPaymentId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  deletedBy: string | null;
  isDeleted: boolean;
  // Optional relations
  employee?: Employee;
  salaryPayment?: SalaryPayment;
  creator?: UserRelation;
}

/**
 * Salary Payment entity
 * Matches backend SalaryPayment model
 */
export interface SalaryPayment {
  id: string;
  employeeId: string;
  amount: number;
  paymentDate: string; // ISO date string
  notes: string | null;
  transactionId: string | null;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  deletedBy: string | null;
  isDeleted: boolean;
  // Optional relations
  employee?: Employee;
  transaction?: Transaction;
  recorder?: UserRelation;
  adjustments?: EmployeeAdjustment[];
}

/**
 * Employee entity
 * Matches backend Employee model and service responses
 */
export interface Employee {
  id: string;
  branchId: string;
  name: string;
  status: EmployeeStatus;
  position: string;
  baseSalary: number; // Prisma Decimal is number in frontend
  allowance: number;
  hireDate: string; // ISO date string
  resignDate: string | null;
  createdBy: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  deletedAt: string | null;
  deletedBy: string | null;
  isDeleted: boolean;
  // Optional relations
  branch?: BranchRelation;
  creator?: UserRelation;
  salaryPayments?: SalaryPayment[];
  adjustments?: EmployeeAdjustment[];
}

// ============================================
// EMPLOYEE INPUT TYPES
// ============================================

export interface CreateEmployeeInput {
  name: string;
  position: string;
  baseSalary: number;
  allowance?: number;
  hireDate: string;
  branchId?: string;
  status?: EmployeeStatus;
}

export interface UpdateEmployeeInput {
  name?: string;
  position?: string;
  baseSalary?: number;
  allowance?: number;
  hireDate?: string;
  status?: EmployeeStatus;
}

export interface ResignEmployeeInput {
  resignDate: string;
}

// ============================================
// EMPLOYEE FILTERS
// ============================================

export interface EmployeeFilters {
  status?: EmployeeStatus;
  branchId?: string;
  search?: string;
}

// ============================================
// PAYROLL INPUT TYPES
// ============================================

export interface CreateAdjustmentInput {
  employeeId: string;
  type: EmployeeAdjustmentType;
  amount: number;
  date: string; // ISO date string
  description?: string;
}

export interface PaySalaryInput {
  employeeId: string;
  paymentDate: string; // ISO date string
  salaryMonth: string; // YYYY-MM
  paymentMethod: 'CASH';
  notes?: string;
}

export interface SalaryDetails {
  employeeId: string;
  month: string; // YYYY-MM
  baseSalary: number;
  allowance: number;
  bonuses: number;
  deductions: number;
  advances: number;
  netSalary: number;
  isPaid: boolean;
  adjustments: EmployeeAdjustment[];
}
