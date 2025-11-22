/**
 * Currency Utilities
 * Helper functions for formatting amounts with currency
 */

/**
 * Currency Settings interface
 */
interface CurrencySettings {
  code: string;
  symbol: string;
  nameAr: string;
  nameEn: string;
}

/**
 * Format amount with currency symbol
 *
 * @param amount - Numeric amount to format
 * @param currency - Currency settings object
 * @param options - Formatting options
 * @returns Formatted string with currency symbol
 *
 * @example
 * ```typescript
 * formatCurrency(1000, currency);
 * // → "1,000 د.ع"
 *
 * formatCurrency(1500.5, currency, { decimals: 2 });
 * // → "1,500.50 د.ع"
 *
 * formatCurrency(999, currency, { position: 'before' });
 * // → "$ 999"
 * ```
 */
export function formatCurrency(
  amount: number,
  currency: CurrencySettings | null,
  options: {
    decimals?: number;
    position?: 'before' | 'after';
    separator?: string;
  } = {}
): string {
  const {
    decimals = 0,
    position = 'after',
    separator = ' ',
  } = options;

  // Default to empty string if no currency
  if (!currency) {
    return formatNumber(amount, decimals);
  }

  const formattedAmount = formatNumber(amount, decimals);

  if (position === 'before') {
    return `${currency.symbol}${separator}${formattedAmount}`;
  }

  return `${formattedAmount}${separator}${currency.symbol}`;
}

/**
 * Format number with thousand separators and decimals
 *
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string
 *
 * @example
 * ```typescript
 * formatNumber(1000);      // → "1,000"
 * formatNumber(1500.5, 2); // → "1,500.50"
 * formatNumber(999999);    // → "999,999"
 * ```
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Parse formatted currency string to number
 *
 * @param value - Currency string (e.g., "1,000 د.ع")
 * @returns Parsed number
 *
 * @example
 * ```typescript
 * parseCurrency("1,000 د.ع");  // → 1000
 * parseCurrency("1,500.50 $"); // → 1500.5
 * ```
 */
export function parseCurrency(value: string): number {
  // Remove all non-numeric characters except decimal point and minus
  const cleaned = value.replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Get currency symbol direction
 * Some currencies display symbol before (e.g., $100)
 * Others display symbol after (e.g., 100€)
 *
 * @param currencyCode - ISO 4217 currency code
 * @returns 'before' | 'after'
 */
export function getCurrencySymbolPosition(currencyCode: string): 'before' | 'after' {
  const beforeSymbolCurrencies = ['USD', 'GBP', 'EUR', 'CAD', 'AUD'];

  if (beforeSymbolCurrencies.includes(currencyCode)) {
    return 'before';
  }

  return 'after';
}

/**
 * Format currency with automatic symbol positioning
 * Based on currency code conventions
 *
 * @param amount - Amount to format
 * @param currency - Currency settings
 * @param decimals - Decimal places (default: 0)
 * @returns Formatted currency string
 *
 * @example
 * ```typescript
 * formatCurrencyAuto(1000, { code: 'USD', symbol: '$' });
 * // → "$ 1,000"
 *
 * formatCurrencyAuto(1000, { code: 'IQD', symbol: 'د.ع' });
 * // → "1,000 د.ع"
 * ```
 */
export function formatCurrencyAuto(
  amount: number,
  currency: CurrencySettings | null,
  decimals: number = 0
): string {
  if (!currency) {
    return formatNumber(amount, decimals);
  }

  const position = getCurrencySymbolPosition(currency.code);

  return formatCurrency(amount, currency, {
    decimals,
    position,
  });
}

/**
 * Get currency display name (Arabic or English)
 *
 * @param currency - Currency settings
 * @param locale - 'ar' for Arabic, 'en' for English
 * @returns Currency name
 */
export function getCurrencyName(
  currency: CurrencySettings | null,
  locale: 'ar' | 'en' = 'ar'
): string {
  if (!currency) return '';
  return locale === 'ar' ? currency.nameAr : currency.nameEn;
}
