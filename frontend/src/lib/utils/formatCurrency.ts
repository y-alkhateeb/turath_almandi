/**
 * Currency Formatting Utilities
 *
 * Provides consistent currency formatting across the application
 * using the default currency from global settings.
 */

import type { CurrencySettings } from '#/settings.types';

/**
 * Default fallback currency (IQD)
 * Used when currency is not yet loaded from settings
 */
const DEFAULT_CURRENCY: CurrencySettings = {
  id: 'default',
  code: 'IQD',
  nameAr: 'دينار عراقي',
  nameEn: 'Iraqi Dinar',
  symbol: 'د.ع',
  isDefault: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Format amount with currency symbol
 *
 * @param amount - The numeric amount to format
 * @param currency - The currency settings (shows loading state if not provided)
 * @returns Formatted string with currency symbol and localized number, or loading indicator
 *
 * @example
 * ```ts
 * const currency = { symbol: 'د.ع', code: 'IQD', ... };
 * formatCurrency(1234.56, currency);
 * // Returns: "د.ع 1,234.56"
 *
 * // Without currency (loading state)
 * formatCurrency(1234.56);
 * // Returns: "..." (loading indicator)
 * ```
 */
export const formatCurrency = (
  amount: number,
  currency?: CurrencySettings | null
): string => {
  // Show loading indicator if currency not loaded yet
  if (!currency) {
    return '...';
  }

  // Format number with Arabic locale for proper thousands separator
  const formattedAmount = amount.toLocaleString('ar-IQ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Return symbol + space + amount
  return `${currency.symbol} ${formattedAmount}`;
};

/**
 * Format amount with currency symbol (compact version without decimals for whole numbers)
 *
 * @param amount - The numeric amount to format
 * @param currency - The currency settings (optional, defaults to IQD)
 * @returns Formatted string with currency symbol and localized number
 *
 * @example
 * ```ts
 * const currency = { symbol: 'د.ع', code: 'IQD', ... };
 * formatCurrencyCompact(1234, currency);
 * // Returns: "د.ع 1,234"
 * formatCurrencyCompact(1234.56, currency);
 * // Returns: "د.ع 1,234.56"
 * ```
 */
export const formatCurrencyCompact = (
  amount: number,
  currency?: CurrencySettings | null
): string => {
  // Use provided currency or default to IQD
  const curr = currency || DEFAULT_CURRENCY;

  // Check if amount is a whole number
  const isWholeNumber = amount % 1 === 0;

  // Format with appropriate decimal places
  const formattedAmount = amount.toLocaleString('ar-IQ', {
    minimumFractionDigits: isWholeNumber ? 0 : 2,
    maximumFractionDigits: 2,
  });

  return `${curr.symbol} ${formattedAmount}`;
};

/**
 * Format amount with currency code
 *
 * @param amount - The numeric amount to format
 * @param currency - The currency settings (optional, defaults to IQD)
 * @returns Formatted string with currency code and localized number
 *
 * @example
 * ```ts
 * const currency = { symbol: 'د.ع', code: 'IQD', ... };
 * formatCurrencyWithCode(1234.56, currency);
 * // Returns: "1,234.56 IQD"
 * ```
 */
export const formatCurrencyWithCode = (
  amount: number,
  currency?: CurrencySettings | null
): string => {
  // Use provided currency or default to IQD
  const curr = currency || DEFAULT_CURRENCY;

  const formattedAmount = amount.toLocaleString('ar-IQ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${formattedAmount} ${curr.code}`;
};
