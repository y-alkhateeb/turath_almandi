/**
 * Branch Service
 * Branch management endpoints
 */

import apiClient from '../apiClient';
import type { Branch, CreateBranchInput, UpdateBranchInput } from '#/entity';

// API endpoints enum
export enum BranchApi {
  GetAll = '/branches',
  GetOne = '/branches/:id',
  Create = '/branches',
  Update = '/branches/:id',
  Delete = '/branches/:id',
}

// Get all branches
export const getAll = () =>
  apiClient.get<Branch[]>({
    url: BranchApi.GetAll,
  });

// Get single branch by ID
export const getOne = (id: string) =>
  apiClient.get<Branch>({
    url: `/branches/${id}`,
  });

// Create new branch
export const create = (data: CreateBranchInput) =>
  apiClient.post<Branch>({
    url: BranchApi.Create,
    data,
  });

// Update branch
export const update = (id: string, data: UpdateBranchInput) =>
  apiClient.put<Branch>({
    url: `/branches/${id}`,
    data,
  });

// Delete branch
export const deleteBranch = (id: string) =>
  apiClient.delete<void>({
    url: `/branches/${id}`,
  });

// Export as default object
export default {
  getAll,
  getOne,
  create,
  update,
  delete: deleteBranch,
};
