/**
 * Inventory Sub-Unit Service
 * Inventory sub-unit CRUD operations for unit conversions
 *
 * Endpoints:
 * - GET /inventory-sub-units?filters → PaginatedResponse<InventorySubUnit>
 * - GET /inventory-sub-units/:id → InventorySubUnit
 * - GET /inventory-sub-units/by-item/:inventoryItemId → InventorySubUnit[]
 * - POST /inventory-sub-units → InventorySubUnit (CreateInventorySubUnitDto)
 * - PATCH /inventory-sub-units/:id → InventorySubUnit (UpdateInventorySubUnitDto)
 * - DELETE /inventory-sub-units/:id → void
 *
 * All types match backend DTOs exactly. No any types.
 */

import apiClient from '../apiClient';
import type {
  InventorySubUnit,
  CreateInventorySubUnitDto,
  UpdateInventorySubUnitDto,
  QueryInventorySubUnitsDto,
} from '#/entity';
import type { PaginatedResponse } from '#/api';

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Inventory Sub-Unit API endpoints enum
 * Centralized endpoint definitions
 */
export enum InventorySubUnitApiEndpoints {
  Base = '/inventory-sub-units',
  ById = '/inventory-sub-units/:id',
  ByItem = '/inventory-sub-units/by-item/:inventoryItemId',
}

// ============================================
// INVENTORY SUB-UNIT SERVICE METHODS
// ============================================

/**
 * Get all inventory sub-units with pagination and filters
 * GET /inventory-sub-units
 *
 * Supports filtering by:
 * - inventoryItemId: UUID
 * - search: string (searches name, description, inventory item name)
 * - isActive: boolean (default: true)
 * - page: number (default: 1)
 * - limit: number (default: 50)
 *
 * Backend behavior:
 * - Results ordered by inventory item name, then conversion factor ASC
 * - Includes inventory item info (id, name, unit)
 *
 * @param filters - Optional query filters
 * @returns PaginatedResponse<InventorySubUnit> with sub-units and pagination meta
 * @throws ApiError on 401 (not authenticated)
 */
export const getAll = (
  filters?: QueryInventorySubUnitsDto,
): Promise<PaginatedResponse<InventorySubUnit>> => {
  return apiClient.get<PaginatedResponse<InventorySubUnit>>({
    url: InventorySubUnitApiEndpoints.Base,
    params: filters,
  });
};

/**
 * Get single inventory sub-unit by ID
 * GET /inventory-sub-units/:id
 *
 * @param id - Sub-unit UUID
 * @returns InventorySubUnit with inventory item info
 * @throws ApiError on 404 (not found)
 */
export const getById = (id: string): Promise<InventorySubUnit> => {
  return apiClient.get<InventorySubUnit>({
    url: InventorySubUnitApiEndpoints.ById.replace(':id', id),
  });
};

/**
 * Get all sub-units for a specific inventory item
 * GET /inventory-sub-units/by-item/:inventoryItemId
 *
 * Returns only active sub-units ordered by conversion factor ASC
 * Useful for dropdowns when selecting purchase/sale units
 *
 * @param inventoryItemId - Inventory item UUID
 * @returns Array of InventorySubUnit for the item
 * @throws ApiError on 401 (not authenticated)
 */
export const getByInventoryItem = (inventoryItemId: string): Promise<InventorySubUnit[]> => {
  return apiClient.get<InventorySubUnit[]>({
    url: InventorySubUnitApiEndpoints.ByItem.replace(':inventoryItemId', inventoryItemId),
  });
};

/**
 * Create a new inventory sub-unit
 * POST /inventory-sub-units
 *
 * Backend validation:
 * - inventoryItemId: required UUID, must exist
 * - name: required, max 100 chars
 * - conversionFactor: required integer >= 1
 * - Inventory item must exist
 * - No duplicate name for same inventory item
 *
 * Example: 1 box = 12 pieces
 * - inventoryItemId: <item UUID>
 * - name: "صندوق" (Box)
 * - conversionFactor: 12
 *
 * @param data - CreateInventorySubUnitDto
 * @returns Created InventorySubUnit
 * @throws ApiError on 400 (validation), 404 (item not found), 409 (duplicate name)
 */
export const create = (data: CreateInventorySubUnitDto): Promise<InventorySubUnit> => {
  return apiClient.post<InventorySubUnit>({
    url: InventorySubUnitApiEndpoints.Base,
    data,
  });
};

/**
 * Update an inventory sub-unit
 * PATCH /inventory-sub-units/:id
 *
 * Backend validation:
 * - All fields optional (partial update)
 * - Cannot change inventoryItemId after creation
 * - Same validation rules as create for other fields
 *
 * Business rules:
 * - Inventory item is immutable after creation
 * - No duplicate name for same inventory item
 *
 * @param id - Sub-unit UUID
 * @param data - UpdateInventorySubUnitDto (partial)
 * @returns Updated InventorySubUnit
 * @throws ApiError on 404 (not found), 400 (immutable field), 409 (duplicate name)
 */
export const update = (id: string, data: UpdateInventorySubUnitDto): Promise<InventorySubUnit> => {
  return apiClient.patch<InventorySubUnit>({
    url: InventorySubUnitApiEndpoints.ById.replace(':id', id),
    data,
  });
};

/**
 * Delete an inventory sub-unit (soft delete)
 * DELETE /inventory-sub-units/:id
 *
 * Backend validation:
 * - Cannot delete if used in any purchase or sale transactions
 *
 * Business rules:
 * - Sets deletedAt, deletedBy, isDeleted = true
 * - Prevents deletion if sub-unit is used in transactions
 *
 * @param id - Sub-unit UUID
 * @returns void
 * @throws ApiError on 404 (not found), 400 (used in transactions)
 */
export const remove = (id: string): Promise<void> => {
  return apiClient.delete<void>({
    url: InventorySubUnitApiEndpoints.ById.replace(':id', id),
  });
};

// ============================================
// EXPORT DEFAULT SERVICE
// ============================================

const inventorySubUnitService = {
  getAll,
  getById,
  getByInventoryItem,
  create,
  update,
  remove,
};

export default inventorySubUnitService;
