/**
 * Transaction Categories Constants
 * Centralized definition of transaction categories with Arabic labels
 * Used across the application for consistency
 */

import { TransactionType } from '@/types/enum';

export interface CategoryOption {
  value: string;
  label: string;
  type: TransactionType;
}

/**
 * Income categories (Arabic)
 * These values match backend INCOME_CATEGORIES constants
 */
export const INCOME_CATEGORIES: CategoryOption[] = [
  { value: 'INVENTORY_SALES', label: 'مبيعات المخزون', type: TransactionType.INCOME },
  { value: 'CAPITAL_ADDITION', label: 'إضافة رأس مال', type: TransactionType.INCOME },
  { value: 'APP_PURCHASES', label: 'مبيعات التطبيق', type: TransactionType.INCOME },
];

/**
 * Expense categories (Arabic)
 * These values match backend EXPENSE_CATEGORIES constants
 */
export const EXPENSE_CATEGORIES: CategoryOption[] = [
  { value: 'WORKER_DAILY', label: 'يوميات العمال', type: TransactionType.EXPENSE },
  { value: 'SUPPLIES', label: 'مستلزمات', type: TransactionType.EXPENSE },
  { value: 'MAINTENANCE', label: 'صيانة', type: TransactionType.EXPENSE },
  { value: 'INVENTORY', label: 'مشتريات مخزون', type: TransactionType.EXPENSE },
  { value: 'OTHER_EXPENSE', label: 'مصروفات أخرى', type: TransactionType.EXPENSE },
];

/**
 * All categories combined
 */
export const ALL_CATEGORIES: CategoryOption[] = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

/**
 * Get categories by transaction type
 */
export const getCategoriesByType = (type: TransactionType): CategoryOption[] => {
  return type === TransactionType.INCOME ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
};

/**
 * Get Arabic label for a category value
 * Returns the English value if no match found (fallback)
 */
export const getCategoryLabel = (categoryValue: string | null): string => {
  if (!categoryValue) return '-';

  const category = ALL_CATEGORIES.find((cat) => cat.value === categoryValue);
  return category ? category.label : categoryValue;
};

/**
 * Get category value from label (for reverse lookup)
 */
export const getCategoryValue = (label: string): string | null => {
  const category = ALL_CATEGORIES.find((cat) => cat.label === label);
  return category ? category.value : null;
};

/**
 * Check if a category value is valid
 */
export const isValidCategory = (categoryValue: string): boolean => {
  return ALL_CATEGORIES.some((cat) => cat.value === categoryValue);
};
