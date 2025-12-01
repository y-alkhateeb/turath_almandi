/**
 * Discount Reason Service
 * Discount reason CRUD operations
 *
 * Endpoints:
 * - GET /discount-reasons → DiscountReason[]
 * - GET /discount-reasons/:id → DiscountReason
 * - POST /discount-reasons → DiscountReason (CreateDiscountReasonDto)
 * - PATCH /discount-reasons/:id → DiscountReason (UpdateDiscountReasonDto)
 * - DELETE /discount-reasons/:id → void
 *
 * All types match backend DTOs exactly.
 */

import apiClient from '../apiClient';

// ============================================
// TYPES
// ============================================

export interface DiscountReason {
  id: string;
  reason: string;
  description?: string | null;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
  isDeleted: boolean;
}

export interface CreateDiscountReasonDto {
  reason: string;
  description?: string;
  isDefault?: boolean;
  sortOrder?: number;
}

export interface UpdateDiscountReasonDto {
  reason?: string;
  description?: string;
  isDefault?: boolean;
  sortOrder?: number;
}

// ============================================
// API ENDPOINTS
// ============================================

export enum DiscountReasonApiEndpoints {
  Base = '/discount-reasons',
  ById = '/discount-reasons/:id',
}

// ============================================
// DISCOUNT REASON SERVICE METHODS
// ============================================

/**
 * Get all discount reasons
 * GET /discount-reasons
 *
 * @returns Promise<DiscountReason[]> sorted by sortOrder, then by reason
 * @throws ApiError on 401 (not authenticated)
 */
export const getAll = (): Promise<DiscountReason[]> => {
  return apiClient.get<DiscountReason[]>({
    url: DiscountReasonApiEndpoints.Base,
  });
};

/**
 * Get single discount reason by ID
 * GET /discount-reasons/:id
 *
 * @param id - Discount reason UUID
 * @returns Promise<DiscountReason>
 * @throws ApiError on 404 (not found)
 */
export const getById = (id: string): Promise<DiscountReason> => {
  return apiClient.get<DiscountReason>({
    url: DiscountReasonApiEndpoints.ById.replace(':id', id),
  });
};

/**
 * Create new discount reason
 * POST /discount-reasons
 *
 * @param data - CreateDiscountReasonDto
 * @returns Promise<DiscountReason>
 * @throws ApiError on 400 (validation error or duplicate reason)
 */
export const create = (data: CreateDiscountReasonDto): Promise<DiscountReason> => {
  return apiClient.post<DiscountReason>({
    url: DiscountReasonApiEndpoints.Base,
    data,
  });
};

/**
 * Update existing discount reason
 * PATCH /discount-reasons/:id
 *
 * @param id - Discount reason UUID
 * @param data - UpdateDiscountReasonDto
 * @returns Promise<DiscountReason>
 * @throws ApiError on 404 (not found) or 400 (duplicate reason)
 */
export const update = (id: string, data: UpdateDiscountReasonDto): Promise<DiscountReason> => {
  return apiClient.patch<DiscountReason>({
    url: DiscountReasonApiEndpoints.ById.replace(':id', id),
    data,
  });
};

/**
 * Delete (soft delete) discount reason
 * DELETE /discount-reasons/:id
 *
 * @param id - Discount reason UUID
 * @returns Promise<DiscountReason>
 * @throws ApiError on 404 (not found)
 */
export const remove = (id: string): Promise<DiscountReason> => {
  return apiClient.delete<DiscountReason>({
    url: DiscountReasonApiEndpoints.ById.replace(':id', id),
  });
};

// ============================================
// DEFAULT EXPORT
// ============================================

const discountReasonService = {
  getAll,
  getById,
  create,
  update,
  remove,
};

export default discountReasonService;
