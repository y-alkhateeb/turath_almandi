/**
 * Contact Service
 * Contact CRUD operations and summaries
 *
 * Endpoints:
 * - GET /contacts?filters → PaginatedResponse<Contact>
 * - GET /contacts/:id → ContactWithCounts
 * - POST /contacts → Contact (CreateContactDto)
 * - PATCH /contacts/:id → Contact (UpdateContactDto)
 * - DELETE /contacts/:id → void
 * - GET /contacts/summary → ContactsSummary
 *
 * All types match backend DTOs exactly. No any types.
 */

import apiClient from '../apiClient';
import type {
  Contact,
  ContactWithCounts,
  CreateContactDto,
  UpdateContactDto,
  QueryContactsDto,
  ContactsSummary,
} from '#/contacts.types';
import type { PaginatedResponse } from '#/api';

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Contact API endpoints enum
 * Centralized endpoint definitions
 */
export enum ContactApiEndpoints {
  Base = '/contacts',
  ById = '/contacts/:id',
  Summary = '/contacts/summary',
}

// ============================================
// CONTACT SERVICE METHODS
// ============================================

/**
 * Get all contacts with pagination and filters
 * GET /contacts
 *
 * Supports filtering by:
 * - type: ContactType (SUPPLIER | CUSTOMER | BOTH | OTHER)
 * - branchId: UUID (accountants auto-filtered to their branch)
 * - search: string (searches name, email, phone)
 * - isActive: boolean (default: true)
 * - page: number (default: 1)
 * - limit: number (default: 50)
 *
 * Backend behavior:
 * - Accountants: Auto-filtered to their assigned branch
 * - Admins: Can filter by any branch or see all
 * - Results ordered by createdAt DESC
 *
 * @param filters - Optional query filters
 * @returns PaginatedResponse<Contact> with contacts and pagination meta
 * @throws ApiError on 401 (not authenticated)
 */
export const getAll = (filters?: QueryContactsDto): Promise<PaginatedResponse<Contact>> => {
  return apiClient.get<PaginatedResponse<Contact>>({
    url: ContactApiEndpoints.Base,
    params: filters,
  });
};

/**
 * Get single contact by ID
 * GET /contacts/:id
 *
 * Backend validation:
 * - Accountants can only access contacts from their branch
 * - Admins can access any contact
 * - Returns contact with payables/receivables counts
 *
 * @param id - Contact UUID
 * @returns ContactWithCounts (includes _count for payables/receivables)
 * @throws ApiError on 404 (not found) or 403 (no access)
 */
export const getById = (id: string): Promise<ContactWithCounts> => {
  return apiClient.get<ContactWithCounts>({
    url: ContactApiEndpoints.ById.replace(':id', id),
  });
};

/**
 * Create a new contact
 * POST /contacts
 *
 * Backend validation:
 * - name: required, max 200 chars
 * - type: required ContactType enum
 * - phone: optional, max 20 chars, valid format
 * - email: optional, valid email format
 * - creditLimit: optional decimal
 * - branchId: optional for admins, auto-assigned for accountants
 *
 * Business rules:
 * - Accountants can only create for their branch
 * - Admins can specify branch or leave null (cross-branch)
 * - No duplicate name within same branch
 *
 * @param data - CreateContactDto
 * @returns Created Contact
 * @throws ApiError on 400 (validation), 409 (duplicate name in branch)
 */
export const create = (data: CreateContactDto): Promise<Contact> => {
  return apiClient.post<Contact>({
    url: ContactApiEndpoints.Base,
    data,
  });
};

/**
 * Update a contact
 * PATCH /contacts/:id
 *
 * Backend validation:
 * - All fields optional (partial update)
 * - Same validation rules as create
 * - Cannot change contact if from different branch (accountants)
 *
 * Business rules:
 * - Accountants can only update their branch contacts
 * - Admins can update any contact
 * - No duplicate name within same branch
 *
 * @param id - Contact UUID
 * @param data - UpdateContactDto (partial)
 * @returns Updated Contact
 * @throws ApiError on 404 (not found), 403 (no access), 409 (duplicate name)
 */
export const update = (id: string, data: UpdateContactDto): Promise<Contact> => {
  return apiClient.patch<Contact>({
    url: ContactApiEndpoints.ById.replace(':id', id),
    data,
  });
};

/**
 * Delete a contact (soft delete)
 * DELETE /contacts/:id
 *
 * Backend validation:
 * - Accountants can only delete their branch contacts
 * - Admins can delete any contact
 * - Cannot delete if has linked payables or receivables
 *
 * Business rules:
 * - Sets deletedAt, deletedBy, isDeleted = true
 * - Prevents deletion if contact has active payables/receivables
 *
 * @param id - Contact UUID
 * @returns void
 * @throws ApiError on 404 (not found), 403 (no access), 400 (has linked records)
 */
export const remove = (id: string): Promise<void> => {
  return apiClient.delete<void>({
    url: ContactApiEndpoints.ById.replace(':id', id),
  });
};

/**
 * Get contacts summary statistics
 * GET /contacts/summary
 *
 * Returns statistics:
 * - total: total count
 * - active: active count
 * - inactive: inactive count
 * - byType: breakdown by ContactType (suppliers, customers, both, other)
 *
 * Backend behavior:
 * - Accountants: Stats for their branch only
 * - Admins: Can filter by branch or see all
 *
 * @param branchId - Optional branch UUID for admins
 * @returns ContactsSummary
 * @throws ApiError on 401 (not authenticated)
 */
export const getSummary = (branchId?: string): Promise<ContactsSummary> => {
  return apiClient.get<ContactsSummary>({
    url: ContactApiEndpoints.Summary,
    params: branchId ? { branchId } : undefined,
  });
};

// ============================================
// EXPORT DEFAULT SERVICE
// ============================================

const contactService = {
  getAll,
  getById,
  create,
  update,
  remove,
  getSummary,
};

export default contactService;
