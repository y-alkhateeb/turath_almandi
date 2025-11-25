/**
 * Enumerations for the application
 *
 * IMPORTANT: These enums match the backend Prisma schema and service enums exactly.
 * Using const enums for compile-time and runtime type safety.
 */

// ============================================
// BASIC ENUMS
// ============================================

// Basic status enum (frontend-only)
export enum BasicStatus {
  DISABLE = 0,
  ENABLE = 1,
}

// API result status (frontend-only)
export enum ResultStatus {
  SUCCESS = 0,
  ERROR = -1,
  TIMEOUT = 401,
}

// ============================================
// PRISMA SCHEMA ENUMS
// ============================================

/**
 * User roles
 * Matches backend Prisma enum: UserRole
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  ACCOUNTANT = 'ACCOUNTANT',
}

/**
 * Transaction types
 * Matches backend Prisma enum: TransactionType
 */
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

/**
 * Payment methods
 * Matches backend Prisma enum: PaymentMethod
 */
export enum PaymentMethod {
  CASH = 'CASH',
  MASTER = 'MASTER',
}

/**
 * Currency types
 * NOTE: Currency enum has been REMOVED from frontend enums.
 * Currency is now managed via global settings (CurrencySettings).
 * The Currency enum still exists in Prisma schema for historical data integrity.
 * For type-safety, use the Currency type from backend-generated types (#/entity).
 */

/**
 * Debt status
 * Matches backend Prisma enum: DebtStatus
 */
export enum DebtStatus {
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
}

/**
 * Inventory units
 * Matches backend Prisma enum: InventoryUnit
 */
export enum InventoryUnit {
  KG = 'KG',
  PIECE = 'PIECE',
  LITER = 'LITER',
  OTHER = 'OTHER',
}

/**
 * Employee status
 * Matches backend Prisma enum: EmployeeStatus
 */
export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  RESIGNED = 'RESIGNED',
}

/**
 * Advance status (حالة السلفة)
 * Matches backend Prisma enum: AdvanceStatus
 */
export enum AdvanceStatus {
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

/**
 * Notification severity levels
 * Matches backend Prisma enum: NotificationSeverity
 */
export enum NotificationSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * Notification display methods
 * Matches backend Prisma enum: DisplayMethod
 */
export enum DisplayMethod {
  POPUP = 'POPUP',
  TOAST = 'TOAST',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

// ============================================
// BACKEND SERVICE ENUMS
// ============================================

/**
 * Notification types
 * Matches notification types used in backend services
 * These are string literals used in the notification.type field
 */
export enum NotificationType {
  OVERDUE_DEBT = 'overdue_debt',
  NEW_DEBT = 'new_debt',
  DEBT_PAYMENT = 'debt_payment',
  DEBT_PAID = 'debt_paid',
  LARGE_TRANSACTION = 'large_transaction',
  BACKUP_REMINDER = 'backup_reminder',
}

/**
 * Audit log actions
 * Matches backend enum: AuditAction
 * From: backend/src/common/audit-log/audit-log.service.ts
 */
export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
}

/**
 * Audit log entity types
 * Matches backend enum: AuditEntityType
 * From: backend/src/common/audit-log/audit-log.service.ts
 */
export enum AuditEntityType {
  USER = 'USER',
  BRANCH = 'BRANCH',
  TRANSACTION = 'TRANSACTION',
  DEBT = 'DEBT',
  DEBT_PAYMENT = 'DEBT_PAYMENT',
  INVENTORY_ITEM = 'INVENTORY_ITEM',
  INVENTORY = 'INVENTORY',
  EMPLOYEE = 'EMPLOYEE',
  SALARY_PAYMENT = 'SALARY_PAYMENT',
  SALARY_INCREASE = 'SALARY_INCREASE',
  BONUS = 'BONUS',
}

// ============================================
// THEME ENUMS (re-exported)
// ============================================

// Theme enums (re-exported from theme/type.ts)
export { ThemeMode, ThemeColorPresets, ThemeLayout } from '../theme/type';
export type { Direction } from '../theme/type';
