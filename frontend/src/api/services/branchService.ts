/**
 * Branch Service
 * Branch CRUD operations
 *
 * Endpoints:
 * - GET /branches → Branch[] (filter by isActive)
 * - GET /branches/:id → Branch
 * - POST /branches → Branch (CreateBranchDto)
 * - PATCH /branches/:id → Branch (UpdateBranchDto)
 * - DELETE /branches/:id → void
 *
 * All types match backend DTOs exactly. No any types.
 */

import apiClient from '../apiClient';
import type { Branch, CreateBranchInput, UpdateBranchInput } from '#/entity';
import type { BranchQueryFilters } from '#/api';

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Branch API endpoints enum
 * Centralized endpoint definitions
 */
export enum BranchApiEndpoints {
  Base = '/branches',
  ById = '/branches/:id',
}

// ============================================
// BRANCH SERVICE METHODS
// ============================================

/**
 * Get all branches with optional filtering
 * GET /branches
 *
 * Backend behavior:
 * - By default, returns only active branches (isActive: true)
 * - Admin can request all branches including inactive with includeInactive=true
 * - Accountants always get only active branches regardless of filter
 *
 * @param filters - Optional query filters (branchId?, includeInactive?)
 * @returns Branch[] array
 * @throws ApiError on 401 (not authenticated)
 */
export const getAll = (filters?: BranchQueryFilters): Promise<Branch[]> => {
  return apiClient.get<Branch[]>({
    url: BranchApiEndpoints.Base,
    params: filters,
  });
};

/**
 * Get only active branches
 * GET /branches
 *
 * Convenience method that explicitly filters for active branches only
 *
 * @returns Branch[] array of active branches
 * @throws ApiError on 401 (not authenticated)
 */
export const getAllActive = (): Promise<Branch[]> => {
  return getAll({ includeInactive: false });
};

/**
 * Get all branches including inactive ones (Admin only)
 * GET /branches?includeInactive=true
 *
 * Convenience method for admins to see all branches
 *
 * @returns Branch[] array of all branches (active and inactive)
 * @throws ApiError on 401 (not authenticated), 403 (not admin)
 */
export const getAllIncludingInactive = (): Promise<Branch[]> => {
  return getAll({ includeInactive: true });
};

/**
 * Get single branch by ID
 * GET /branches/:id
 *
 * @param id - Branch UUID
 * @returns Branch with all details
 * @throws ApiError on 401 (not authenticated), 404 (branch not found)
 */
export const getOne = (id: string): Promise<Branch> => {
  return apiClient.get<Branch>({
    url: `/branches/${id}`,
  });
};

/**
 * Create new branch
 * POST /branches
 *
 * Backend validation (from CreateBranchDto):
 * - name: Required, max 200 chars, trimmed, escaped
 * - location: Required, max 500 chars, trimmed, escaped
 * - managerName: Required, max 200 chars, trimmed, escaped
 *
 * @param data - CreateBranchInput (name, location, managerName)
 * @returns Created Branch
 * @throws ApiError on 400 (validation error), 401, 403 (not admin)
 */
export const create = (data: CreateBranchInput): Promise<Branch> => {
  return apiClient.post<Branch>({
    url: BranchApiEndpoints.Base,
    data,
  });
};

/**
 * Update branch
 * PUT /branches/:id
 *
 * Backend allows partial updates of:
 * - name: Optional, max 200 chars
 * - location: Optional, max 500 chars
 * - managerName: Optional, max 200 chars
 * - isActive: Optional, boolean
 *
 * @param id - Branch UUID
 * @param data - UpdateBranchInput (name?, location?, managerName?, isActive?)
 * @returns Updated Branch
 * @throws ApiError on 400 (validation error), 401, 403 (not admin), 404 (not found)
 */
export const update = (id: string, data: UpdateBranchInput): Promise<Branch> => {
  return apiClient.put<Branch>({
    url: `/branches/${id}`,
    data,
  });
};

/**
 * Delete branch
 * DELETE /branches/:id
 *
 * Permanently deletes branch from database
 * Cannot delete branch with:
 * - Associated users
 * - Associated transactions
 * - Associated debts
 * - Associated inventory items
 *
 * @param id - Branch UUID
 * @returns void
 * @throws ApiError on 401, 403 (not admin), 404 (not found), 409 (has related records)
 */
export const deleteBranch = (id: string): Promise<void> => {
  return apiClient.delete<void>({
    url: `/branches/${id}`,
  });
};

/**
 * Activate branch
 * PATCH /branches/:id
 *
 * Helper method to activate a branch (set isActive = true)
 *
 * @param id - Branch UUID
 * @returns Updated Branch
 * @throws ApiError on 400, 401, 403, 404
 */
export const activate = (id: string): Promise<Branch> => {
  return update(id, { isActive: true });
};

/**
 * Deactivate branch
 * PATCH /branches/:id
 *
 * Helper method to deactivate a branch (set isActive = false)
 * Deactivated branches won't appear in default listings
 *
 * @param id - Branch UUID
 * @returns Updated Branch
 * @throws ApiError on 400, 401, 403, 404
 */
export const deactivate = (id: string): Promise<Branch> => {
  return update(id, { isActive: false });
};

// ============================================
// EXPORTS
// ============================================

/**
 * Branch service object with all methods
 * Use named exports or default object
 */
const branchService = {
  getAll,
  getAllActive,
  getAllIncludingInactive,
  getOne,
  create,
  update,
  delete: deleteBranch,
  activate,
  deactivate,
};

export default branchService;
