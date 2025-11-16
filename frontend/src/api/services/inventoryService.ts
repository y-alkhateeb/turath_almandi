/**
 * Inventory Service
 * Inventory item management endpoints
 */

import apiClient from '../apiClient';
import type {
  InventoryItem,
  CreateInventoryInput,
  UpdateInventoryInput,
  InventoryFilters,
} from '#/entity';
import type { PaginatedResponse } from '#/api';

// API endpoints enum
export enum InventoryApi {
  GetAll = '/inventory',
  GetOne = '/inventory/:id',
  Create = '/inventory',
  Update = '/inventory/:id',
  Delete = '/inventory/:id',
}

// Build query string from filters
const buildQueryString = (filters?: InventoryFilters): string => {
  if (!filters) return '';

  const params = new URLSearchParams();

  if (filters.branchId) params.append('branchId', filters.branchId);
  if (filters.unit) params.append('unit', filters.unit);
  if (filters.autoAdded !== undefined) params.append('autoAdded', filters.autoAdded.toString());
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  return params.toString();
};

// Get all inventory items with optional filters and pagination
export const getAll = (filters?: InventoryFilters) => {
  const queryString = buildQueryString(filters);
  const url = queryString ? `/inventory?${queryString}` : '/inventory';

  return apiClient.get<PaginatedResponse<InventoryItem>>({
    url,
  });
};

// Get single inventory item by ID
export const getOne = (id: string) =>
  apiClient.get<InventoryItem>({
    url: `/inventory/${id}`,
  });

// Create new inventory item (manual add)
// Note: branchId auto-filled by backend from user's branch
export const create = (data: CreateInventoryInput) =>
  apiClient.post<InventoryItem>({
    url: InventoryApi.Create,
    data,
  });

// Update inventory item
export const update = (id: string, data: UpdateInventoryInput) =>
  apiClient.put<InventoryItem>({
    url: `/inventory/${id}`,
    data,
  });

// Delete inventory item
export const deleteInventory = (id: string) =>
  apiClient.delete<void>({
    url: `/inventory/${id}`,
  });

// Export as default object
export default {
  getAll,
  getOne,
  create,
  update,
  delete: deleteInventory,
};
