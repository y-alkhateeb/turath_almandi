/**
 * Transaction Categories with Multi-Item and Discount Support
 * Categories are organized by transaction type (INCOME/EXPENSE)
 */

export const INCOME_CATEGORIES = [
  'INVENTORY_SALES',   // مبيعات المخزون - Multi-item ✓ Discount ✓
  'CAPITAL_ADDITION',  // إضافة رأس مال
  'APP_PURCHASES',     // مبيعات التطبيق - Multi-item ✓ Discount ✓
  'DEBT_PAYMENT',      // دفع دين
] as const;

export const EXPENSE_CATEGORIES = [
  'EMPLOYEE_SALARIES', // رواتب الموظفين
  'WORKER_DAILY',      // يوميات العمال
  'SUPPLIES',          // مستلزمات
  'MAINTENANCE',       // صيانة
  'INVENTORY',         // مشتريات مخزون - Multi-item ✓
  'DEBT',              // دين
  // REMOVED: 'COMPLIMENTARY', 'DISCOUNT', 'TABLE' - now handled as discount reasons
  'CASHIER_SHORTAGE',  // نقص كاشير
  'RETURNS',           // مرتجعات
  'OTHER_EXPENSE',     // مصروفات أخرى
] as const;

export const TRANSACTION_CATEGORIES = [
  ...INCOME_CATEGORIES,
  ...EXPENSE_CATEGORIES,
] as const;

export type TransactionCategory = typeof TRANSACTION_CATEGORIES[number];

/**
 * Categories that support multi-item transactions
 */
export const MULTI_ITEM_CATEGORIES = [
  'INVENTORY_SALES',  // مبيعات المخزون
  'APP_PURCHASES',    // مبيعات التطبيق
  'INVENTORY',        // مشتريات مخزون
] as const;

/**
 * Categories that support discount (INCOME only)
 */
export const DISCOUNT_ENABLED_CATEGORIES = [
  'INVENTORY_SALES',
  'APP_PURCHASES',
] as const;

/**
 * Category labels in Arabic for display purposes
 */
export const CATEGORY_LABELS_AR: Record<TransactionCategory, string> = {
  // INCOME
  INVENTORY_SALES: 'مبيعات المخزون',
  CAPITAL_ADDITION: 'إضافة رأس مال',
  APP_PURCHASES: 'مبيعات التطبيق',
  DEBT_PAYMENT: 'دفع دين',
  // EXPENSE
  EMPLOYEE_SALARIES: 'رواتب الموظفين',
  WORKER_DAILY: 'يوميات العمال',
  SUPPLIES: 'مستلزمات',
  MAINTENANCE: 'صيانة',
  INVENTORY: 'مشتريات مخزون',
  DEBT: 'دين',
  CASHIER_SHORTAGE: 'نقص كاشير',
  RETURNS: 'مرتجعات',
  OTHER_EXPENSE: 'مصروفات أخرى',
};

/**
 * Check if category supports multi-item transactions
 */
export function supportsMultiItem(category: string): boolean {
  return MULTI_ITEM_CATEGORIES.includes(category as any);
}

/**
 * Check if category supports discount
 */
export function supportsDiscount(category: string): boolean {
  return DISCOUNT_ENABLED_CATEGORIES.includes(category as any);
}

/**
 * Helper function to get income categories
 */
export function getIncomeCategories(): readonly string[] {
  return INCOME_CATEGORIES;
}

/**
 * Helper function to get expense categories
 */
export function getExpenseCategories(): readonly string[] {
  return EXPENSE_CATEGORIES;
}

/**
 * Helper function to get all categories
 */
export function getAllCategories(): readonly string[] {
  return TRANSACTION_CATEGORIES;
}

/**
 * Helper function to validate category
 */
export function isValidCategory(category: string): category is TransactionCategory {
  return TRANSACTION_CATEGORIES.includes(category as TransactionCategory);
}

/**
 * Helper function to normalize category
 * Converts Arabic labels to English constants
 * Returns English constant if valid, otherwise returns original value
 */
export function normalizeCategory(category: string | undefined): string | undefined {
  if (!category) {
    return category;
  }

  // If already an English constant, return it
  if (TRANSACTION_CATEGORIES.includes(category as TransactionCategory)) {
    return category;
  }

  // Try to find English constant from Arabic label
  const entry = Object.entries(CATEGORY_LABELS_AR).find(([_, label]) => label === category);
  if (entry) {
    return entry[0]; // Return English constant
  }

  // Return original value
  return category;
}
