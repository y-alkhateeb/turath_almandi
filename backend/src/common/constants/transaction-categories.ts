/**
 * Predefined transaction categories
 * Categories are organized by transaction type (INCOME/EXPENSE)
 */

export const INCOME_CATEGORIES = [
  'SALES',           // مبيعات
  'SERVICES',        // خدمات
  'APP_PURCHASES',   // مشتريات التطبيق
  'OTHER_INCOME',    // إيرادات أخرى
] as const;

export const EXPENSE_CATEGORIES = [
  'WORKER_DAILY',    // يوميات العمال
  'RENT',            // إيجار
  'UTILITIES',       // مرافق (كهرباء، ماء، إنترنت)
  'SUPPLIES',        // مستلزمات
  'MAINTENANCE',     // صيانة
  'TRANSPORTATION',  // مواصلات
  'INVENTORY',       // مشتريات مخزون
  'OTHER_EXPENSE',   // مصروفات أخرى
] as const;

export const TRANSACTION_CATEGORIES = [
  ...INCOME_CATEGORIES,
  ...EXPENSE_CATEGORIES,
] as const;

export type TransactionCategory = typeof TRANSACTION_CATEGORIES[number];

/**
 * Category labels in Arabic for display purposes
 */
export const CATEGORY_LABELS_AR: Record<TransactionCategory, string> = {
  SALES: 'مبيعات',
  SERVICES: 'خدمات',
  APP_PURCHASES: 'مشتريات التطبيق',
  OTHER_INCOME: 'إيرادات أخرى',
  WORKER_DAILY: 'يوميات العمال',
  RENT: 'إيجار',
  UTILITIES: 'مرافق',
  SUPPLIES: 'مستلزمات',
  MAINTENANCE: 'صيانة',
  TRANSPORTATION: 'مواصلات',
  INVENTORY: 'مشتريات مخزون',
  OTHER_EXPENSE: 'مصروفات أخرى',
};

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
