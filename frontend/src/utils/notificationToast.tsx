/**
 * Enhanced Notification Toast Handler
 * Handles notification payloads with advanced features
 *
 * Features:
 * - Type-based styling with Sonner toast
 * - Click to navigate to related entity
 * - Auto-dismiss after 5s or persist for errors
 * - Sound notifications (optional, user setting)
 * - Desktop notification API (if granted)
 * - Strict TypeScript types
 */

import { toast } from 'sonner';
import type { ExternalToast } from 'sonner';

// ============================================
// TYPES
// ============================================

/**
 * Notification payload from WebSocket
 */
export interface NotificationPayload {
  id: string;
  userId?: string;
  branchId?: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  createdAt: string;
  /** Related entity for navigation */
  relatedEntityType?: EntityType;
  relatedEntityId?: string;
}

/**
 * Notification types
 */
export type NotificationType =
  | 'DEBT_OVERDUE'
  | 'DEBT_DUE_SOON'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'TRANSACTION'
  | 'SYSTEM'
  | 'USER_ACTION'
  | 'INVENTORY_UPDATE'
  | 'REPORT_READY';

/**
 * Notification priority levels
 */
export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/**
 * Related entity types for navigation
 */
export type EntityType = 'transaction' | 'debt' | 'inventory' | 'user' | 'branch';

/**
 * Toast configuration options
 */
export interface NotificationToastOptions {
  /** Enable sound notification */
  soundEnabled?: boolean;
  /** Sound volume (0-1) */
  soundVolume?: number;
  /** Enable desktop notifications */
  desktopEnabled?: boolean;
  /** Custom click handler (overrides default navigation) */
  onClick?: (payload: NotificationPayload) => void;
}

// ============================================
// NOTIFICATION ICONS
// ============================================

/**
 * Get icon based on notification type and priority
 */
const getNotificationIcon = (type: NotificationType, priority?: NotificationPriority): string => {
  // Priority-based icons
  if (priority === 'URGENT') return '🚨';
  if (priority === 'HIGH') return '⚠️';

  // Type-based icons
  switch (type) {
    case 'DEBT_OVERDUE':
    case 'DEBT_DUE_SOON':
      return '💳';
    case 'LOW_STOCK':
    case 'OUT_OF_STOCK':
      return '📦';
    case 'TRANSACTION':
      return '💰';
    case 'SYSTEM':
      return 'ℹ️';
    case 'USER_ACTION':
      return '👤';
    case 'INVENTORY_UPDATE':
      return '📋';
    case 'REPORT_READY':
      return '📊';
    default:
      return '🔔';
  }
};

// ============================================
// NAVIGATION HELPERS
// ============================================

/**
 * Get navigation path for related entity
 */
const getEntityNavigationPath = (
  entityType: EntityType | undefined,
  entityId: string | undefined
): string | null => {
  if (!entityType || !entityId) return null;

  switch (entityType) {
    case 'transaction':
      return `/transactions/view/${entityId}`;
    case 'debt':
      return `/debts/list`; // Debts don't have individual view pages yet
    case 'inventory':
      return `/inventory/list`; // Inventory items view in list
    case 'user':
      return `/management/system/users/list`;
    case 'branch':
      return `/management/system/branches/list`;
    default:
      return null;
  }
};

/**
 * Navigate to related entity
 */
const navigateToEntity = (payload: NotificationPayload): void => {
  const path = getEntityNavigationPath(payload.relatedEntityType, payload.relatedEntityId);
  if (path) {
    // Use window.location for navigation (works globally)
    // Alternative: Pass router instance if needed
    window.location.href = path;
  }
};

// ============================================
// SOUND NOTIFICATION
// ============================================

/**
 * Play notification sound using Web Audio API
 */
const playNotificationSound = (volume: number = 0.5): void => {
  try {
    const audioContext = new (window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();

    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure sound (short beep)
    oscillator.frequency.value = 800; // 800 Hz
    oscillator.type = 'sine';

    // Volume envelope (fade out)
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    // Play for 200ms
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (_error) {
    console.error('[NotificationToast] Failed to play sound:', _error);
  }
};

// ============================================
// DESKTOP NOTIFICATION
// ============================================

/**
 * Show desktop notification using Notification API
 * Requires user permission
 */
const showDesktopNotification = (payload: NotificationPayload): void => {
  // Check if Notification API is supported
  if (!('Notification' in window)) {
    console.warn('[NotificationToast] Desktop notifications not supported');
    return;
  }

  // Check permission
  if (Notification.permission === 'granted') {
    const notification = new Notification(payload.title, {
      body: payload.message,
      icon: '/favicon.ico', // App icon
      badge: '/favicon.ico',
      tag: payload.id, // Prevent duplicates
      requireInteraction: payload.priority === 'URGENT' || payload.priority === 'HIGH',
      silent: false,
    });

    // Handle click to navigate
    notification.onclick = () => {
      window.focus();
      navigateToEntity(payload);
      notification.close();
    };
  } else if (Notification.permission !== 'denied') {
    // Request permission if not denied
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        showDesktopNotification(payload);
      }
    });
  }
};

/**
 * Request desktop notification permission
 * Should be called on user interaction
 */
export const requestDesktopNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('[NotificationToast] Desktop notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// ============================================
// TOAST DISPLAY
// ============================================

/**
 * Get toast duration based on priority
 * Errors and urgent notifications persist longer
 */
const getToastDuration = (priority?: NotificationPriority): number => {
  switch (priority) {
    case 'URGENT':
      return 10000; // 10 seconds
    case 'HIGH':
      return 7000; // 7 seconds
    case 'MEDIUM':
      return 5000; // 5 seconds
    case 'LOW':
    default:
      return 4000; // 4 seconds
  }
};

/**
 * Get Sonner toast function based on priority
 */
const getToastFunction = (priority?: NotificationPriority): typeof toast.info => {
  switch (priority) {
    case 'URGENT':
    case 'HIGH':
      return toast.error;
    case 'MEDIUM':
      return toast.warning;
    case 'LOW':
    default:
      return toast.info;
  }
};

/**
 * Get toast action button config
 */
const getToastAction = (
  payload: NotificationPayload,
  customOnClick?: (payload: NotificationPayload) => void
): ExternalToast['action'] | undefined => {
  const hasEntity = payload.relatedEntityType && payload.relatedEntityId;
  if (!hasEntity && !customOnClick) return undefined;

  return {
    label: 'عرض',
    onClick: () => {
      if (customOnClick) {
        customOnClick(payload);
      } else {
        navigateToEntity(payload);
      }
    },
  };
};

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Show enhanced notification toast
 *
 * Features:
 * - Type-based styling (error/warning/info based on priority)
 * - Click action to navigate to related entity
 * - Auto-dismiss with priority-based duration
 * - Optional sound notification
 * - Optional desktop notification
 *
 * @param payload - Notification payload
 * @param options - Toast configuration options
 *
 * @example
 * ```tsx
 * showNotificationToast({
 *   id: '123',
 *   type: 'DEBT_OVERDUE',
 *   title: 'دين متأخر',
 *   message: 'دين المدين أحمد متأخر بمبلغ 500,000 دينار',
 *   priority: 'HIGH',
 *   relatedEntityType: 'debt',
 *   relatedEntityId: 'debt-123',
 * }, {
 *   soundEnabled: true,
 *   soundVolume: 0.7,
 *   desktopEnabled: true,
 * });
 * ```
 */
export const showNotificationToast = (
  payload: NotificationPayload,
  options?: NotificationToastOptions
): void => {
  const {
    soundEnabled = false,
    soundVolume = 0.5,
    desktopEnabled = false,
    onClick,
  } = options || {};

  // Get toast configuration
  const duration = getToastDuration(payload.priority);
  const toastFn = getToastFunction(payload.priority);
  const action = getToastAction(payload, onClick);
  const icon = getNotificationIcon(payload.type, payload.priority);

  // Show toast
  toastFn(`${icon} ${payload.title}`, {
    description: payload.message,
    duration,
    action,
    important: payload.priority === 'URGENT' || payload.priority === 'HIGH',
    closeButton: true,
  });

  // Play sound if enabled
  if (soundEnabled) {
    playNotificationSound(soundVolume);
  }

  // Show desktop notification if enabled
  if (desktopEnabled) {
    showDesktopNotification(payload);
  }
};

/**
 * Show simple notification toast without advanced features
 * Useful for non-realtime notifications
 *
 * @param title - Notification title
 * @param message - Notification message
 * @param type - Toast type
 *
 * @example
 * ```tsx
 * showSimpleToast('تم الحفظ', 'تم حفظ التغييرات بنجاح', 'success');
 * ```
 */
export const showSimpleToast = (
  title: string,
  message?: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'info'
): void => {
  const toastFn =
    type === 'success'
      ? toast.success
      : type === 'error'
        ? toast.error
        : type === 'warning'
          ? toast.warning
          : toast.info;

  toastFn(title, {
    description: message,
    duration: 4000,
    closeButton: true,
  });
};
