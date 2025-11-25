/**
 * useSettings Hooks
 * React Query hooks for currency settings management
 *
 * Features:
 * - Default currency query (public, no auth)
 * - All currencies query with usage statistics (admin only)
 * - Set default currency mutation (admin only)
 * - Create currency mutation (admin only)
 * - Arabic toast messages
 * - Auto-invalidation on mutations
 * - Full error handling and strict typing
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import settingsService from '@/api/services/settingsService';
import { queryKeys } from './queryKeys';
import { useCurrencyStore } from '@/stores/currencyStore';
import type {
  CurrencySettings,
  CurrencyWithUsage,
  CreateCurrencyInput,
  SetDefaultCurrencyInput,
} from '#/settings.types';
import { ApiError } from '@/api/apiClient';

// ============================================
// QUERY HOOKS
// ============================================

/**
 * useDefaultCurrency Hook
 * Query the default currency
 * Public endpoint - no authentication required
 * Currencies rarely change, so stale time is 5 minutes
 *
 * @returns Query result with default currency settings
 *
 * @example
 * ```tsx
 * const { data: defaultCurrency, isLoading } = useDefaultCurrency();
 * console.log('Default currency:', defaultCurrency?.code);
 * ```
 */
export const useDefaultCurrency = () => {
  return useQuery<CurrencySettings, ApiError>({
    queryKey: queryKeys.settings.defaultCurrency(),
    queryFn: () => settingsService.getDefaultCurrency(),
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
    retry: 1,
  });
};

/**
 * useAllCurrencies Hook
 * Query all currencies with usage statistics
 * Admin only endpoint
 *
 * @param isAdmin - Whether the current user is an admin
 * @returns Query result with all currencies and usage counts
 *
 * @example
 * ```tsx
 * const { user } = useAuth();
 * const isAdmin = user?.role === 'ADMIN';
 * const { data: currencies, isLoading } = useAllCurrencies(isAdmin);
 * ```
 */
export const useAllCurrencies = (isAdmin: boolean) => {
  return useQuery<CurrencyWithUsage[], ApiError>({
    queryKey: queryKeys.settings.allCurrencies(),
    queryFn: () => settingsService.getAllCurrencies(),
    enabled: isAdmin, // Only fetch if user is admin
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
    retry: 1,
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * useSetDefaultCurrency Hook
 * Mutation to set a currency as the default
 * Admin only operation
 * Invalidates both default currency and all currencies queries
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const setDefault = useSetDefaultCurrency();
 *
 * const handleSetDefault = async (code: string) => {
 *   await setDefault.mutateAsync({ code });
 * };
 * ```
 */
export const useSetDefaultCurrency = () => {
  const queryClient = useQueryClient();

  return useMutation<CurrencySettings, ApiError, SetDefaultCurrencyInput>({
    mutationFn: settingsService.setDefaultCurrency,

    onSuccess: (data) => {
      // Invalidate both default currency and all currencies queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.currency,
      });

      // Update Zustand store with new currency to sync across all components
      // This ensures CurrencyAmount components display the new currency immediately
      useCurrencyStore.getState().refreshCurrency();

      // Show success toast
      toast.success('تم تغيير العملة الافتراضية بنجاح');
    },

    // Note: Error toast shown by global API interceptor
  });
};

/**
 * useCreateCurrency Hook
 * Mutation to create a new currency
 * Admin only operation
 * New currency will not be set as default automatically
 * Invalidates all currencies query
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const createCurrency = useCreateCurrency();
 *
 * const handleCreate = async () => {
 *   await createCurrency.mutateAsync({
 *     code: 'EUR',
 *     name_ar: 'يورو',
 *     name_en: 'Euro',
 *     symbol: '€',
 *   });
 * };
 * ```
 */
export const useCreateCurrency = () => {
  const queryClient = useQueryClient();

  return useMutation<CurrencySettings, ApiError, CreateCurrencyInput>({
    mutationFn: settingsService.createCurrency,

    onSuccess: () => {
      // Invalidate all currencies query
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.allCurrencies(),
      });

      // Show success toast
      toast.success('تم إضافة العملة بنجاح');
    },

    // Note: Error toast shown by global API interceptor
  });
};
