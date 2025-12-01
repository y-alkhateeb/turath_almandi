import { PayableStatus, PaymentMethod } from './enum';
import { Branch, User } from './entity';
import { ContactSelect } from './contacts.types';

/**
 * Account Payable entity (money we owe to suppliers)
 */
export interface AccountPayable {
  id: string;
  contactId: string;
  contact?: ContactSelect;
  originalAmount: number;
  remainingAmount: number;
  date: string;
  dueDate?: string;
  status: PayableStatus;
  description?: string;
  invoiceNumber?: string;
  notes?: string;
  branchId?: string;
  branch?: Branch;
  linkedPurchaseTransactionId?: string;
  createdBy: string;
  creator?: User;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  deletedBy?: string;
  isDeleted: boolean;
}

/**
 * Payable Payment entity
 */
export interface PayablePayment {
  id: string;
  accountPayableId: string;
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
 * Account Payable with payments
 */
export interface AccountPayableWithPayments extends AccountPayable {
  payments: PayablePayment[];
}

/**
 * Create payable DTO
 */
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

/**
 * Update payable DTO
 */
export interface UpdatePayableDto {
  date?: string;
  dueDate?: string;
  description?: string;
  invoiceNumber?: string;
  notes?: string;
  status?: PayableStatus;
}

/**
 * Pay payable DTO
 */
export interface PayPayableDto {
  amountPaid: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
}

/**
 * Query payables DTO
 */
export interface QueryPayablesDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: PayableStatus;
  contactId?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Payables summary
 */
export interface PayablesSummary {
  total: number;
  byStatus: {
    pending: number;
    partial: number;
    paid: number;
  };
  amounts: {
    total: number;
    remaining: number;
    paid: number;
  };
}
