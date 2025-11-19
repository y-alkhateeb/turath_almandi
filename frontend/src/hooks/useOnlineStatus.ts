/**
 * useOnlineStatus Hook
 * Tracks browser online/offline status with React Query integration
 *
 * Features:
 * - Detects network connectivity using navigator.onLine
 * - Listens to online/offline events
 * - Automatically retries failed queries when back online
 * - Provides isOnline boolean state
 * - Strict TypeScript typing
 *
 * @example
 * ```tsx
 * const { isOnline, wasOffline } = useOnlineStatus();
 *
 * if (!isOnline) {
 *   return <OfflineBanner />;
 * }
 * ```
 */

import { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// ============================================
// TYPES
// ============================================

/**
 * Online status hook return type
 */
export interface OnlineStatus {
  /** Whether browser is currently online */
  isOnline: boolean;

  /** Whether user was offline and just came back online */
  wasOffline: boolean;
}

// ============================================
// HOOK
// ============================================

/**
 * useOnlineStatus Hook
 * Track browser online/offline status and retry queries when back online
 *
 * @returns OnlineStatus object with isOnline and wasOffline flags
 *
 * @example
 * ```tsx
 * const { isOnline, wasOffline } = useOnlineStatus();
 *
 * // Show offline banner
 * {!isOnline && <OfflineBanner />}
 *
 * // Show "Back online" message
 * {wasOffline && <Toast>You're back online!</Toast>}
 * ```
 */
export function useOnlineStatus(): OnlineStatus {
  const queryClient = useQueryClient();

  // Online state (initialized from navigator.onLine)
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    // Check if navigator is available (SSR safety)
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });

  // Track if user was offline (for "back online" notifications)
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  // Ref to track if we've already retried (prevent duplicate retries)
  const hasRetriedRef = useRef<boolean>(false);

  useEffect(() => {
    // ============================================
    // EVENT HANDLERS
    // ============================================

    /**
     * Handle online event
     * Fires when browser regains network connection
     */
    const handleOnline = (): void => {
      console.log('[useOnlineStatus] Browser is online');
      setIsOnline(true);

      // Mark that user was offline (for notifications)
      setWasOffline(true);

      // Retry all failed queries when back online
      if (!hasRetriedRef.current) {
        console.log('[useOnlineStatus] Retrying failed queries...');

        // Invalidate all queries to trigger refetch
        queryClient.invalidateQueries();

        // Resume paused queries (queries that failed while offline)
        queryClient.resumePausedMutations();

        hasRetriedRef.current = true;

        // Reset retry flag after 5 seconds
        setTimeout(() => {
          hasRetriedRef.current = false;
        }, 5000);
      }

      // Clear "was offline" flag after 10 seconds
      setTimeout(() => {
        setWasOffline(false);
      }, 10000);
    };

    /**
     * Handle offline event
     * Fires when browser loses network connection
     */
    const handleOffline = (): void => {
      console.log('[useOnlineStatus] Browser is offline');
      setIsOnline(false);
      setWasOffline(false); // Clear wasOffline when going offline again
      hasRetriedRef.current = false; // Reset retry flag
    };

    // ============================================
    // EVENT LISTENERS
    // ============================================

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check (in case status changed before hook mounted)
    const currentStatus = navigator.onLine;
    if (currentStatus !== isOnline) {
      setIsOnline(currentStatus);
    }

    // ============================================
    // CLEANUP
    // ============================================

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queryClient, isOnline]);

  return {
    isOnline,
    wasOffline,
  };
}

// ============================================
// HELPER HOOK (Optional)
// ============================================

/**
 * useIsOnline Hook
 * Simple hook that only returns isOnline boolean
 * Use when you don't need wasOffline flag
 *
 * @returns boolean - whether browser is online
 *
 * @example
 * ```tsx
 * const isOnline = useIsOnline();
 * if (!isOnline) return <div>Offline!</div>;
 * ```
 */
export function useIsOnline(): boolean {
  const { isOnline } = useOnlineStatus();
  return isOnline;
}

export default useOnlineStatus;
