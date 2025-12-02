/**
 * User Service - Unified
 * All user CRUD operations (Admin only)
 *
 * Endpoints:
 * - GET /users → PaginatedResponse<UserWithBranch>
 * - GET /users/:id → UserWithBranch
 * - POST /users → UserWithBranch (CreateUserDto)
 * - PATCH /users/:id → UserWithBranch (UpdateUserDto)
 * - PATCH /users/:id/assign-branch → UserWithBranch
 * - DELETE /users/:id → void
 *
 * All types match backend DTOs exactly. No any types.
 */

import apiClient from '../apiClient';
import type { UserWithBranch, CreateUserInput, UpdateUserInput } from '#/entity';
import type { PaginatedResponse, UserQueryFilters } from '#/api';

// ============================================
// API ENDPOINTS
// ============================================

/**
 * User API endpoints enum
 * Centralized endpoint definitions
 */
export enum UserApiEndpoints {
  Base = '/users',
  ById = '/users/:id',
  AssignBranch = '/users/:id/assign-branch',
}

// ============================================
// USER SERVICE METHODS
// ============================================

/**
 * Get all users with pagination and filters
 * GET /users
 *
 * @param filters - Optional query filters (role, branchId, isActive, page, limit)
 * @returns PaginatedResponse<UserWithBranch> with users and pagination meta
 * @throws ApiError on 401 (not authenticated), 403 (not admin)
 */
export const getAll = (filters?: UserQueryFilters): Promise<PaginatedResponse<UserWithBranch>> => {
  return apiClient.get<PaginatedResponse<UserWithBranch>>({
    url: UserApiEndpoints.Base,
    params: filters,
  });
};

/**
 * Get all users without pagination (for dropdowns, etc.)
 * GET /users?limit=1000
 *
 * @returns UserWithBranch[] array
 * @throws ApiError on 401 (not authenticated), 403 (not admin)
 */
export const getAllUnpaginated = (): Promise<UserWithBranch[]> => {
  return apiClient
    .get<UserWithBranch[] | PaginatedResponse<UserWithBranch>>({
      url: UserApiEndpoints.Base,
      params: { limit: 1000 },
    })
    .then((response) => {
      // If backend returns paginated response, extract data array
      if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
        return response.data;
      }
      // Otherwise assume it's already an array
      return response as UserWithBranch[];
    });
};

/**
 * Get single user by ID
 * GET /users/:id
 *
 * @param id - User UUID
 * @returns UserWithBranch with optional branch relation
 * @throws ApiError on 401 (not authenticated), 403 (not admin), 404 (user not found)
 */
export const getOne = (id: string): Promise<UserWithBranch> => {
  return apiClient.get<UserWithBranch>({
    url: `/users/${id}`,
  });
};

/**
 * Create new user
 * POST /users
 *
 * Backend validation:
 * - username: 3-50 chars, unique
 * - password: min 8 chars, must contain uppercase, lowercase, digit, special char
 * - role: ADMIN | ACCOUNTANT
 * - branchId: optional UUID, required for ACCOUNTANT role
 *
 * @param data - CreateUserInput (username, password, role, branchId?)
 * @returns Created UserWithBranch
 * @throws ApiError on 400 (validation error), 401, 403, 409 (username exists)
 */
export const create = (data: CreateUserInput): Promise<UserWithBranch> => {
  return apiClient.post<UserWithBranch>({
    url: UserApiEndpoints.Base,
    data,
  });
};

/**
 * Update user
 * PATCH /users/:id
 *
 * Backend allows updating:
 * - password: Optional, same validation as create
 * - role: Optional, ADMIN | ACCOUNTANT
 * - branchId: Optional, UUID or null
 * Note: Backend UpdateUserDto doesn't support isDeleted directly.
 * Use delete() endpoint for soft delete or reactivate() to restore.
 *
 * @param id - User UUID
 * @param data - UpdateUserInput (password?, role?, branchId?)
 * @returns Updated UserWithBranch
 * @throws ApiError on 400 (validation error), 401, 403, 404 (user not found)
 */
export const update = (id: string, data: UpdateUserInput): Promise<UserWithBranch> => {
  // Remove isDeleted from data if present (backend doesn't support it in update)
  const { isDeleted, ...updateData } = data;
  
  return apiClient.patch<UserWithBranch>({
    url: `/users/${id}`,
    data: updateData,
  });
};

/**
 * Delete user
 * DELETE /users/:id
 *
 * Permanently deletes user from database
 * Cannot delete yourself or users with related records
 *
 * @param id - User UUID
 * @returns void
 * @throws ApiError on 401, 403, 404 (user not found), 409 (has related records)
 */
export const deleteUser = (id: string): Promise<void> => {
  return apiClient.delete<void>({
    url: `/users/${id}`,
  });
};

/**
 * Assign user to branch
 * PATCH /users/:id/assign-branch
 *
 * @param userId - User UUID
 * @param branchId - Branch UUID or null to unassign
 * @returns Updated UserWithBranch
 * @throws ApiError on 400, 401, 403, 404
 */
export const assignBranch = (userId: string, branchId: string | null): Promise<UserWithBranch> => {
  return apiClient.patch<UserWithBranch>({
    url: `/users/${userId}/assign-branch`,
    data: { branchId },
  });
};

/**
 * Reactivate a deactivated user
 * PATCH /users/:id/reactivate
 *
 * @param userId - User UUID
 * @returns Updated UserWithBranch with isActive=true
 * @throws ApiError on 400, 401, 403, 404
 */
export const reactivate = (userId: string): Promise<UserWithBranch> => {
  return apiClient.patch<UserWithBranch>({
    url: `/users/${userId}/reactivate`,
  });
};

/**
 * Activate/deactivate user
 * PATCH /users/:id
 *
 * Helper method to update only isDeleted status
 * Note: Backend UpdateUserDto doesn't support isDeleted directly.
 * Use delete/reactivate endpoints instead.
 *
 * @param userId - User UUID
 * @param isDeleted - Deleted status
 * @returns Updated UserWithBranch
 * @throws ApiError on 400, 401, 403, 404
 * @deprecated Use delete() or reactivate() instead
 */
export const setActiveStatus = (userId: string, isDeleted: boolean): Promise<UserWithBranch> => {
  // Note: Backend UpdateUserDto doesn't support isDeleted
  // This is kept for backward compatibility but should use delete/reactivate instead
  return update(userId, { isDeleted });
};

// ============================================
// EXPORTS
// ============================================

const userService = {
  getAll,
  getAllUnpaginated,
  getOne,
  create,
  update,
  delete: deleteUser,
  assignBranch,
  reactivate,
  setActiveStatus,
};

export default userService;