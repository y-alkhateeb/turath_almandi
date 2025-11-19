/**
 * Notifications Page - Container Component
 * Main page for viewing and managing notifications
 *
 * Architecture:
 * - Business logic in hooks (useNotifications, useMarkAsRead, useMarkAllAsRead)
 * - Presentational component (NotificationList)
 * - This page only orchestrates components (container pattern)
 *
 * Features:
 * - List all notifications with filter tabs (All, Unread)
 * - Auto-refresh every 30 seconds (built into hook)
 * - Real-time updates via WebSocket
 * - Mark notification as read on click
 * - Mark all as read button
 * - Navigate to settings page
 * - Loading states with skeleton
 * - Error and empty states
 * - RTL support
 * - Strict typing
 */

import { useState, useCallback, useEffect } from 'react';
import { Settings, Bell, CheckCheck } from 'lucide-react';
import { useRouter } from '@/routes/hooks';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from '@/hooks/queries/useNotifications';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { NotificationList } from '@/components/notifications/NotificationList';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { ListSkeleton } from '@/components/skeletons/ListSkeleton';

// ============================================
// TYPES
// ============================================

type FilterTab = 'all' | 'unread';

// ============================================
// PAGE COMPONENT
// ============================================

export default function NotificationsPage() {
  const router = useRouter();

  // ============================================
  // STATE
  // ============================================

  /**
   * Filter tab state (All, Unread)
   */
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  // ============================================
  // DATA FETCHING
  // ============================================

  /**
   * Fetch notifications based on active tab
   * Auto-refreshes every 30 seconds
   */
  const {
    data: notificationsData,
    isLoading,
    error,
    refetch,
  } = useNotifications(activeTab === 'unread' ? { isRead: false } : undefined);

  const notifications = notificationsData?.data || [];
  const total = notificationsData?.pagination?.total || 0;

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Mark single notification as read mutation
   */
  const markAsRead = useMarkAsRead();

  /**
   * Mark all notifications as read mutation
   */
  const markAllAsRead = useMarkAllAsRead();

  // ============================================
  // REAL-TIME UPDATES
  // ============================================

  /**
   * Subscribe to real-time notification events via WebSocket
   * Automatically invalidates queries and shows toast
   */
  useRealtimeNotifications();

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handle mark notification as read
   * Called when user clicks on a notification
   */
  const handleMarkAsRead = useCallback(
    async (id: string) => {
      try {
        await markAsRead.mutateAsync(id);
        // Success toast shown by mutation (silent operation)
      } catch (_error) {
        // Error toast shown by global API interceptor
      }
    },
    [markAsRead]
  );

  /**
   * Handle mark all as read
   * Marks all unread notifications as read
   */
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead.mutateAsync();
      // Success toast shown by mutation
    } catch (_error) {
      // Error toast shown by global API interceptor
    }
  }, [markAllAsRead]);

  /**
   * Handle navigate to settings
   */
  const handleNavigateToSettings = useCallback(() => {
    router.push('/notifications/settings');
  }, [router]);

  /**
   * Handle retry on error
   */
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  /**
   * Handle tab change
   */
  const handleTabChange = useCallback((tab: FilterTab) => {
    setActiveTab(tab);
  }, []);

  // ============================================
  // EFFECTS
  // ============================================

  /**
   * Refetch when tab changes
   */
  useEffect(() => {
    refetch();
  }, [activeTab, refetch]);

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    return (
      <div className="space-y-6" dir="rtl">
        {/* Page Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-9 w-48 bg-[var(--bg-tertiary)] rounded animate-pulse" />
            <div className="h-5 w-64 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-[var(--bg-tertiary)] rounded animate-pulse" />
            <div className="h-10 w-10 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          <div className="h-10 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse" />
        </div>

        {/* List Skeleton */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
          <ListSkeleton items={5} variant="default" />
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between" dir="rtl">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">الإشعارات</h1>
            <p className="text-[var(--text-secondary)] mt-1">عرض وإدارة إشعاراتك</p>
          </div>
          <button
            onClick={handleNavigateToSettings}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <Settings className="w-4 h-4" />
            الإعدادات
          </button>
        </div>
        <ErrorState error={error} onRetry={handleRetry} />
      </div>
    );
  }

  // ============================================
  // EMPTY STATE
  // ============================================

  if (notifications.length === 0) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between" dir="rtl">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">الإشعارات</h1>
            <p className="text-[var(--text-secondary)] mt-1">عرض وإدارة إشعاراتك</p>
          </div>
          <button
            onClick={handleNavigateToSettings}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <Settings className="w-4 h-4" />
            الإعدادات
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2" dir="rtl">
          <button
            onClick={() => handleTabChange('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => handleTabChange('unread')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'unread'
                ? 'bg-primary-600 text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            غير مقروء
          </button>
        </div>

        {/* Empty State */}
        <EmptyState
          icon={<Bell className="w-8 h-8 text-primary-600" />}
          title={activeTab === 'unread' ? 'لا توجد إشعارات غير مقروءة' : 'لا توجد إشعارات'}
          description={
            activeTab === 'unread' ? 'جميع الإشعارات مقروءة. عمل رائع!' : 'لم تتلقَ أي إشعارات بعد.'
          }
        />
      </div>
    );
  }

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const hasUnread = unreadCount > 0;

  // ============================================
  // MAIN CONTENT
  // ============================================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between" dir="rtl">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">الإشعارات</h1>
          <p className="text-[var(--text-secondary)] mt-1">عرض وإدارة إشعاراتك ({total} إشعار)</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mark All as Read Button */}
          {hasUnread && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCheck className="w-4 h-4" />
              تعليم الكل كمقروء
            </button>
          )}

          {/* Settings Button */}
          <button
            onClick={handleNavigateToSettings}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <Settings className="w-4 h-4" />
            الإعدادات
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2" dir="rtl">
        <button
          onClick={() => handleTabChange('all')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
          }`}
        >
          الكل
        </button>
        <button
          onClick={() => handleTabChange('unread')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'unread'
              ? 'bg-primary-600 text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
          }`}
        >
          غير مقروء
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden">
        <NotificationList
          notifications={notifications}
          isLoading={false}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
        />
      </div>

      {/* Auto-refresh indicator */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4" dir="rtl">
        <p className="text-sm text-blue-800">
          <strong>ملاحظة:</strong> يتم تحديث الإشعارات تلقائياً كل 30 ثانية وفي الوقت الفعلي عبر
          WebSocket.
        </p>
      </div>

      {/* Loading Overlay - Shown during mark all operation */}
      {markAllAsRead.isPending && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6 shadow-lg flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-[var(--text-primary)] font-medium">جاري وضع علامة مقروء...</span>
          </div>
        </div>
      )}
    </div>
  );
}
