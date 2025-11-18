/**
 * Inventory Service
 * Inventory item CRUD operations and value calculations
 *
 * Endpoints:
 * - GET /inventory?filters → PaginatedResponse<InventoryItem>
 * - GET /inventory/:id → InventoryItem
 * - POST /inventory → InventoryItem (CreateInventoryDto)
 * - PATCH /inventory/:id → InventoryItem (UpdateInventoryDto)
 * - DELETE /inventory/:id → void
 * - GET /inventory/value?branchId → number
 *
 * All types match backend DTOs exactly. No any types.
 */

import apiClient from '../apiClient';
import type {
  InventoryItem,
  CreateInventoryInput,
  UpdateInventoryInput,
} from '#/entity';
import type {
  PaginatedResponse,
  InventoryQueryFilters,
} from '#/api';

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Inventory API endpoints enum
 * Centralized endpoint definitions
 */
export enum InventoryApiEndpoints {
  GetAll = '/inventory',
  GetOne = '/inventory/:id',
  Create = '/inventory',
  Update = '/inventory/:id',
  Delete = '/inventory/:id',
  GetValue = '/inventory/value',
}

// ============================================
// INVENTORY SERVICE METHODS
// ============================================

/**
 * Get all inventory items with pagination and filters
 * GET /inventory
 *
 * Supports filtering by:
 * - unit: Unit (e.g., 'kg', 'liter', 'piece')
 * - branchId: UUID (accountants auto-filtered to their branch)
 * - autoAdded: boolean (filter manually vs auto-added items)
 * - search: string (searches name, notes)
 * - page: number (default: 1)
 * - limit: number (default: 50)
 *
 * Backend behavior:
 * - Accountants: Auto-filtered to their assigned branch
 * - Admins: Can filter by any branch or see all
 * - Results ordered by name ASC
 * - Includes consumption history if requested
 *
 * @param filters - Optional query filters
 * @returns PaginatedResponse<InventoryItem> with items and pagination meta
 * @throws ApiError on 401 (not authenticated)
 */
export const getAll = (
  filters?: InventoryQueryFilters,
): Promise<PaginatedResponse<InventoryItem>> => {
  return apiClient.get<PaginatedResponse<InventoryItem>>({
    url: InventoryApiEndpoints.GetAll,
    params: filters,
  });
};

/**
 * Get single inventory item by ID
 * GET /inventory/:id
 *
 * Backend validation:
 * - Accountants can only access items from their branch
 * - Admins can access any item
 * - Returns item with branch relation
 *
 * @param id - InventoryItem UUID
 * @returns InventoryItem with branch relation
 * @throws ApiError on 401, 403 (wrong branch), 404 (not found)
 */
export const getOne = (id: string): Promise<InventoryItem> => {
  return apiClient.get<InventoryItem>({
    url: `/inventory/${id}`,
  });
};

/**
 * Create new inventory item (manual add)
 * POST /inventory
 *
 * Backend validation (from CreateInventoryDto):
 * - name: Required, string, trimmed, escaped
 * - quantity: Required, >= 0
 * - unit: Required, string (e.g., 'kg', 'liter', 'piece')
 * - costPerUnit: Required, >= 0
 * - notes: Optional, text
 * - branchId: Auto-set from user for accountants, required for admins
 *
 * Backend behavior:
 * - Accountants: branchId auto-set from their assignment
 * - Admins: Must provide branchId
 * - Sets autoAdded to false (manual inventory item)
 * - Calculates totalValue = quantity * costPerUnit
 * - Emits WebSocket event for real-time updates
 *
 * @param data - CreateInventoryInput
 * @returns Created InventoryItem with relations
 * @throws ApiError on 400 (validation), 401, 403, 404 (invalid branchId)
 */
export const create = (data: CreateInventoryInput): Promise<InventoryItem> => {
  return apiClient.post<InventoryItem>({
    url: InventoryApiEndpoints.Create,
    data,
  });
};

/**
 * Update inventory item
 * PATCH /inventory/:id
 *
 * Backend allows partial updates of:
 * - name: Optional, string
 * - quantity: Optional, >= 0
 * - unit: Optional, string
 * - costPerUnit: Optional, >= 0
 * - notes: Optional, text
 *
 * Backend restrictions:
 * - Cannot change branchId
 * - Cannot change autoAdded flag
 * - Cannot change createdBy
 * - Accountants can only update their branch's items
 * - Auto-updates totalValue on quantity or costPerUnit change
 *
 * @param id - InventoryItem UUID
 * @param data - UpdateInventoryInput (partial fields)
 * @returns Updated InventoryItem
 * @throws ApiError on 400 (validation), 401, 403 (wrong branch), 404 (not found)
 */
export const update = (id: string, data: UpdateInventoryInput): Promise<InventoryItem> => {
  return apiClient.patch<InventoryItem>({
    url: `/inventory/${id}`,
    data,
  });
};

/**
 * Delete inventory item
 * DELETE /inventory/:id
 *
 * Permanently deletes inventory item
 * Cannot delete items with consumption history
 *
 * Backend behavior:
 * - Accountants can only delete their branch's items
 * - Cannot delete items referenced in consumption history
 * - Audit log entry created
 *
 * @param id - InventoryItem UUID
 * @returns void
 * @throws ApiError on 401, 403 (wrong branch), 404 (not found), 409 (has consumption history)
 */
export const deleteInventory = (id: string): Promise<void> => {
  return apiClient.delete<void>({
    url: `/inventory/${id}`,
  });
};

/**
 * Get total inventory value for a branch
 * GET /inventory/value?branchId
 *
 * Calculates total value of all inventory items:
 * Sum of (quantity * costPerUnit) for all items
 *
 * Backend behavior:
 * - Accountants: Auto-filtered to their branch
 * - Admins: Can get value for any branch or all branches
 * - Returns total value as number
 *
 * @param branchId - Optional branch UUID (admins only)
 * @returns number - Total inventory value
 * @throws ApiError on 401 (not authenticated)
 */
export const getValue = (branchId?: string): Promise<number> => {
  return apiClient.get<number>({
    url: InventoryApiEndpoints.GetValue,
    params: branchId ? { branchId } : undefined,
  });
};

// ============================================
// HELPER METHODS
// ============================================

/**
 * Get all inventory items without pagination (for exports, reports)
 * GET /inventory?limit=10000
 *
 * Warning: Use with caution on large datasets
 * Consider using pagination for better performance
 *
 * @param filters - Optional query filters (without page/limit)
 * @returns InventoryItem[] array
 * @throws ApiError on 401
 */
export const getAllUnpaginated = (
  filters?: Omit<InventoryQueryFilters, 'page' | 'limit'>,
): Promise<InventoryItem[]> => {
  return apiClient
    .get<PaginatedResponse<InventoryItem>>({
      url: InventoryApiEndpoints.GetAll,
      params: { ...filters, limit: 10000 },
    })
    .then((response) => {
      // Extract data from paginated response
      return response.data;
    });
};

/**
 * Get only manually added inventory items
 * GET /inventory?autoAdded=false
 *
 * Convenience method for filtering by autoAdded flag
 *
 * @param filters - Optional additional filters
 * @returns PaginatedResponse<InventoryItem>
 * @throws ApiError on 401
 */
export const getManualItems = (
  filters?: Omit<InventoryQueryFilters, 'autoAdded'>,
): Promise<PaginatedResponse<InventoryItem>> => {
  return getAll({
    ...filters,
    autoAdded: false,
  });
};

/**
 * Get only auto-added inventory items
 * GET /inventory?autoAdded=true
 *
 * Convenience method for filtering by autoAdded flag
 *
 * @param filters - Optional additional filters
 * @returns PaginatedResponse<InventoryItem>
 * @throws ApiError on 401
 */
export const getAutoItems = (
  filters?: Omit<InventoryQueryFilters, 'autoAdded'>,
): Promise<PaginatedResponse<InventoryItem>> => {
  return getAll({
    ...filters,
    autoAdded: true,
  });
};

/**
 * Get inventory items by unit type
 * GET /inventory?unit=X
 *
 * Convenience method for filtering by unit
 *
 * @param unit - Unit string (e.g., 'kg', 'liter', 'piece')
 * @param filters - Optional additional filters
 * @returns PaginatedResponse<InventoryItem>
 * @throws ApiError on 401
 */
export const getByUnit = (
  unit: string,
  filters?: Omit<InventoryQueryFilters, 'unit'>,
): Promise<PaginatedResponse<InventoryItem>> => {
  return getAll({
    ...filters,
    unit,
  });
};

/**
 * Get low stock items (quantity < threshold)
 * GET /inventory?page=1&limit=10000
 *
 * Note: Backend doesn't have a lowStock filter, so we fetch all and filter client-side
 * For large datasets, consider adding backend support
 *
 * @param threshold - Quantity threshold (default: 10)
 * @param filters - Optional additional filters
 * @returns InventoryItem[] - Items with quantity below threshold
 * @throws ApiError on 401
 */
export const getLowStock = (
  threshold: number = 10,
  filters?: Omit<InventoryQueryFilters, 'page' | 'limit'>,
): Promise<InventoryItem[]> => {
  return getAllUnpaginated(filters).then((items) => {
    return items.filter((item) => item.quantity < threshold);
  });
};

/**
 * Update inventory item quantity
 * PATCH /inventory/:id
 *
 * Helper method to update only quantity
 *
 * @param id - InventoryItem UUID
 * @param quantity - New quantity value
 * @returns Updated InventoryItem
 * @throws ApiError on 400, 401, 403, 404
 */
export const updateQuantity = (id: string, quantity: number): Promise<InventoryItem> => {
  return update(id, { quantity });
};

/**
 * Adjust inventory item quantity (increment/decrement)
 * PATCH /inventory/:id
 *
 * Helper method to adjust quantity by delta
 *
 * @param id - InventoryItem UUID
 * @param delta - Quantity change (positive to add, negative to subtract)
 * @returns Updated InventoryItem
 * @throws ApiError on 400, 401, 403, 404
 */
export const adjustQuantity = async (id: string, delta: number): Promise<InventoryItem> => {
  const item = await getOne(id);
  const newQuantity = Math.max(0, item.quantity + delta);
  return update(id, { quantity: newQuantity });
};

// ============================================
// EXPORTS
// ============================================

/**
 * Inventory service object with all methods
 * Use named exports or default object
 */
const inventoryService = {
  getAll,
  getAllUnpaginated,
  getOne,
  create,
  update,
  delete: deleteInventory,
  getValue,
  getManualItems,
  getAutoItems,
  getByUnit,
  getLowStock,
  updateQuantity,
  adjustQuantity,
};

export default inventoryService;
