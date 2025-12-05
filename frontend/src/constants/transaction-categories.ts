/**
 * Transaction Categories with Multi-Item and Discount Support
 * Frontend copy of backend transaction categories
 * Categories are organized by transaction type (INCOME/EXPENSE)
 */

export const INCOME_CATEGORIES = [
  'INVENTORY_SALES',   // مبيعات المخزون - Multi-item ✓ Discount ✓
  'CAPITAL_ADDITION',  // إضافة رأس مال
  'APP_PURCHASES',     // مبيعات التطبيق - Multi-item ✓ Discount ✓
] as const;

export const EXPENSE_CATEGORIES = [
  'EMPLOYEE_SALARIES', // رواتب الموظفين
  'WORKER_DAILY',      // يوميات العمال
  'SUPPLIES',          // مستلزمات
  'MAINTENANCE',       // صيانة
  'INVENTORY',         // مشتريات مخزون - Multi-item ✓
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
 * Categories that only support CASH payment method
 * These categories cannot use MASTER payment
 */
export const CASH_ONLY_CATEGORIES = [
  'CAPITAL_ADDITION',  // إضافة رأس المال - نقدي فقط
] as const;

/**
 * Category labels in Arabic for display purposes
 */
export const CATEGORY_LABELS_AR: Record<TransactionCategory, string> = {
  // INCOME
  INVENTORY_SALES: 'مبيعات المخزون',
  CAPITAL_ADDITION: 'إضافة رأس مال',
  APP_PURCHASES: 'مبيعات التطبيق',
  // EXPENSE
  EMPLOYEE_SALARIES: 'رواتب الموظفين',
  WORKER_DAILY: 'يوميات العمال',
  SUPPLIES: 'مستلزمات',
  MAINTENANCE: 'صيانة',
  INVENTORY: 'مشتريات مخزون',
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
 * Check if category only supports CASH payment
 */
export function isCashOnlyCategory(category: string): boolean {
  return CASH_ONLY_CATEGORIES.includes(category as any);
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
 * Helper function to get Arabic label for category
 * Converts English constant to Arabic label
 */
export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS_AR[category as TransactionCategory] || category;
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

/**
 * System-generated transaction categories
 * These are created automatically by backend services (e.g., Payables, Receivables)
 * and should not be user-selectable
 */
export const SYSTEM_TRANSACTION_CATEGORIES = {
  PAYABLE_PAYMENT: 'دفع حسابات دائنة',
  RECEIVABLE_COLLECTION: 'تحصيل حسابات مدينة',
} as const;

export type SystemTransactionCategory = typeof SYSTEM_TRANSACTION_CATEGORIES[keyof typeof SYSTEM_TRANSACTION_CATEGORIES];

/**
 * Transaction type labels in Arabic
 */
export const TRANSACTION_TYPE_LABELS_AR = {
  INCOME: 'إيراد',
  EXPENSE: 'مصروف',
} as const;

/**
 * Discount type labels in Arabic
 */
export const DISCOUNT_TYPE_LABELS_AR = {
  PERCENTAGE: 'نسبة مئوية',
  AMOUNT: 'مبلغ ثابت',
} as const;

/**
 * Operation type labels in Arabic
 */
export const OPERATION_TYPE_LABELS_AR = {
  PURCHASE: 'شراء',
  CONSUMPTION: 'استهلاك',
} as const;

/**
 * Helper function to get Arabic label for transaction type
 */
export function getTransactionTypeLabel(type: string): string {
  return TRANSACTION_TYPE_LABELS_AR[type as keyof typeof TRANSACTION_TYPE_LABELS_AR] || type;
}

/**
 * Helper function to get Arabic label for discount type
 */
export function getDiscountTypeLabel(type: string | null | undefined): string {
  if (!type) return '-';
  return DISCOUNT_TYPE_LABELS_AR[type as keyof typeof DISCOUNT_TYPE_LABELS_AR] || type;
}

/**
 * Helper function to get Arabic label for operation type
 */
export function getOperationTypeLabel(type: string | null | undefined): string {
  if (!type) return '-';
  return OPERATION_TYPE_LABELS_AR[type as keyof typeof OPERATION_TYPE_LABELS_AR] || type;
}
