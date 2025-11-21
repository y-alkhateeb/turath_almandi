/**
 * Settings Service
 * Currency settings management operations
 *
 * Endpoints:
 * - GET /settings/currency → CurrencySettings (public, no auth)
 * - GET /settings/currencies → CurrencyWithUsage[] (admin only)
 * - PATCH /settings/currency/default → CurrencySettings (admin only)
 * - POST /settings/currencies → CurrencySettings (admin only)
 *
 * All types match backend DTOs exactly. No any types.
 */

import apiClient from '../apiClient';
import type {
  CurrencySettings,
  CurrencyWithUsage,
  CreateCurrencyInput,
  SetDefaultCurrencyInput,
} from '#/settings.types';

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Settings API endpoints enum
 * Centralized endpoint definitions
 */
export enum SettingsApiEndpoints {
  DefaultCurrency = '/settings/currency',
  Currencies = '/settings/currencies',
  SetDefault = '/settings/currency/default',
}

// ============================================
// SETTINGS SERVICE METHODS
// ============================================

/**
 * Get the default currency
 * GET /settings/currency
 *
 * Public endpoint - no authentication required
 * Returns the currently configured default currency for the system
 *
 * @returns CurrencySettings - The default currency configuration
 * @throws ApiError on 404 (no default currency configured)
 */
export const getDefaultCurrency = (): Promise<CurrencySettings> => {
  return apiClient.get<CurrencySettings>({
    url: SettingsApiEndpoints.DefaultCurrency,
  });
};

/**
 * Get all currencies with usage statistics
 * GET /settings/currencies
 *
 * Admin only endpoint
 * Returns all configured currencies with transaction counts
 * Includes usage statistics for each currency (transactions, debts, payments)
 *
 * @returns CurrencyWithUsage[] - Array of currencies with usage counts
 * @throws ApiError on 401 (not authenticated), 403 (not admin)
 */
export const getAllCurrencies = (): Promise<CurrencyWithUsage[]> => {
  return apiClient.get<CurrencyWithUsage[]>({
    url: SettingsApiEndpoints.Currencies,
  });
};

/**
 * Set a currency as the default
 * PATCH /settings/currency/default
 *
 * Admin only endpoint
 * Sets the specified currency as the system default
 * Only one currency can be default at a time
 *
 * Backend validation (from SetDefaultCurrencyDto):
 * - code: Required, exactly 3 uppercase letters, matches ISO 4217 format
 *
 * @param data - SetDefaultCurrencyInput with currency code
 * @returns CurrencySettings - The updated default currency
 * @throws ApiError on 400 (invalid code format), 401, 403 (not admin), 404 (currency not found)
 */
export const setDefaultCurrency = (data: SetDefaultCurrencyInput): Promise<CurrencySettings> => {
  return apiClient.patch<CurrencySettings>({
    url: SettingsApiEndpoints.SetDefault,
    data,
  });
};

/**
 * Create a new currency
 * POST /settings/currencies
 *
 * Admin only endpoint
 * Creates a new currency configuration
 * The new currency will not be set as default automatically
 *
 * Backend validation (from CreateCurrencyDto):
 * - code: Required, exactly 3 uppercase letters, matches /^[A-Z]{3}$/
 * - name_ar: Required, 1-100 chars, Arabic name
 * - name_en: Required, 1-100 chars, English name
 * - symbol: Required, 1-10 chars, currency symbol
 *
 * @param data - CreateCurrencyInput (code, name_ar, name_en, symbol)
 * @returns CurrencySettings - The created currency
 * @throws ApiError on 400 (validation error), 401, 403 (not admin), 409 (currency code already exists)
 */
export const createCurrency = (data: CreateCurrencyInput): Promise<CurrencySettings> => {
  return apiClient.post<CurrencySettings>({
    url: SettingsApiEndpoints.Currencies,
    data,
  });
};

// ============================================
// EXPORTS
// ============================================

/**
 * Settings service object with all methods
 * Use named exports or default object
 */
const settingsService = {
  getDefaultCurrency,
  getAllCurrencies,
  setDefaultCurrency,
  createCurrency,
};

export default settingsService;
