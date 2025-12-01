import { User } from './entity';

/**
 * Inventory Sub-Unit entity
 * For handling different unit conversions (e.g., 1 box = 12 pieces)
 */
export interface InventorySubUnit {
  id: string;
  inventoryItemId: string;
  inventoryItem?: {
    id: string;
    name: string;
    unit: string;
  };
  unitName: string;
  ratio: number;
  sellingPrice: number;
  createdBy: string;
  creator?: User;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  deletedBy?: string;
  isDeleted: boolean;
}

/**
 * Create inventory sub-unit DTO
 */
export interface CreateInventorySubUnitDto {
  inventoryItemId: string;
  unitName: string;
  ratio: number;
  sellingPrice: number;
}

/**
 * Update inventory sub-unit DTO
 */
export interface UpdateInventorySubUnitDto {
  unitName?: string;
  ratio?: number;
  sellingPrice?: number;
}

/**
 * Query inventory sub-units DTO
 */
export interface QueryInventorySubUnitsDto {
  page?: number;
  limit?: number;
  search?: string;
  inventoryItemId?: string;
}
