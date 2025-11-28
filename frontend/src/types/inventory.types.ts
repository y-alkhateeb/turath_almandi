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
  costPerUnit: number; // سعر الشراء
  sellingPrice: number | null; // سعر البيع
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
  quantity?: number; // اختياري - يتم تحديده من خلال معاملة مشتريات المخزون
  unit: InventoryUnit;
  costPerUnit?: number; // سعر الشراء - اختياري
  sellingPrice?: number | null; // سعر البيع - اختياري
  notes?: string;
  branchId?: string;
}

export interface UpdateInventoryInput {
  name?: string;
  quantity?: number;
  unit?: InventoryUnit;
  costPerUnit?: number; // سعر الشراء
  sellingPrice?: number | null; // سعر البيع
  notes?: string;
}

export interface InventoryFormData {
  name: string;
  quantity: string;
  unit: InventoryUnit;
  costPerUnit: string; // سعر الشراء
  sellingPrice: string; // سعر البيع
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
