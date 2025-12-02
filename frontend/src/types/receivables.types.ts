import { DebtStatus, PaymentMethod } from './enum';

export interface AccountReceivable {
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
  linkedSaleTransactionId: string | null;
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
 * Collection record for a receivable
 * Matches backend ReceivableCollection structure
 */
export interface ReceivableCollection {
  id: string;
  receivableId: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  notes: string | null;
  transactionId: string | null;
  createdBy: string;
  createdAt: string;
}

export interface AccountReceivableWithCollections extends AccountReceivable {
  collections: ReceivableCollection[];
}

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

export interface UpdateReceivableDto {
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
 * Collect receivable DTO
 * Matches backend CollectReceivableDto exactly
 */
export interface CollectReceivableDto {
  amountPaid: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
}

export interface QueryReceivablesDto {
  status?: DebtStatus;
  contactId?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ReceivablesSummary {
  totalAmount: number;
  byStatus: {
    active: number;
    paid: number;
    partial: number;
  };
}
