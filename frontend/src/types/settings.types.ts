/**
 * Settings Type Definitions
 * Type definitions for currency settings and configuration
 */

// ============================================
// CURRENCY SETTINGS
// ============================================

/**
 * Currency settings entity
 * Represents a currency configuration in the system
 */
export interface CurrencySettings {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  symbol: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Currency settings with usage statistics
 * Extended currency settings including transaction counts
 */
export interface CurrencyWithUsage extends CurrencySettings {
  usageCount: {
    transactions: number;
    debts: number;
    payments: number;
    total: number;
  };
}

/**
 * Input type for creating a new currency
 * POST /settings/currencies
 */
export interface CreateCurrencyInput {
  code: string;
  name_ar: string;
  name_en: string;
  symbol: string;
}

/**
 * Input type for setting default currency
 * PATCH /settings/currency/default
 */
export interface SetDefaultCurrencyInput {
  code: string;
}
