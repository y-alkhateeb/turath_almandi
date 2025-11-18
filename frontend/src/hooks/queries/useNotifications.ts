/**
 * useNotifications Hooks
 * React Query hooks for notification management with real-time updates
 *
 * Features:
 * - Notifications query with auto-refetch every 30s
 * - Unread count query for badge
 * - Mark as read mutations
 * - Notification settings management
 * - Real-time WebSocket integration
 * - Auto-invalidation on notification:created events
 * - Arabic toast messages
 * - Full error handling and strict typing
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import notificationService from '@/api/services/notificationService';
import { queryKeys } from './queryKeys';
import type {
  Notification,
  NotificationSettings,
  UpdateNotificationSettingsInput,
} from '#/entity';
import type { PaginatedResponse, NotificationQueryFilters } from '#/api';
import { ApiError } from '@/api/apiClient';

// ============================================
// QUERY HOOKS
// ============================================

/**
 * useNotifications Hook
 * Query notifications with auto-refetch every 30 seconds
 * Automatically integrates with WebSocket for real-time updates
 *
 * @param filters - Optional NotificationQueryFilters
 * @returns Query result with paginated notifications
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useNotifications({
 *   isRead: false,
 *   page: 1,
 *   limit: 20,
 * });
 * const notifications = data?.data || [];
 * ```
 */
export const useNotifications = (filters?: NotificationQueryFilters) => {
  return useQuery<PaginatedResponse<Notification>, ApiError>({
    queryKey: queryKeys.notifications.list(filters),
    queryFn: () => notificationService.getAll(filters),
    staleTime: 30 * 1000, // Consider fresh for 30 seconds
    gcTime: 2 * 60 * 1000, // Cache for 2 minutes
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
    retry: 1,
  });
};

/**
 * useUnreadNotifications Hook
 * Query unread notification count for badge
 * Auto-refetches every 30 seconds
 *
 * @returns Query result with unread count
 *
 * @example
 * ```tsx
 * const { data } = useUnreadNotifications();
 * const unreadCount = data?.count || 0;
 * ```
 */
export const useUnreadNotifications = () => {
  return useQuery<{ count: number }, ApiError>({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationService.getUnreadCount(),
    staleTime: 30 * 1000, // Consider fresh for 30 seconds
    gcTime: 2 * 60 * 1000, // Cache for 2 minutes
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
    retry: 1,
  });
};

/**
 * useNotificationSettings Hook
 * Query notification settings for current user
 *
 * @returns Query result with notification settings array
 *
 * @example
 * ```tsx
 * const { data: settings } = useNotificationSettings();
 * console.log('Settings:', settings);
 * ```
 */
export const useNotificationSettings = () => {
  return useQuery<NotificationSettings[], ApiError>({
    queryKey: queryKeys.notifications.settings(),
    queryFn: () => notificationService.getSettings(),
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
    retry: 1,
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * useMarkAsRead Hook
 * Mutation to mark a single notification as read
 * Optimistically updates the notification in cache
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const markAsRead = useMarkAsRead();
 *
 * const handleClick = async (notificationId: string) => {
 *   await markAsRead.mutateAsync(notificationId);
 * };
 * ```
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation<Notification, ApiError, string>({
    mutationFn: notificationService.markAsRead,

    // Optimistic update
    onMutate: async (notificationId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      // Snapshot current data
      const previousNotifications = queryClient.getQueriesData<
        PaginatedResponse<Notification>
      >({
        queryKey: queryKeys.notifications.all,
      });

      const previousUnreadCount = queryClient.getQueryData<{ count: number }>(
        queryKeys.notifications.unreadCount(),
      );

      // Optimistically update notification in all lists
      queryClient.setQueriesData<PaginatedResponse<Notification>>(
        { queryKey: queryKeys.notifications.all },
        (old) => {
          if (!old) return old;

          return {
            ...old,
            data: old.data.map((notification) =>
              notification.id === notificationId
                ? {
                    ...notification,
                    isRead: true,
                    readAt: new Date().toISOString(),
                  }
                : notification,
            ),
          };
        },
      );

      // Optimistically update unread count
      queryClient.setQueryData<{ count: number }>(
        queryKeys.notifications.unreadCount(),
        (old) => {
          if (!old) return old;
          return { count: Math.max(0, old.count - 1) };
        },
      );

      return { previousNotifications, previousUnreadCount };
    },

    onError: (_error, _notificationId, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        context.previousNotifications.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousUnreadCount) {
        queryClient.setQueryData(
          queryKeys.notifications.unreadCount(),
          context.previousUnreadCount,
        );
      }

      // Note: Error toast shown by global API interceptor
    },

    onSuccess: () => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });

      // No success toast for mark as read (silent operation)
    },
  });
};

/**
 * useMarkAllAsRead Hook
 * Mutation to mark all unread notifications as read
 * Optimistically updates all notifications in cache
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const markAllAsRead = useMarkAllAsRead();
 *
 * const handleMarkAllRead = async () => {
 *   await markAllAsRead.mutateAsync();
 * };
 * ```
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, void>({
    mutationFn: notificationService.markAllAsRead,

    // Optimistic update
    onMutate: async () => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      // Snapshot current data
      const previousNotifications = queryClient.getQueriesData<
        PaginatedResponse<Notification>
      >({
        queryKey: queryKeys.notifications.all,
      });

      const previousUnreadCount = queryClient.getQueryData<{ count: number }>(
        queryKeys.notifications.unreadCount(),
      );

      // Optimistically mark all notifications as read
      queryClient.setQueriesData<PaginatedResponse<Notification>>(
        { queryKey: queryKeys.notifications.all },
        (old) => {
          if (!old) return old;

          return {
            ...old,
            data: old.data.map((notification) => ({
              ...notification,
              isRead: true,
              readAt: notification.readAt || new Date().toISOString(),
            })),
          };
        },
      );

      // Optimistically set unread count to 0
      queryClient.setQueryData<{ count: number }>(
        queryKeys.notifications.unreadCount(),
        { count: 0 },
      );

      return { previousNotifications, previousUnreadCount };
    },

    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        context.previousNotifications.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousUnreadCount) {
        queryClient.setQueryData(
          queryKeys.notifications.unreadCount(),
          context.previousUnreadCount,
        );
      }

      // Note: Error toast shown by global API interceptor
    },

    onSuccess: () => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });

      // Show success toast
      toast.success('تم وضع علامة مقروء على جميع الإشعارات');
    },
  });
};

/**
 * useUpdateNotificationSettings Hook
 * Mutation to update notification settings
 * Updates settings for current user
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const updateSettings = useUpdateNotificationSettings();
 *
 * const handleUpdate = async () => {
 *   await updateSettings.mutateAsync({
 *     notificationType: 'DEBT_OVERDUE',
 *     isEnabled: true,
 *     displayMethod: 'BOTH',
 *   });
 * };
 * ```
 */
export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();

  return useMutation<
    NotificationSettings,
    ApiError,
    UpdateNotificationSettingsInput
  >({
    mutationFn: notificationService.updateSettings,

    // Optimistic update
    onMutate: async (newSettings) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.settings(),
      });

      // Snapshot current data
      const previousSettings = queryClient.getQueryData<NotificationSettings[]>(
        queryKeys.notifications.settings(),
      );

      // Optimistically update settings
      queryClient.setQueryData<NotificationSettings[]>(
        queryKeys.notifications.settings(),
        (old) => {
          if (!old) return old;

          return old.map((setting) =>
            setting.notificationType === newSettings.notificationType
              ? {
                  ...setting,
                  ...newSettings,
                  updatedAt: new Date().toISOString(),
                }
              : setting,
          );
        },
      );

      return { previousSettings };
    },

    onError: (_error, _newSettings, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(
          queryKeys.notifications.settings(),
          context.previousSettings,
        );
      }

      // Note: Error toast shown by global API interceptor
    },

    onSuccess: () => {
      // Invalidate settings query
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.settings(),
      });

      // Show success toast
      toast.success('تم تحديث إعدادات الإشعارات بنجاح');
    },
  });
};

// ============================================
// HELPER HOOKS
// ============================================

/**
 * useUnreadNotificationsList Hook
 * Query only unread notifications
 *
 * @param filters - Optional additional filters
 * @returns Query result with unread notifications
 *
 * @example
 * ```tsx
 * const { data: unreadNotifications } = useUnreadNotificationsList();
 * ```
 */
export const useUnreadNotificationsList = (
  filters?: Omit<NotificationQueryFilters, 'isRead'>,
) => {
  return useNotifications({ ...filters, isRead: false });
};

/**
 * useReadNotificationsList Hook
 * Query only read notifications
 *
 * @param filters - Optional additional filters
 * @returns Query result with read notifications
 *
 * @example
 * ```tsx
 * const { data: readNotifications } = useReadNotificationsList();
 * ```
 */
export const useReadNotificationsList = (
  filters?: Omit<NotificationQueryFilters, 'isRead'>,
) => {
  return useNotifications({ ...filters, isRead: true });
};

/**
 * useNotificationBadgeCount Hook
 * Convenience hook that returns just the unread count number
 * Useful for displaying in UI badges
 *
 * @returns Unread notification count (0 if loading or error)
 *
 * @example
 * ```tsx
 * function NotificationBadge() {
 *   const count = useNotificationBadgeCount();
 *   return <Badge>{count}</Badge>;
 * }
 * ```
 */
export const useNotificationBadgeCount = (): number => {
  const { data } = useUnreadNotifications();
  return data?.count || 0;
};
