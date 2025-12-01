/**
 * Local enum definitions that mirror Prisma schema enums.
 * These are used as fallback types for TypeScript compilation
 * when Prisma client types might not be fully available.
 *
 * Using const objects with type unions for compatibility with
 * Prisma's generated $Enums types (which are also string literals).
 *
 * IMPORTANT: Keep these in sync with prisma/schema.prisma
 */

export const UserRole = {
  ADMIN: 'ADMIN',
  ACCOUNTANT: 'ACCOUNTANT',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const TransactionType = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
} as const;
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export const PaymentMethod = {
  CASH: 'CASH',
  MASTER: 'MASTER',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const DebtStatus = {
  ACTIVE: 'ACTIVE',
  PAID: 'PAID',
  PARTIAL: 'PARTIAL',
} as const;
export type DebtStatus = (typeof DebtStatus)[keyof typeof DebtStatus];

export const InventoryUnit = {
  KG: 'KG',
  PIECE: 'PIECE',
  LITER: 'LITER',
  OTHER: 'OTHER',
} as const;
export type InventoryUnit = (typeof InventoryUnit)[keyof typeof InventoryUnit];

export const InventoryOperationType = {
  PURCHASE: 'PURCHASE',
  CONSUMPTION: 'CONSUMPTION',
} as const;
export type InventoryOperationType = (typeof InventoryOperationType)[keyof typeof InventoryOperationType];

export const NotificationSeverity = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL',
} as const;
export type NotificationSeverity = (typeof NotificationSeverity)[keyof typeof NotificationSeverity];

export const DisplayMethod = {
  POPUP: 'POPUP',
  TOAST: 'TOAST',
  EMAIL: 'EMAIL',
  SMS: 'SMS',
} as const;
export type DisplayMethod = (typeof DisplayMethod)[keyof typeof DisplayMethod];

export const EmployeeStatus = {
  ACTIVE: 'ACTIVE',
  RESIGNED: 'RESIGNED',
} as const;
export type EmployeeStatus = (typeof EmployeeStatus)[keyof typeof EmployeeStatus];

export const AdvanceStatus = {
  ACTIVE: 'ACTIVE',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
} as const;
export type AdvanceStatus = (typeof AdvanceStatus)[keyof typeof AdvanceStatus];

export const ReportType = {
  FINANCIAL: 'FINANCIAL',
  DEBTS: 'DEBTS',
  INVENTORY: 'INVENTORY',
  SALARY: 'SALARY',
  BRANCHES: 'BRANCHES',
  CUSTOM: 'CUSTOM',
} as const;
export type ReportType = (typeof ReportType)[keyof typeof ReportType];

export const ContactType = {
  SUPPLIER: 'SUPPLIER',
  CUSTOMER: 'CUSTOMER',
  BOTH: 'BOTH',
  OTHER: 'OTHER',
} as const;
export type ContactType = (typeof ContactType)[keyof typeof ContactType];

export const DiscountType = {
  PERCENTAGE: 'PERCENTAGE',
  AMOUNT: 'AMOUNT',
} as const;
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];
