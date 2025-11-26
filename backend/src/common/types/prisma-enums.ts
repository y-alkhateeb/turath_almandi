/**
 * Local enum definitions that mirror Prisma schema enums.
 * These are used as fallback types for TypeScript compilation
 * when Prisma client types might not be fully available.
 *
 * IMPORTANT: Keep these in sync with prisma/schema.prisma
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  ACCOUNTANT = 'ACCOUNTANT',
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum PaymentMethod {
  CASH = 'CASH',
  MASTER = 'MASTER',
}

export enum DebtStatus {
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
}

export enum InventoryUnit {
  KG = 'KG',
  PIECE = 'PIECE',
  LITER = 'LITER',
  OTHER = 'OTHER',
}

export enum InventoryOperationType {
  PURCHASE = 'PURCHASE',
  CONSUMPTION = 'CONSUMPTION',
}

export enum NotificationSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export enum DisplayMethod {
  POPUP = 'POPUP',
  TOAST = 'TOAST',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  RESIGNED = 'RESIGNED',
}

export enum AdvanceStatus {
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum ReportType {
  FINANCIAL = 'FINANCIAL',
  DEBTS = 'DEBTS',
  INVENTORY = 'INVENTORY',
  SALARY = 'SALARY',
  BRANCHES = 'BRANCHES',
  CUSTOM = 'CUSTOM',
}
