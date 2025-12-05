import { ContactType } from './enum';

export interface Contact {
  id: string;
  name: string;
  type: ContactType;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  creditLimit: number | null;
  branchId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  deletedBy: string | null;
  isDeleted: boolean;
}

export interface ContactWithCounts extends Contact {
  _count: {
    transactions: number;
    payables: number;
    receivables: number;
  };
}

export interface CreateContactDto {
  name: string;
  type: ContactType;
  branchId: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  creditLimit?: number;
}

export interface UpdateContactDto {
  name?: string;
  type?: ContactType;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  creditLimit?: number;
  branchId?: string;
}

export interface QueryContactsDto {
  type?: ContactType;
  branchId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ContactsSummary {
  total: number;
  byType: {
    suppliers: number;
    customers: number;
    both: number;
    other: number;
  };
}
