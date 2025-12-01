import { ContactType } from './enum';
import { Branch, User } from './entity';

/**
 * Contact entity
 * Represents suppliers, customers, and other business contacts
 */
export interface Contact {
  id: string;
  name: string;
  type: ContactType;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number;
  notes?: string;
  branchId?: string;
  branch?: Branch;
  createdBy: string;
  creator?: User;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  deletedBy?: string;
  isDeleted: boolean;
}

/**
 * Contact select (minimal data for dropdowns/selects)
 */
export interface ContactSelect {
  id: string;
  name: string;
  type: ContactType;
  phone?: string;
  email?: string;
}

/**
 * Contact extended select (includes additional fields)
 */
export interface ContactExtendedSelect extends ContactSelect {
  address?: string;
  creditLimit?: number;
}

/**
 * Contact with counts
 */
export interface ContactWithCounts extends Contact {
  _count: {
    accountsPayable: number;
    accountsReceivable: number;
  };
}

/**
 * Create contact DTO
 */
export interface CreateContactDto {
  name: string;
  type: ContactType;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number;
  notes?: string;
  branchId?: string;
}

/**
 * Update contact DTO
 */
export interface UpdateContactDto {
  name?: string;
  type?: ContactType;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number;
  notes?: string;
}

/**
 * Query contacts DTO
 */
export interface QueryContactsDto {
  page?: number;
  limit?: number;
  search?: string;
  type?: ContactType;
  branchId?: string;
}

/**
 * Contacts summary
 */
export interface ContactsSummary {
  total: number;
  byType: {
    suppliers: number;
    customers: number;
    both: number;
    other: number;
  };
}
