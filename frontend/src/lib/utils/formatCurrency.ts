/**
 * Currency Formatting Utilities
 *
 * Provides consistent currency formatting across the application
 * using the default currency from global settings.
 */

import type { CurrencySettings } from '#/settings.types';

/**
 * Format amount with currency symbol
 *
 * @param amount - The numeric amount to format
 * @param currency - The currency settings (symbol, code, etc.)
 * @returns Formatted string with currency symbol and localized number
 *
 * @example
 * ```ts
 * const currency = { symbol: 'د.ع', code: 'IQD', ... };
 * formatCurrency(1234.56, currency);
 * // Returns: "د.ع 1,234.56"
 * ```
 */
export const formatCurrency = (amount: number, currency: CurrencySettings): string => {
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
 * @param currency - The currency settings (symbol, code, etc.)
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
export const formatCurrencyCompact = (amount: number, currency: CurrencySettings): string => {
  // Check if amount is a whole number
  const isWholeNumber = amount % 1 === 0;

  // Format with appropriate decimal places
  const formattedAmount = amount.toLocaleString('ar-IQ', {
    minimumFractionDigits: isWholeNumber ? 0 : 2,
    maximumFractionDigits: 2,
  });

  return `${currency.symbol} ${formattedAmount}`;
};

/**
 * Format amount with currency code
 *
 * @param amount - The numeric amount to format
 * @param currency - The currency settings (symbol, code, etc.)
 * @returns Formatted string with currency code and localized number
 *
 * @example
 * ```ts
 * const currency = { symbol: 'د.ع', code: 'IQD', ... };
 * formatCurrencyWithCode(1234.56, currency);
 * // Returns: "1,234.56 IQD"
 * ```
 */
export const formatCurrencyWithCode = (amount: number, currency: CurrencySettings): string => {
  const formattedAmount = amount.toLocaleString('ar-IQ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${formattedAmount} ${currency.code}`;
};
