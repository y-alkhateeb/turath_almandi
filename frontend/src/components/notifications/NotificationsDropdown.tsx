/**
 * NotificationsDropdown Component
 * Dropdown showing last 5 notifications with "View More" button
 *
 * Features:
 * - Shows last 5 notifications
 * - Severity-based styling
 * - Mark as read on click
 * - "View More" button to go to full notifications page
 * - Empty state
 * - Loading state
 * - RTL support
 */

import { useNavigate } from 'react-router-dom';
import { Bell, ChevronLeft, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useNotifications, useMarkAsRead } from '@/hooks/queries/useNotifications';
import { formatRelativeTime } from '@/utils/format';
import { NotificationSeverity } from '@/types/enum';
import type { Notification } from '#/entity';

// ============================================
// TYPES
// ============================================

export interface NotificationsDropdownProps {
  onClose: () => void;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get severity icon and color
 */
const getSeverityIcon = (severity: NotificationSeverity) => {
  switch (severity) {
    case NotificationSeverity.INFO:
      return { Icon: Info, color: 'text-blue-500' };
    case NotificationSeverity.WARNING:
      return { Icon: AlertTriangle, color: 'text-yellow-500' };
    case NotificationSeverity.ERROR:
    case NotificationSeverity.CRITICAL:
      return { Icon: AlertCircle, color: 'text-red-500' };
    default:
      return { Icon: Info, color: 'text-gray-500' };
  }
};

// ============================================
// COMPONENT
// ============================================

export function NotificationsDropdown({ onClose }: NotificationsDropdownProps) {
  const navigate = useNavigate();
  const { data, isLoading } = useNotifications({ limit: 5 });
  const markAsRead = useMarkAsRead();

  const notifications = data?.data || [];

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      try {
        await markAsRead.mutateAsync(notification.id);
      } catch (error) {
        // Error is handled by mutation
      }
    }
    onClose();
  };

  const handleViewAll = () => {
    navigate('/notifications');
    onClose();
  };

  return (
    <div className="absolute left-0 mt-2 w-96 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl z-50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]" dir="rtl">
          الإشعارات
        </h3>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 bg-[var(--bg-tertiary)] rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[var(--bg-tertiary)] rounded w-3/4" />
                  <div className="h-3 bg-[var(--bg-tertiary)] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center" dir="rtl">
            <Bell className="w-12 h-12 mx-auto mb-3 text-[var(--text-tertiary)]" />
            <p className="text-sm text-[var(--text-secondary)]">لا توجد إشعارات جديدة</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-color)]">
            {notifications.map((notification) => {
              const { Icon, color } = getSeverityIcon(notification.severity);

              return (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    w-full px-4 py-3 text-right hover:bg-[var(--bg-tertiary)] transition-colors
                    ${!notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
                  `}
                  dir="rtl"
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className={`flex-shrink-0 ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <p
                        className={`text-sm font-medium mb-1 ${
                          notification.isRead
                            ? 'text-[var(--text-secondary)]'
                            : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {notification.title}
                      </p>

                      {/* Message */}
                      <p className="text-xs text-[var(--text-tertiary)] line-clamp-2 mb-1">
                        {notification.message}
                      </p>

                      {/* Time */}
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <div className="flex-shrink-0">
                        <span className="inline-block w-2 h-2 bg-primary-500 rounded-full" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer - View All Button */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)]">
          <button
            onClick={handleViewAll}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            dir="rtl"
          >
            <span>مشاهدة جميع الإشعارات</span>
            <ChevronLeft className="w-4 h-4 rotate-180" />
          </button>
        </div>
      )}
    </div>
  );
}

export default NotificationsDropdown;
