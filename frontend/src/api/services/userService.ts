/**
 * User Service
 * User CRUD operations (Admin only)
 *
 * Endpoints:
 * - GET /users → PaginatedResponse<User>
 * - GET /users/:id → User
 * - POST /users → User (CreateUserDto)
 * - PATCH /users/:id → User (UpdateUserDto)
 * - DELETE /users/:id → void
 *
 * All types match backend DTOs exactly. No any types.
 */

import apiClient from '../apiClient';
import type { User, CreateUserInput, UpdateUserInput } from '#/entity';
import type { PaginatedResponse, UserQueryFilters } from '#/api';

// ============================================
// API ENDPOINTS
// ============================================

/**
 * User API endpoints enum
 * Centralized endpoint definitions
 */
export enum UserApiEndpoints {
  GetAll = '/users',
  GetOne = '/users/:id',
  Create = '/users',
  Update = '/users/:id',
  Delete = '/users/:id',
}

// ============================================
// USER SERVICE METHODS
// ============================================

/**
 * Get all users with pagination and filters
 * GET /users
 *
 * @param filters - Optional query filters (role, branchId, isActive, page, limit)
 * @returns PaginatedResponse<User> with users and pagination meta
 * @throws ApiError on 401 (not authenticated), 403 (not admin)
 */
export const getAll = (filters?: UserQueryFilters): Promise<PaginatedResponse<User>> => {
  return apiClient.get<PaginatedResponse<User>>({
    url: UserApiEndpoints.GetAll,
    params: filters,
  });
};

/**
 * Get all users without pagination (for dropdowns, etc.)
 * GET /users?limit=1000
 *
 * @returns User[] array
 * @throws ApiError on 401 (not authenticated), 403 (not admin)
 */
export const getAllUnpaginated = (): Promise<User[]> => {
  return apiClient.get<User[]>({
    url: UserApiEndpoints.GetAll,
    params: { limit: 1000 },
  }).then((response) => {
    // If backend returns paginated response, extract data array
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as PaginatedResponse<User>).data;
    }
    // Otherwise assume it's already an array
    return response as User[];
  });
};

/**
 * Get single user by ID
 * GET /users/:id
 *
 * @param id - User UUID
 * @returns User with optional branch relation
 * @throws ApiError on 401 (not authenticated), 403 (not admin), 404 (user not found)
 */
export const getOne = (id: string): Promise<User> => {
  return apiClient.get<User>({
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
 * @returns Created User
 * @throws ApiError on 400 (validation error), 401, 403, 409 (username exists)
 */
export const create = (data: CreateUserInput): Promise<User> => {
  return apiClient.post<User>({
    url: UserApiEndpoints.Create,
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
 * - isActive: Optional, boolean
 *
 * @param id - User UUID
 * @param data - UpdateUserInput (password?, role?, branchId?, isActive?)
 * @returns Updated User
 * @throws ApiError on 400 (validation error), 401, 403, 404 (user not found)
 */
export const update = (id: string, data: UpdateUserInput): Promise<User> => {
  return apiClient.patch<User>({
    url: `/users/${id}`,
    data,
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
 * PATCH /users/:id
 *
 * Helper method to update only branchId
 *
 * @param userId - User UUID
 * @param branchId - Branch UUID or null to unassign
 * @returns Updated User
 * @throws ApiError on 400, 401, 403, 404
 */
export const assignBranch = (userId: string, branchId: string | null): Promise<User> => {
  return update(userId, { branchId });
};

/**
 * Activate/deactivate user
 * PATCH /users/:id
 *
 * Helper method to update only isActive status
 *
 * @param userId - User UUID
 * @param isActive - Active status
 * @returns Updated User
 * @throws ApiError on 400, 401, 403, 404
 */
export const setActiveStatus = (userId: string, isActive: boolean): Promise<User> => {
  return update(userId, { isActive });
};

// ============================================
// EXPORTS
// ============================================

/**
 * User service object with all methods
 * Use named exports or default object
 */
const userService = {
  getAll,
  getAllUnpaginated,
  getOne,
  create,
  update,
  delete: deleteUser,
  assignBranch,
  setActiveStatus,
};

export default userService;
