/**
 * Enumerations for the application
 */

// Basic status enum
export enum BasicStatus {
  DISABLE = 0,
  ENABLE = 1,
}

// API result status
export enum ResultStatus {
  SUCCESS = 0,
  ERROR = -1,
  TIMEOUT = 401,
}

// User roles
export enum UserRole {
  ADMIN = 'ADMIN',
  ACCOUNTANT = 'ACCOUNTANT',
}

// Transaction types
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

// Payment methods
export enum PaymentMethod {
  CASH = 'CASH',
  MASTER = 'MASTER',
}

// Debt status
export enum DebtStatus {
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
}

// Inventory units
export enum InventoryUnit {
  KG = 'KG',
  PIECE = 'PIECE',
  LITER = 'LITER',
  OTHER = 'OTHER',
}

// Theme enums (re-exported from theme/type.ts)
export { ThemeMode, ThemeColorPresets, ThemeLayout } from '../theme/type';
export type { Direction } from '../theme/type';
