/**
 * Transaction Helpers
 * Utility functions for transaction calculations and category checks
 */

import { DiscountType } from '@/types/enum';
import {
  MULTI_ITEM_CATEGORIES,
  DISCOUNT_ENABLED_CATEGORIES,
} from '@/constants/transaction-categories';

// ============================================
// TYPES
// ============================================

export interface InventoryItemEntry {
  id: string;
  inventoryItemId: string;
  quantity: string;
  unitPrice: string;
  discountType: DiscountType | '';
  discountValue: string;
  notes: string; // ملاحظة خاصة بالصنف
}

// ============================================
// CATEGORY HELPERS
// ============================================

const MULTI_ITEM_CATS = MULTI_ITEM_CATEGORIES as readonly string[];
const DISCOUNT_CATS = DISCOUNT_ENABLED_CATEGORIES as readonly string[];

/**
 * Check if a category supports multi-item transactions
 */
export function isMultiItemCategory(category: string): boolean {
  return MULTI_ITEM_CATS.includes(category);
}

/**
 * Check if a category supports discounts
 */
export function isDiscountEnabledCategory(category: string): boolean {
  return DISCOUNT_CATS.includes(category);
}

// ============================================
// ID GENERATION
// ============================================

/**
 * Generate a unique ID for inventory items
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// ============================================
// CALCULATIONS
// ============================================

/**
 * Calculate the total for a single inventory item including any discount
 */
export function calculateItemTotal(item: InventoryItemEntry): number {
  const quantity = parseFloat(item.quantity) || 0;
  const unitPrice = parseFloat(item.unitPrice) || 0;
  const subtotal = quantity * unitPrice;

  if (!item.discountType || !item.discountValue) return subtotal;

  const discountValue = parseFloat(item.discountValue) || 0;
  if (item.discountType === DiscountType.PERCENTAGE) {
    return subtotal - (subtotal * discountValue) / 100;
  }
  return subtotal - discountValue;
}

/**
 * Create an empty inventory item entry
 */
export function createEmptyInventoryItem(): InventoryItemEntry {
  return {
    id: generateId(),
    inventoryItemId: '',
    quantity: '',
    unitPrice: '',
    discountType: '',
    discountValue: '',
    notes: '',
  };
}
