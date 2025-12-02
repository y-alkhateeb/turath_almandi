/**
 * Notification Service
 * Notification CRUD operations and settings management
 *
 * Endpoints:
 * - GET /notifications?filters → PaginatedResponse<Notification>
 * - GET /notifications/unread/count → { count: number }
 * - PATCH /notifications/:id/read → Notification
 * - PATCH /notifications/read-all → void
 * - GET /notifications/settings → NotificationSettings[]
 * - PATCH /notifications/settings → NotificationSettings
 *
 * All types match backend DTOs exactly. No any types.
 */

import apiClient from '../apiClient';
import type { Notification, NotificationSettings, UpdateNotificationSettingsInput } from '#/entity';
import type { PaginatedResponse, NotificationQueryFilters } from '#/api';

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Notification API endpoints enum
 * Centralized endpoint definitions
 */
export enum NotificationApiEndpoints {
  Base = '/notifications',
  UnreadCount = '/notifications/unread/count',
  MarkAsRead = '/notifications/:id/read',
  MarkAllAsRead = '/notifications/read-all',
  Settings = '/notifications/settings',
}

// ============================================
// NOTIFICATION SERVICE METHODS
// ============================================

/**
 * Get all notifications with pagination and filters
 * GET /notifications
 *
 * Supports filtering by:
 * - branchId: UUID
 * - isRead: 'true' | 'false' (string boolean)
 * - type: string (notification type)
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - page: string (default: 1)
 * - limit: string (default: 10, max: 100)
 *
 * Backend behavior:
 * - Returns notifications for current user
 * - Results ordered by createdAt DESC (newest first)
 * - Auto-filters by user permissions
 *
 * @param filters - Optional query filters
 * @returns PaginatedResponse<Notification> with notifications and pagination meta
 * @throws ApiError on 401 (not authenticated)
 */
export const getAll = (
  filters?: NotificationQueryFilters
): Promise<PaginatedResponse<Notification>> => {
  return apiClient.get<PaginatedResponse<Notification>>({
    url: NotificationApiEndpoints.Base,
    params: filters,
  });
};

/**
 * Get unread notification count
 * GET /notifications/unread/count
 *
 * Returns count of unread notifications for current user
 * Used for badge/counter in UI
 *
 * @returns { count: number }
 * @throws ApiError on 401 (not authenticated)
 */
export const getUnreadCount = (): Promise<{ count: number }> => {
  return apiClient.get<{ count: number }>({
    url: NotificationApiEndpoints.UnreadCount,
  });
};

/**
 * Mark notification as read
 * PATCH /notifications/:id/read
 *
 * Marks a single notification as read
 * Sets isRead = true and readAt = current timestamp
 *
 * @param id - Notification UUID
 * @returns Updated Notification
 * @throws ApiError on 401, 403 (not owner), 404 (not found)
 */
export const markAsRead = (id: string): Promise<Notification> => {
  return apiClient.patch<Notification>({
    url: `/notifications/${id}/read`,
  });
};

/**
 * Mark all notifications as read
 * PATCH /notifications/read-all
 *
 * Marks all unread notifications as read for current user
 * Bulk operation for convenience
 *
 * @returns void
 * @throws ApiError on 401 (not authenticated)
 */
export const markAllAsRead = (): Promise<void> => {
  return apiClient.patch<void>({
    url: NotificationApiEndpoints.MarkAllAsRead,
  });
};

/**
 * Get notification settings for all types
 * GET /notifications/settings
 *
 * Returns all notification settings for current user
 *
 * @returns NotificationSettings[]
 * @throws ApiError on 401 (not authenticated)
 */
export const getSettings = (): Promise<NotificationSettings[]> => {
  return apiClient.get<NotificationSettings[]>({
    url: NotificationApiEndpoints.Settings,
  });
};

/**
 * Get notification setting for specific type
 * GET /notifications/settings/:notificationType
 *
 * @param notificationType - Notification type
 * @returns NotificationSettings
 * @throws ApiError on 401, 404 (not found)
 */
export const getSettingByType = (notificationType: string): Promise<NotificationSettings> => {
  return apiClient.get<NotificationSettings>({
    url: `/notifications/settings/${notificationType}`,
  });
};

/**
 * Create or update notification setting
 * POST /notifications/settings
 *
 * Backend validation:
 * - notificationType: Required, string
 * - isEnabled: Optional, boolean
 * - minAmount: Optional, number
 * - selectedBranches: Optional, string[] (array of branch IDs)
 * - displayMethod: Optional, DisplayMethod enum (POPUP | TOAST | EMAIL | SMS)
 *
 * @param data - UpdateNotificationSettingsInput
 * @returns Updated/created NotificationSettings
 * @throws ApiError on 400 (validation), 401
 */
export const updateSettings = (
  data: UpdateNotificationSettingsInput
): Promise<NotificationSettings> => {
  return apiClient.post<NotificationSettings>({
    url: NotificationApiEndpoints.Settings,
    data,
  });
};

/**
 * Delete notification setting
 * DELETE /notifications/settings/:notificationType
 *
 * @param notificationType - Notification type to delete
 * @returns void
 * @throws ApiError on 401, 404
 */
export const deleteSetting = (notificationType: string): Promise<void> => {
  return apiClient.delete<void>({
    url: `/notifications/settings/${notificationType}`,
  });
};

/**
 * Get enabled notification types
 * GET /notifications/settings/enabled/types
 *
 * @returns Object with enabledTypes array
 * @throws ApiError on 401
 */
export const getEnabledTypes = (): Promise<{ enabledTypes: string[] }> => {
  return apiClient.get<{ enabledTypes: string[] }>({
    url: '/notifications/settings/enabled/types',
  });
};

/**
 * Get unread notifications only
 * GET /notifications/unread
 *
 * @returns Notification[] - Array of unread notifications
 * @throws ApiError on 401
 */
export const getUnread = (): Promise<Notification[]> => {
  return apiClient.get<Notification[]>({
    url: '/notifications/unread',
  });
};

// ============================================
// EXPORTS
// ============================================

const notificationService = {
  getAll,
  getUnreadCount,
  getUnread,
  markAsRead,
  markAllAsRead,
  getSettings,
  getSettingByType,
  updateSettings,
  deleteSetting,
  getEnabledTypes,
};

export default notificationService;
