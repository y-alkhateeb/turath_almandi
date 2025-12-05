/**
 * Inventory Service
 * Inventory item CRUD operations
 *
 * Endpoints:
 * - GET /inventory?filters → InventoryItem[] (array of items with filters)
 * - GET /inventory/:id → InventoryItem
 * - POST /inventory → InventoryItem (CreateInventoryDto)
 * - PATCH /inventory/:id → InventoryItem (UpdateInventoryDto)
 * - DELETE /inventory/:id → void
 *
 * All types match backend DTOs exactly. No any types.
 */

import apiClient from '../apiClient';
import type {
  InventoryItem,
  CreateInventoryInput,
  UpdateInventoryInput,
  RecordConsumptionInput,
  InventoryConsumption,
  DailyConsumptionSummary,
  ConsumptionHistoryItem,
} from '#/entity';
import type { InventoryQueryFilters } from '#/api';

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Inventory API endpoints enum
 * Centralized endpoint definitions
 */
export enum InventoryApiEndpoints {
  Base = '/inventory',
  ById = '/inventory/:id',
}

// ============================================
// INVENTORY SERVICE METHODS
// ============================================

/**
 * Get all inventory items with filters
 * GET /inventory
 *
 * Supports filtering by:
 * - unit: InventoryUnit enum (KG | PIECE | LITER | OTHER)
 * - branchId: UUID (accountants auto-filtered to their branch)
 * - search: string (searches name)
 *
 * Backend behavior:
 * - Accountants: Auto-filtered to their assigned branch
 * - Admins: Can filter by any branch or see all
 * - Results ordered by lastUpdated DESC
 *
 * @param filters - Optional query filters
 * @returns Array of inventory items
 * @throws ApiError on 401 (not authenticated)
 */
export const getAll = (
  filters?: InventoryQueryFilters
): Promise<InventoryItem[]> => {
  return apiClient.get<InventoryItem[]>({
    url: InventoryApiEndpoints.Base,
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
 * - name: Required, 2+ chars
 * - quantity: Optional (default: 0), min: 0
 * - unit: Required, InventoryUnit enum (KG | PIECE | LITER | OTHER)
 * - costPerUnit: Optional (default: 0), min: 0
 * - sellingPrice: Optional, min: 0 or null
 * - notes: Optional
 * - branchId: Required for admins, accountants use their branch
 *
 * Backend behavior:
 * - Accountants: branchId auto-set from their assignment
 * - Admins: Must provide branchId
 *
 * @param data - CreateInventoryInput
 * @returns Created InventoryItem with relations
 * @throws ApiError on 400 (validation), 401, 403, 404 (invalid branchId)
 */
export const create = (data: CreateInventoryInput): Promise<InventoryItem> => {
  return apiClient.post<InventoryItem>({
    url: InventoryApiEndpoints.Base,
    data,
  });
};

/**
 * Update inventory item
 * PATCH /inventory/:id
 *
 * Backend allows partial updates of:
 * - name: Optional
 * - quantity: Optional, >= 0
 * - unit: Optional, InventoryUnit enum
 * - costPerUnit: Optional, >= 0
 * - sellingPrice: Optional, >= 0 or null
 * - notes: Optional
 *
 * Backend restrictions:
 * - Accountants can only update their branch's items
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
 * Delete inventory item (soft delete)
 * DELETE /inventory/:id
 *
 * Backend behavior:
 * - Accountants can only delete their branch's items
 * - Soft deletes (sets deletedAt, isDeleted)
 *
 * @param id - InventoryItem UUID
 * @returns void
 * @throws ApiError on 401, 403 (wrong branch), 404 (not found)
 */
export const deleteInventory = (id: string): Promise<void> => {
  return apiClient.delete<void>({
    url: `/inventory/${id}`,
  });
};

// ============================================
// CONSUMPTION METHODS (ADMIN ONLY)
// ============================================

/**
 * Record consumption/damage of an inventory item
 * POST /inventory/:id/consume
 *
 * Admin only - decreases inventory without creating transaction
 *
 * Backend validation (from RecordConsumptionDto):
 * - quantity: Required, min: 0.001
 * - unit: Required, must match inventory item's unit
 * - reason: Optional string (e.g., "انتهاء صلاحية", "تلف")
 * - consumedAt: Required, ISO date string
 *
 * Backend behavior:
 * - Validates quantity doesn't exceed current inventory
 * - Creates InventoryConsumption record
 * - Decreases inventory quantity
 * - Logs audit trail
 *
 * @param id - InventoryItem UUID
 * @param data - RecordConsumptionInput
 * @returns Created InventoryConsumption with relations
 * @throws ApiError on 400 (validation/insufficient quantity), 401, 403 (not admin), 404 (not found)
 */
export const recordConsumption = (
  id: string,
  data: RecordConsumptionInput
): Promise<InventoryConsumption> => {
  return apiClient.post<InventoryConsumption>({
    url: `/inventory/${id}/consume`,
    data,
  });
};

/**
 * Get consumption history for a specific inventory item
 * GET /inventory/:id/consumption-history
 *
 * @param id - InventoryItem UUID
 * @param startDate - Optional start date filter (ISO string)
 * @param endDate - Optional end date filter (ISO string)
 * @returns Array of ConsumptionHistoryItem with recorder and branch relations
 * @throws ApiError on 401, 403 (wrong branch for accountant), 404 (not found)
 */
export const getConsumptionHistory = (
  id: string,
  startDate?: string,
  endDate?: string
): Promise<ConsumptionHistoryItem[]> => {
  return apiClient.get<ConsumptionHistoryItem[]>({
    url: `/inventory/${id}/consumption-history`,
    params: { startDate, endDate },
  });
};

/**
 * Get daily consumption summary
 * GET /inventory/consumption/daily
 *
 * @param date - Date to get summary for (ISO string, e.g., "2024-01-15")
 * @param branchId - Optional branch filter (Admin only, accountants auto-filtered)
 * @returns DailyConsumptionSummary with total count and items consumed
 * @throws ApiError on 401, 403 (accountant without branch)
 */
export const getDailyConsumption = (
  date: string,
  branchId?: string
): Promise<DailyConsumptionSummary> => {
  return apiClient.get<DailyConsumptionSummary>({
    url: '/inventory/consumption/daily',
    params: { date, branchId },
  });
};

// ============================================
// EXPORTS
// ============================================

const inventoryService = {
  getAll,
  getOne,
  create,
  update,
  delete: deleteInventory,
  // Consumption methods (Admin only)
  recordConsumption,
  getConsumptionHistory,
  getDailyConsumption,
};

export default inventoryService;
