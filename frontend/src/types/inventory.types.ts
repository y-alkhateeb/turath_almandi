/**
 * Inventory Type Definitions
 * Based on backend Prisma schema and DTOs
 */

export enum InventoryUnit {
  KG = 'KG',
  PIECE = 'PIECE',
  LITER = 'LITER',
  OTHER = 'OTHER',
}

export interface RelatedPurchase {
  id: string;
  amount: number;
  date: string;
  employeeVendorName: string;
  category: string;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  branchId: string;
  name: string;
  quantity: number;
  unit: InventoryUnit;
  costPerUnit: number;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
  branch?: {
    id: string;
    name: string;
    location: string;
  };
  transactions?: RelatedPurchase[];
  isAutoAdded?: boolean;
  relatedPurchases?: RelatedPurchase[];
}

export interface CreateInventoryInput {
  name: string;
  quantity: number;
  unit: InventoryUnit;
  costPerUnit: number;
  notes?: string;
}

export interface UpdateInventoryInput {
  name?: string;
  quantity?: number;
  unit?: InventoryUnit;
  costPerUnit?: number;
  notes?: string;
}

export interface InventoryFormData {
  name: string;
  quantity: string;
  unit: InventoryUnit;
  costPerUnit: string;
  notes: string;
  branchId?: string; // Optional - for admins to select branch, auto-filled for accountants
}

export interface InventoryFilters {
  branchId?: string;
  unit?: InventoryUnit;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedInventoryResponse {
  data: InventoryItem[];
  pagination: PaginationMeta;
}
