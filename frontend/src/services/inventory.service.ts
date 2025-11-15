import api from './axios';
import type {
  InventoryItem,
  CreateInventoryInput,
  UpdateInventoryInput,
  InventoryFilters,
  PaginatedInventoryResponse,
} from '../types/inventory.types';

/**
 * Inventory Service
 * Handles all inventory-related API calls
 */
export const inventoryService = {
  /**
   * Get all inventory items with optional filters and pagination
   */
  getAll: async (filters?: InventoryFilters): Promise<PaginatedInventoryResponse> => {
    const params = new URLSearchParams();

    if (filters?.branchId) {
      params.append('branchId', filters.branchId);
    }
    if (filters?.unit) {
      params.append('unit', filters.unit);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `/inventory?${queryString}` : '/inventory';

    const response = await api.get<PaginatedInventoryResponse>(url);
    return response.data;
  },

  /**
   * Get a single inventory item by ID
   */
  getOne: async (id: string): Promise<InventoryItem> => {
    const response = await api.get<InventoryItem>(`/inventory/${id}`);
    return response.data;
  },

  /**
   * Create a new inventory item (manual add)
   * Note: branchId is auto-filled by backend from user's branch
   */
  create: async (data: CreateInventoryInput): Promise<InventoryItem> => {
    const response = await api.post<InventoryItem>('/inventory', data);
    return response.data;
  },

  /**
   * Update an existing inventory item
   */
  update: async (id: string, data: UpdateInventoryInput): Promise<InventoryItem> => {
    const response = await api.put<InventoryItem>(`/inventory/${id}`, data);
    return response.data;
  },

  /**
   * Delete an inventory item
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/inventory/${id}`);
  },
};
