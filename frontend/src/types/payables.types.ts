import { DebtStatus, PaymentMethod } from './enum';

export interface AccountPayable {
  id: string;
  contactId: string;
  originalAmount: number;
  remainingAmount: number;
  date: string;
  dueDate: string | null;
  status: DebtStatus;
  description: string | null;
  invoiceNumber: string | null;
  notes: string | null;
  linkedPurchaseTransactionId: string | null;
  branchId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  deletedBy: string | null;
  isDeleted: boolean;
  contact?: {
    id: string;
    name: string;
  };
}

/**
 * Payment record for a payable
 * Matches backend PayablePayment structure
 */
export interface PayablePayment {
  id: string;
  payableId: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  notes: string | null;
  transactionId: string | null;
  createdBy: string;
  createdAt: string;
}

export interface AccountPayableWithPayments extends AccountPayable {
  payments: PayablePayment[];
}

export interface CreatePayableDto {
  contactId: string;
  amount: number;
  date: string;
  dueDate?: string;
  description?: string;
  invoiceNumber?: string;
  notes?: string;
  branchId?: string;
  linkedPurchaseTransactionId?: string;
}

export interface UpdatePayableDto {
  contactId?: string;
  amount?: number;
  date?: string;
  dueDate?: string;
  description?: string;
  invoiceNumber?: string;
  notes?: string;
  status?: DebtStatus;
}

/**
 * Pay payable DTO
 * Matches backend PayPayableDto exactly
 */
export interface PayPayableDto {
  amountPaid: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
}

export interface QueryPayablesDto {
  status?: DebtStatus;
  contactId?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PayablesSummary {
  totalAmount: number;
  byStatus: {
    active: number;
    paid: number;
    partial: number;
  };
}
