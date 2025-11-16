/**
 * User Management Service
 * User CRUD and assignment operations (Admin only)
 */

import apiClient from '../apiClient';
import type { UserWithBranch, CreateUserInput, UpdateUserInput } from '#/entity';

// API endpoints enum
export enum UserManagementApi {
  GetAll = '/users',
  GetOne = '/users/:id',
  Create = '/users',
  Update = '/users/:id',
  AssignBranch = '/users/:id/assign-branch',
  Delete = '/users/:id',
}

// Get all users
export const getAll = () =>
  apiClient.get<UserWithBranch[]>({
    url: UserManagementApi.GetAll,
  });

// Get single user by ID
export const getOne = (id: string) =>
  apiClient.get<UserWithBranch>({
    url: `/users/${id}`,
  });

// Create new user
export const create = (data: CreateUserInput) =>
  apiClient.post<UserWithBranch>({
    url: UserManagementApi.Create,
    data,
  });

// Update user (role, branchId, isActive)
export const update = (id: string, data: UpdateUserInput) =>
  apiClient.patch<UserWithBranch>({
    url: `/users/${id}`,
    data,
  });

// Assign user to branch
export const assignBranch = (userId: string, branchId: string | null) =>
  apiClient.patch<UserWithBranch>({
    url: `/users/${userId}/assign-branch`,
    data: { branchId },
  });

// Delete user
export const deleteUser = (id: string) =>
  apiClient.delete<void>({
    url: `/users/${id}`,
  });

// Export as default object
export default {
  getAll,
  getOne,
  create,
  update,
  assignBranch,
  delete: deleteUser,
};
