import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import settingsService from '../api/services/settingsService';

/**
 * Currency Settings from backend
 */
interface CurrencySettings {
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
 * Currency Store State
 */
interface CurrencyState {
  // State
  currency: CurrencySettings | null;
  isLoading: boolean;
  lastFetchedAt: number | null;
  error: string | null;

  // Actions
  fetchCurrency: () => Promise<void>;
  refreshCurrency: () => Promise<void>;
  clearCurrency: () => void;
  shouldRefresh: () => boolean;
}

// Cache configuration
const CACHE_TTL = 1000 * 60 * 60; // 1 hour in milliseconds
const STORAGE_KEY = 'currency-storage';

/**
 * Currency Store
 *
 * Caches default currency in localStorage with automatic refresh
 *
 * Features:
 * - Persists currency in localStorage
 * - Auto-refresh after 1 hour
 * - Manual refresh when admin changes currency
 * - Loading states
 * - Error handling
 *
 * Usage:
 * ```typescript
 * const { currency, fetchCurrency } = useCurrencyStore();
 *
 * // On app load
 * useEffect(() => {
 *   fetchCurrency();
 * }, []);
 *
 * // Display currency
 * {currency && `${amount} ${currency.symbol}`}
 * ```
 */
export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      // Initial state
      currency: null,
      isLoading: false,
      lastFetchedAt: null,
      error: null,

      /**
       * Check if currency cache should be refreshed
       * Returns true if:
       * - Never fetched before
       * - Cache is older than TTL (1 hour)
       */
      shouldRefresh: () => {
        const { lastFetchedAt } = get();
        if (!lastFetchedAt) return true;

        const now = Date.now();
        const age = now - lastFetchedAt;
        return age > CACHE_TTL;
      },

      /**
       * Fetch default currency from API
       * Uses cache if available and not expired
       *
       * @throws Error on API failure
       */
      fetchCurrency: async () => {
        const { shouldRefresh, currency } = get();

        // Return cached currency if still valid
        if (currency && !shouldRefresh()) {
          return;
        }

        // Fetch fresh currency
        set({ isLoading: true, error: null });
        try {
          const fetchedCurrency = await settingsService.getDefaultCurrency();
          set({
            currency: fetchedCurrency,
            isLoading: false,
            lastFetchedAt: Date.now(),
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'فشل في تحميل العملة';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      /**
       * Force refresh currency from API
       * Bypasses cache and fetches fresh data
       * Use this when admin changes default currency
       *
       * @throws Error on API failure
       */
      refreshCurrency: async () => {
        set({ isLoading: true, error: null });
        try {
          const fetchedCurrency = await settingsService.getDefaultCurrency();
          set({
            currency: fetchedCurrency,
            isLoading: false,
            lastFetchedAt: Date.now(),
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'فشل في تحديث العملة';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      /**
       * Clear currency cache
       * Use this on logout or when resetting app state
       */
      clearCurrency: () => {
        set({
          currency: null,
          lastFetchedAt: null,
          error: null,
        });
      },
    }),
    {
      name: STORAGE_KEY,
      // Persist currency data and timestamp
      partialize: (state) => ({
        currency: state.currency,
        lastFetchedAt: state.lastFetchedAt,
      }),
    }
  )
);

/**
 * Hook to get currency with auto-fetch
 * Automatically fetches currency if not loaded or expired
 *
 * @returns CurrencySettings | null
 *
 * @example
 * ```typescript
 * function TransactionDisplay() {
 *   const currency = useCurrency();
 *
 *   if (!currency) return <Skeleton />;
 *
 *   return <div>{amount} {currency.symbol}</div>;
 * }
 * ```
 */
export const useCurrency = (): CurrencySettings | null => {
  const { currency, fetchCurrency, shouldRefresh } = useCurrencyStore();

  // Auto-fetch on first render or if cache expired
  React.useEffect(() => {
    if (shouldRefresh()) {
      fetchCurrency().catch(console.error);
    }
  }, [fetchCurrency, shouldRefresh]);

  return currency;
};

// Export React for useEffect in useCurrency hook
import React from 'react';
