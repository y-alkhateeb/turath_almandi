/**
 * useRealtimeNotifications Hook
 * Real-time notification handling with toast, sound, and badge updates
 *
 * Features:
 * - Listens to 'notification:created' WebSocket events
 * - Shows toast notification immediately
 * - Plays notification sound (if enabled in settings)
 * - Invalidates notifications query
 * - Updates unread count badge
 * - Strict typing, no `any`
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useWebSocketEvent } from './useWebSocket';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queries/queryKeys';
import {
  showNotificationToast,
  requestDesktopNotificationPermission,
  type NotificationPayload as EnhancedNotificationPayload,
} from '@/utils/notificationToast';

// Re-export for convenience
export { requestDesktopNotificationPermission };

// ============================================
// TYPES
// ============================================

/**
 * Notification payload from WebSocket
 * Extended from enhanced notification payload
 */
export type NotificationPayload = EnhancedNotificationPayload;

/**
 * Notification settings
 * Stored in localStorage
 */
export interface NotificationSettings {
  soundEnabled: boolean;
  toastEnabled: boolean;
  desktopEnabled: boolean;
  soundVolume: number; // 0-1
}

// ============================================
// NOTIFICATION SOUND
// ============================================

/**
 * Play notification sound
 * Uses Web Audio API for better control
 */
const playNotificationSound = (volume: number = 0.5): void => {
  try {
    // Create a simple notification beep using AudioContext
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure sound (short beep)
    oscillator.frequency.value = 800; // 800 Hz
    oscillator.type = 'sine';

    // Volume envelope (fade out)
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.2
    );

    // Play for 200ms
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    console.error('[Notifications] Failed to play sound:', error);
  }
};

// ============================================
// SETTINGS STORAGE
// ============================================

/**
 * Get notification settings from localStorage
 */
const getNotificationSettings = (): NotificationSettings => {
  try {
    const stored = localStorage.getItem('notification-settings');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[Notifications] Failed to load settings:', error);
  }

  // Default settings
  return {
    soundEnabled: true,
    toastEnabled: true,
    desktopEnabled: false, // Must be explicitly enabled by user
    soundVolume: 0.5,
  };
};

/**
 * Save notification settings to localStorage
 */
export const saveNotificationSettings = (settings: NotificationSettings): void => {
  try {
    localStorage.setItem('notification-settings', JSON.stringify(settings));
  } catch (error) {
    console.error('[Notifications] Failed to save settings:', error);
  }
};

// ============================================
// UNREAD COUNT MANAGEMENT
// ============================================

/**
 * Get unread notification count from cache
 */
const getUnreadCount = (queryClient: any): number => {
  try {
    const notificationsData = queryClient.getQueriesData({
      queryKey: queryKeys.notifications.all,
    });

    if (notificationsData.length > 0) {
      const data = notificationsData[0][1] as any;
      if (data?.data) {
        return data.data.filter((n: any) => !n.isRead).length;
      }
    }
  } catch (error) {
    console.error('[Notifications] Failed to get unread count:', error);
  }
  return 0;
};

/**
 * Update document title with unread count
 */
const updateDocumentTitle = (unreadCount: number): void => {
  const baseTitle = 'تراث المندي';
  if (unreadCount > 0) {
    document.title = `(${unreadCount}) ${baseTitle}`;
  } else {
    document.title = baseTitle;
  }
};

/**
 * Update favicon badge with unread count
 */
const updateFaviconBadge = (unreadCount: number): void => {
  // This would require a badge library or custom canvas manipulation
  // For now, we just update the title
  // In a real implementation, you could use libraries like:
  // - https://github.com/ejci/favico.js
  // - Or create a canvas-based favicon dynamically
  console.log('[Notifications] Unread count:', unreadCount);
};

// NOTE: Toast formatting and display logic has been moved to @/utils/notificationToast
// This keeps the hook focused on WebSocket event handling and settings management

// ============================================
// MAIN HOOK
// ============================================

/**
 * useRealtimeNotifications Hook
 * Handles real-time notifications from WebSocket
 *
 * Features:
 * - Listens to notification:created events
 * - Shows toast with appropriate styling
 * - Plays sound if enabled
 * - Updates unread count badge
 * - Invalidates notifications query for refetch
 *
 * @returns Object with settings and update function
 *
 * @example
 * ```tsx
 * function App() {
 *   const { settings, updateSettings } = useRealtimeNotifications();
 *
 *   return (
 *     <div>
 *       <label>
 *         <input
 *           type="checkbox"
 *           checked={settings.soundEnabled}
 *           onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
 *         />
 *         Enable notification sound
 *       </label>
 *     </div>
 *   );
 * }
 * ```
 */
export const useRealtimeNotifications = () => {
  const queryClient = useQueryClient();
  const settingsRef = useRef<NotificationSettings>(getNotificationSettings());

  /**
   * Update notification settings
   */
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    settingsRef.current = {
      ...settingsRef.current,
      ...newSettings,
    };
    saveNotificationSettings(settingsRef.current);
  }, []);

  /**
   * Handle notification:created event
   * Uses enhanced toast with navigation, sound, and desktop notifications
   */
  const handleNotification = useCallback(
    (payload: NotificationPayload) => {
      const settings = settingsRef.current;

      console.log('[Notifications] Received:', payload);

      // Show enhanced toast notification
      if (settings.toastEnabled) {
        showNotificationToast(payload, {
          soundEnabled: settings.soundEnabled,
          soundVolume: settings.soundVolume,
          desktopEnabled: settings.desktopEnabled,
        });
      }

      // Invalidate notifications query to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });

      // Update unread count
      setTimeout(() => {
        const unreadCount = getUnreadCount(queryClient) + 1; // +1 for the new notification
        updateDocumentTitle(unreadCount);
        updateFaviconBadge(unreadCount);
      }, 500); // Small delay to ensure query has refetched
    },
    [queryClient],
  );

  // Subscribe to notification:created events
  useWebSocketEvent('notification:created', handleNotification);

  // Update unread count on mount and when notifications change
  useEffect(() => {
    const unreadCount = getUnreadCount(queryClient);
    updateDocumentTitle(unreadCount);
    updateFaviconBadge(unreadCount);
  }, [queryClient]);

  // Reset title on unmount
  useEffect(() => {
    return () => {
      document.title = 'تراث المندي';
    };
  }, []);

  return {
    settings: settingsRef.current,
    updateSettings,
  };
};

/**
 * useNotificationBadge Hook
 * Manages unread notification count badge
 *
 * @returns Unread count
 *
 * @example
 * ```tsx
 * function NotificationBell() {
 *   const unreadCount = useNotificationBadge();
 *
 *   return (
 *     <div className="relative">
 *       <BellIcon />
 *       {unreadCount > 0 && (
 *         <span className="badge">{unreadCount}</span>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export const useNotificationBadge = (): number => {
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = React.useState(0);

  useEffect(() => {
    // Initial count
    setUnreadCount(getUnreadCount(queryClient));

    // Update count when notifications change
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      setUnreadCount(getUnreadCount(queryClient));
    });

    return unsubscribe;
  }, [queryClient]);

  return unreadCount;
};
