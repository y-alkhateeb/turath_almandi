/**
 * NotificationList - Presentational Component
 * List of notification cards with unread indicators and actions
 *
 * Features:
 * - Notification cards with severity-based icons and colors
 * - Unread badge/styling
 * - Click to mark as read
 * - Mark all as read button
 * - Link to related entity if relatedId exists
 * - Relative time display (منذ 5 دقائق)
 * - Empty state
 * - Loading skeleton
 * - RTL support
 * - No business logic
 */

import { Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { formatRelativeTime } from '@/utils/format';
import { NotificationSeverity } from '@/types/enum';
import type { Notification } from '#/entity';

// ============================================
// TYPES
// ============================================

export interface NotificationListProps {
  notifications: Notification[];
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get severity icon and color classes
 */
const getSeverityStyle = (
  severity: NotificationSeverity
): { icon: React.ComponentType<{ className?: string }>; colorClass: string; bgClass: string } => {
  switch (severity) {
    case NotificationSeverity.INFO:
      return {
        icon: Info,
        colorClass: 'text-blue-600',
        bgClass: 'bg-blue-50 border-blue-200',
      };
    case NotificationSeverity.WARNING:
      return {
        icon: AlertTriangle,
        colorClass: 'text-yellow-600',
        bgClass: 'bg-yellow-50 border-yellow-200',
      };
    case NotificationSeverity.ERROR:
      return {
        icon: AlertCircle,
        colorClass: 'text-red-600',
        bgClass: 'bg-red-50 border-red-200',
      };
    case NotificationSeverity.CRITICAL:
      return {
        icon: AlertCircle,
        colorClass: 'text-red-800',
        bgClass: 'bg-red-100 border-red-300',
      };
    default:
      return {
        icon: Info,
        colorClass: 'text-gray-600',
        bgClass: 'bg-gray-50 border-gray-200',
      };
  }
};

/**
 * Get link path for related entity
 */
const getRelatedEntityPath = (
  relatedType: string | null,
  relatedId: string | null
): string | null => {
  if (!relatedType || !relatedId) return null;

  const pathMap: Record<string, string> = {
    transaction: `/transactions/${relatedId}`,
    debt: `/debts/${relatedId}`,
    inventory: `/inventory/${relatedId}`,
    branch: `/branches/${relatedId}`,
  };

  return pathMap[relatedType.toLowerCase()] || null;
};

// ============================================
// LOADING SKELETON
// ============================================

function NotificationCardSkeleton() {
  return (
    <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)]" />
        <div className="flex-1">
          <div className="h-5 w-3/4 bg-[var(--bg-tertiary)] rounded mb-2" />
          <div className="h-4 w-full bg-[var(--bg-tertiary)] rounded mb-1" />
          <div className="h-3 w-24 bg-[var(--bg-tertiary)] rounded" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPONENT
// ============================================

export function NotificationList({
  notifications,
  isLoading,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationListProps) {
  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3" dir="rtl">
        <NotificationCardSkeleton />
        <NotificationCardSkeleton />
        <NotificationCardSkeleton />
      </div>
    );
  }

  // Empty state
  if (notifications.length === 0) {
    return (
      <div className="text-center py-12" dir="rtl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">لا توجد إشعارات</h3>
        <p className="text-sm text-[var(--text-secondary)]">
          جميع الإشعارات تم قراءتها أو لا توجد إشعارات جديدة
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header with Mark All as Read button */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            {unreadCount} إشعار غير مقروء
          </span>
          <button
            onClick={onMarkAllAsRead}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            تعليم الكل كمقروء
          </button>
        </div>
      )}

      {/* Notification Cards */}
      <div className="space-y-3">
        {notifications.map((notification) => {
          const { icon: Icon, colorClass, bgClass } = getSeverityStyle(notification.severity);
          const relatedPath = getRelatedEntityPath(
            notification.relatedType,
            notification.relatedId
          );

          return (
            <div
              key={notification.id}
              onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
              className={`
                relative p-4 rounded-lg border transition-all cursor-pointer
                ${notification.isRead ? 'bg-[var(--bg-secondary)] border-[var(--border-color)] opacity-75' : `${bgClass} border-2`}
                ${!notification.isRead && 'hover:shadow-md'}
              `}
            >
              {/* Unread indicator badge */}
              {!notification.isRead && (
                <div className="absolute top-2 left-2">
                  <span className="inline-flex h-3 w-3 rounded-full bg-primary-500 animate-pulse" />
                </div>
              )}

              <div className="flex items-start gap-3">
                {/* Severity Icon */}
                <div className={`p-2 rounded-full ${bgClass}`}>
                  <Icon className={`w-6 h-6 ${colorClass}`} />
                </div>

                {/* Content */}
                <div className="flex-1">
                  {/* Title */}
                  <h4
                    className={`text-base font-semibold mb-1 ${
                      notification.isRead
                        ? 'text-[var(--text-secondary)]'
                        : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {notification.title}
                  </h4>

                  {/* Message */}
                  <p
                    className={`text-sm mb-2 ${
                      notification.isRead
                        ? 'text-[var(--text-tertiary)]'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {notification.message}
                  </p>

                  {/* Footer: Time and Link */}
                  <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
                    <span>{formatRelativeTime(notification.createdAt)}</span>

                    {relatedPath && (
                      <>
                        <span>•</span>
                        <a
                          href={relatedPath}
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary-600 hover:text-primary-700 font-medium hover:underline"
                        >
                          عرض التفاصيل
                        </a>
                      </>
                    )}

                    {notification.branch && (
                      <>
                        <span>•</span>
                        <span>{notification.branch.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default NotificationList;
