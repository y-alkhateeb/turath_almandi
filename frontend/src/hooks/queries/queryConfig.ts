/**
 * Query Configuration Constants
 *
 * Centralized React Query configuration for consistent caching behavior.
 * Use the spread operator to apply these configs: ...QUERY_CONFIG.standard
 */

/**
 * Query config presets for different use cases
 */
export const QUERY_CONFIG = {
  /**
   * Standard config for most queries
   * - 5 minute stale time (data considered fresh)
   * - 10 minute gc time (cache eviction)
   * - 1 retry on failure
   *
   * Use for: Dashboard stats, transaction lists, employee lists, etc.
   */
  standard: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  },

  /**
   * Realtime config for frequently updating data
   * - 30 second stale time
   * - 1 minute gc time
   * - 2 retries on failure
   *
   * Use for: Notifications, unread counts, live updates
   */
  realtime: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 60 * 1000, // 1 minute
    retry: 2,
  },

  /**
   * Static config for rarely changing data
   * - 30 minute stale time
   * - 60 minute gc time
   * - No retry (data unlikely to change)
   *
   * Use for: Settings, categories, system constants
   */
  static: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
    retry: 0,
  },

  /**
   * Long-lived config for reference data
   * - 1 hour stale time
   * - 4 hour gc time
   * - 1 retry on failure
   *
   * Use for: Branches list, users dropdown data
   */
  reference: {
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 4 * 60 * 60 * 1000, // 4 hours
    retry: 1,
  },
} as const;

/**
 * Time constants for convenience
 */
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
} as const;

/**
 * Type for query config preset names
 */
export type QueryConfigPreset = keyof typeof QUERY_CONFIG;

/**
 * Helper to get query config by preset name
 *
 * @param preset - Preset name (standard, realtime, static, reference)
 * @returns Query config object
 *
 * @example
 * ```tsx
 * useQuery({
 *   queryKey: ['example'],
 *   queryFn: fetchExample,
 *   ...getQueryConfig('standard'),
 * });
 * ```
 */
export const getQueryConfig = (preset: QueryConfigPreset) => QUERY_CONFIG[preset];
