/**
 * Debt Type Definitions
 * Based on backend Prisma schema and DTOs
 */

export enum DebtStatus {
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amountPaid: number;
  paymentDate: string; // ISO date string
  notes: string | null;
  recordedBy: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  branchId: string;
  creditorName: string;
  originalAmount: number;
  remainingAmount: number;
  date: string; // ISO date string
  dueDate: string; // ISO date string
  status: DebtStatus;
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
  payments?: DebtPayment[];
}

export interface CreateDebtInput {
  creditorName: string;
  amount: number;
  date: string; // ISO date string
  dueDate: string; // ISO date string
  notes?: string;
}

export interface DebtFormData {
  creditorName: string;
  amount: string; // String for form input, converted to number on submit
  date: Date;
  dueDate: Date;
  notes: string;
  branchId?: string; // Optional - for admins to select branch, auto-filled for accountants
}

export interface PayDebtInput {
  amountPaid: number;
  paymentDate: string; // ISO date string
  notes?: string;
}

export interface PayDebtFormData {
  amountPaid: string; // String for form input, converted to number on submit
  paymentDate: string; // String for form input (YYYY-MM-DD format)
  notes: string;
}
