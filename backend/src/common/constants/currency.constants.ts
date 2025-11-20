import { Currency } from '@prisma/client';

/**
 * Default currency for the application
 * Change this value to switch to a different currency system-wide
 *
 * Supported currencies: USD, EUR, IQD, SAR, AED
 * @default IQD
 */
export const DEFAULT_CURRENCY: Currency = Currency.IQD;

/**
 * Allowed currencies for the application
 * Restrict to only the currencies your business uses
 *
 * To add support for more currencies:
 * 1. Update this array
 * 2. Ensure the currency exists in the Currency enum in schema.prisma
 * 3. Update currency validation in DTOs if needed
 */
export const ALLOWED_CURRENCIES: Currency[] = [Currency.USD, Currency.IQD];

/**
 * Currency configuration object
 * Useful for future expansion (e.g., exchange rates, formatting)
 */
export const CURRENCY_CONFIG = {
  default: DEFAULT_CURRENCY,
  allowed: ALLOWED_CURRENCIES,

  /**
   * Check if a currency is allowed
   */
  isAllowed: (currency: Currency): boolean => {
    return ALLOWED_CURRENCIES.includes(currency);
  },

  /**
   * Get the default currency
   */
  getDefault: (): Currency => {
    return DEFAULT_CURRENCY;
  },

  /**
   * Validate currency and return default if invalid
   */
  validateOrDefault: (currency?: Currency): Currency => {
    if (!currency) return DEFAULT_CURRENCY;
    return ALLOWED_CURRENCIES.includes(currency) ? currency : DEFAULT_CURRENCY;
  },
} as const;

/**
 * Error message for invalid currency
 */
export const CURRENCY_ERROR_MESSAGE = `Only ${ALLOWED_CURRENCIES.join(', ')} currencies are allowed`;
