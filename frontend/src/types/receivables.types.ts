import { ReceivableStatus, PaymentMethod } from './enum';
import { Branch, User } from './entity';
import { ContactSelect } from './contacts.types';

/**
 * Account Receivable entity (money owed to us by customers)
 */
export interface AccountReceivable {
  id: string;
  contactId: string;
  contact?: ContactSelect;
  originalAmount: number;
  remainingAmount: number;
  date: string;
  dueDate?: string;
  status: ReceivableStatus;
  description?: string;
  invoiceNumber?: string;
  notes?: string;
  branchId?: string;
  branch?: Branch;
  linkedSaleTransactionId?: string;
  createdBy: string;
  creator?: User;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  deletedBy?: string;
  isDeleted: boolean;
}

/**
 * Receivable Payment entity
 */
export interface ReceivablePayment {
  id: string;
  accountReceivableId: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  createdBy: string;
  createdByUser?: User;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  deletedBy?: string;
  isDeleted: boolean;
}

/**
 * Account Receivable with payments
 */
export interface AccountReceivableWithPayments extends AccountReceivable {
  payments: ReceivablePayment[];
}

/**
 * Create receivable DTO
 */
export interface CreateReceivableDto {
  contactId: string;
  amount: number;
  date: string;
  dueDate?: string;
  description?: string;
  invoiceNumber?: string;
  notes?: string;
  branchId?: string;
  linkedSaleTransactionId?: string;
}

/**
 * Update receivable DTO
 */
export interface UpdateReceivableDto {
  date?: string;
  dueDate?: string;
  description?: string;
  invoiceNumber?: string;
  notes?: string;
  status?: ReceivableStatus;
}

/**
 * Collect receivable DTO
 */
export interface CollectReceivableDto {
  amountPaid: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
}

/**
 * Query receivables DTO
 */
export interface QueryReceivablesDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: ReceivableStatus;
  contactId?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Receivables summary
 */
export interface ReceivablesSummary {
  total: number;
  byStatus: {
    pending: number;
    partial: number;
    paid: number;
  };
  amounts: {
    total: number;
    remaining: number;
    collected: number;
  };
}
