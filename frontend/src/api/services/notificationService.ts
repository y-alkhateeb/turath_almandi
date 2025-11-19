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
 * - isRead: boolean (true = read, false = unread)
 * - type: string (notification type)
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - page: number (default: 1)
 * - limit: number (default: 50)
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
    url: NotificationApiEndpoints.GetUnreadCount,
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
 * Get notification settings
 * GET /notifications/settings
 *
 * Returns all notification settings for current user
 * Includes settings for all notification types
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
 * Update notification settings
 * PATCH /notifications/settings
 *
 * Updates notification settings for current user
 * Can update multiple settings at once
 *
 * Backend validation:
 * - notificationType: Required, string
 * - isEnabled: Optional, boolean
 * - minAmount: Optional, number >= 0
 * - selectedBranches: Optional, array of UUIDs
 * - displayMethod: Optional, TOAST | EMAIL | BOTH
 *
 * @param data - UpdateNotificationSettingsInput
 * @returns Updated NotificationSettings
 * @throws ApiError on 400 (validation), 401 (not authenticated)
 */
export const updateSettings = (
  data: UpdateNotificationSettingsInput
): Promise<NotificationSettings> => {
  return apiClient.patch<NotificationSettings>({
    url: NotificationApiEndpoints.Settings,
    data,
  });
};

// ============================================
// HELPER METHODS
// ============================================

/**
 * Get unread notifications only
 * GET /notifications?isRead=false
 *
 * Convenience method for fetching unread notifications
 *
 * @param filters - Optional additional filters
 * @returns PaginatedResponse<Notification>
 * @throws ApiError on 401
 */
export const getUnreadNotifications = (
  filters?: Omit<NotificationQueryFilters, 'isRead'>
): Promise<PaginatedResponse<Notification>> => {
  return getAll({
    ...filters,
    isRead: false,
  });
};

/**
 * Get read notifications only
 * GET /notifications?isRead=true
 *
 * Convenience method for fetching read notifications
 *
 * @param filters - Optional additional filters
 * @returns PaginatedResponse<Notification>
 * @throws ApiError on 401
 */
export const getReadNotifications = (
  filters?: Omit<NotificationQueryFilters, 'isRead'>
): Promise<PaginatedResponse<Notification>> => {
  return getAll({
    ...filters,
    isRead: true,
  });
};

// ============================================
// EXPORTS
// ============================================

/**
 * Notification service object with all methods
 * Use named exports or default object
 */
const notificationService = {
  getAll,
  getUnreadCount,
  getUnreadNotifications,
  getReadNotifications,
  markAsRead,
  markAllAsRead,
  getSettings,
  updateSettings,
};

export default notificationService;
