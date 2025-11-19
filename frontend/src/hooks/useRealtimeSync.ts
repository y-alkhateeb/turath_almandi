/**
 * useRealtimeSync Hook
 * Unified real-time synchronization for all WebSocket events
 *
 * Features:
 * - Combines useRealtimeNotifications, useRealtimeTransactions, useRealtimeDebts
 * - Single hook that sets up all real-time listeners
 * - Centralized real-time state management
 * - Should be called once in App.tsx or dashboard layout
 * - Strict typing, no `any`
 *
 * Architecture:
 * - Delegates to individual real-time hooks for separation of concerns
 * - Each hook handles its own events and query invalidation
 * - Provides unified settings management
 * - Returns combined state from all real-time features
 */

import { useCallback } from 'react';
import {
  useRealtimeNotifications,
  type NotificationSettings,
} from './useRealtimeNotifications';
import { useRealtimeTransactions } from './useRealtimeTransactions';
import { useRealtimeDebts } from './useRealtimeDebts';
import { useWebSocket } from './useWebSocket';

// ============================================
// TYPES
// ============================================

/**
 * Combined real-time sync state
 * Provides access to all real-time features and settings
 */
export interface RealtimeSyncState {
  /** WebSocket connection state */
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
  /** Whether WebSocket is connected */
  isConnected: boolean;
  /** Notification settings (sound, toast, etc.) */
  notificationSettings: NotificationSettings;
  /** Update notification settings */
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
}

// ============================================
// MAIN HOOK
// ============================================

/**
 * useRealtimeSync Hook
 * Unified hook that sets up all real-time listeners and synchronization
 *
 * This hook should be called once at the app root level (App.tsx)
 * or in the dashboard layout to enable real-time features.
 *
 * Features:
 * - Notifications: Toast, sound, badge updates
 * - Transactions: Real-time transaction updates across branches
 * - Debts: Payment notifications, overdue alerts
 * - Automatic query invalidation for all relevant queries
 *
 * @returns Combined state from all real-time features
 *
 * @example
 * ```tsx
 * // In App.tsx or DashboardLayout
 * function App() {
 *   const {
 *     connectionState,
 *     isConnected,
 *     notificationSettings,
 *     updateNotificationSettings
 *   } = useRealtimeSync();
 *
 *   if (import.meta.env.DEV) {
 *     console.log('[Realtime] Connection:', connectionState);
 *   }
 *
 *   return <Routes />;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Settings page: manage notification preferences
 * function NotificationSettings() {
 *   const { notificationSettings, updateNotificationSettings } = useRealtimeSync();
 *
 *   return (
 *     <div>
 *       <label>
 *         <input
 *           type="checkbox"
 *           checked={notificationSettings.soundEnabled}
 *           onChange={(e) =>
 *             updateNotificationSettings({ soundEnabled: e.target.checked })
 *           }
 *         />
 *         Enable notification sound
 *       </label>
 *     </div>
 *   );
 * }
 * ```
 */
export const useRealtimeSync = (): RealtimeSyncState => {
  // ============================================
  // WEBSOCKET CONNECTION
  // ============================================

  /**
   * Get WebSocket connection state
   * Provides connection status monitoring
   */
  const { connectionState, isConnected } = useWebSocket();

  // ============================================
  // REAL-TIME LISTENERS
  // ============================================

  /**
   * Notifications: Toast, sound, badge updates
   * Listens to: notification:created
   * Invalidates: notifications queries, unread count
   */
  const { settings: notificationSettings, updateSettings: updateNotificationSettings } =
    useRealtimeNotifications();

  /**
   * Transactions: Real-time transaction updates
   * Listens to: transaction:created, transaction:updated, transaction:deleted
   * Invalidates: transactions queries, dashboard queries
   * Toast: Shows notifications for cross-branch transactions (admin only)
   */
  useRealtimeTransactions();

  /**
   * Debts: Payment notifications, overdue alerts
   * Listens to: debt:created, debt:paid, debt:updated
   * Invalidates: debts queries, notifications queries, dashboard queries
   * Toast: Shows payment confirmations and new debt alerts
   */
  useRealtimeDebts();

  // ============================================
  // DEVELOPMENT LOGGING
  // ============================================

  if (import.meta.env.DEV) {
    // Log connection state changes in development
    // This helps debug WebSocket connection issues
    if (connectionState === 'connected') {
      console.log('[RealtimeSync] All real-time listeners active');
    } else if (connectionState === 'error') {
      console.error('[RealtimeSync] WebSocket connection error');
    }
  }

  // ============================================
  // RETURN COMBINED STATE
  // ============================================

  return {
    connectionState,
    isConnected,
    notificationSettings,
    updateNotificationSettings,
  };
};

// ============================================
// CONVENIENCE HOOKS
// ============================================

/**
 * useRealtimeConnectionStatus Hook
 * Returns only the WebSocket connection status
 *
 * Useful for components that only need to display connection state
 * without subscribing to all real-time events.
 *
 * @returns Connection state and boolean
 *
 * @example
 * ```tsx
 * function ConnectionIndicator() {
 *   const { isConnected, connectionState } = useRealtimeConnectionStatus();
 *
 *   return (
 *     <div>
 *       <span>{isConnected ? '🟢' : '🔴'}</span>
 *       <span>{connectionState}</span>
 *     </div>
 *   );
 * }
 * ```
 */
export const useRealtimeConnectionStatus = (): {
  connectionState: RealtimeSyncState['connectionState'];
  isConnected: boolean;
} => {
  const { connectionState, isConnected } = useWebSocket();
  return { connectionState, isConnected };
};

/**
 * useNotificationPreferences Hook
 * Returns only notification settings and update function
 *
 * Useful for settings pages that only manage notification preferences
 * without needing other real-time features.
 *
 * @returns Notification settings and update function
 *
 * @example
 * ```tsx
 * function NotificationPreferences() {
 *   const { settings, updateSettings } = useNotificationPreferences();
 *
 *   return (
 *     <div>
 *       <h2>Notification Settings</h2>
 *       <label>
 *         <input
 *           type="checkbox"
 *           checked={settings.soundEnabled}
 *           onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
 *         />
 *         Enable sound
 *       </label>
 *       <label>
 *         <input
 *           type="checkbox"
 *           checked={settings.toastEnabled}
 *           onChange={(e) => updateSettings({ toastEnabled: e.target.checked })}
 *         />
 *         Enable toast notifications
 *       </label>
 *       <label>
 *         Volume:
 *         <input
 *           type="range"
 *           min="0"
 *           max="1"
 *           step="0.1"
 *           value={settings.soundVolume}
 *           onChange={(e) =>
 *             updateSettings({ soundVolume: parseFloat(e.target.value) })
 *           }
 *         />
 *       </label>
 *     </div>
 *   );
 * }
 * ```
 */
export const useNotificationPreferences = (): {
  settings: NotificationSettings;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
} => {
  const { settings, updateSettings } = useRealtimeNotifications();
  return { settings, updateSettings };
};
