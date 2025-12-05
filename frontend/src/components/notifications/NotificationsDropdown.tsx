/**
 * Notifications Dropdown
 * Modern dropdown with shadcn/ui styling
 */

import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNotifications, useMarkNotificationAsRead, useMarkAllAsRead, type Notification } from '@/hooks/queries/useNotifications';
import { formatRelativeTime } from '@/utils/format';

interface NotificationsDropdownProps {
  onClose: () => void;
}

export function NotificationsDropdown({ onClose }: NotificationsDropdownProps) {
  const { data: notifications = [], isLoading } = useNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="absolute left-0 mt-2 w-80 md:w-96 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in-0 zoom-in-95">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm text-foreground">الإشعارات</span>
          {unreadCount > 0 && (
            <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-8 px-2 text-xs"
              title="تحديد الكل كمقروء"
            >
              <CheckCheck className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="py-8 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">جاري التحميل...</p>
          </div>
        ) : notifications && notifications.length > 0 ? (
          <ul className="divide-y divide-border">
            {notifications.map((notification: any) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </ul>
        ) : (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">لا توجد إشعارات جديدة</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications && notifications.length > 0 && (
        <div className="px-4 py-2 bg-muted/30 border-t border-border">
          <Button
            variant="ghost"
            className="w-full text-sm text-primary hover:text-primary/80 font-medium"
            onClick={() => {
              onClose();
              // Navigate to notifications page
              window.location.href = '/notifications';
            }}
          >
            عرض كل الإشعارات
          </Button>
        </div>
      )}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Check className="h-4 w-4 text-success" />;
      case 'warning':
        return <Bell className="h-4 w-4 text-warning-500" />;
      case 'error':
        return <X className="h-4 w-4 text-destructive" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  const timeAgo = formatRelativeTime(notification.createdAt);

  return (
    <li
      className={cn(
        'px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer',
        !notification.isRead && 'bg-primary/5'
      )}
      onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
    >
      <div className="flex gap-3">
        <div className="shrink-0 mt-0.5">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              notification.isRead ? 'bg-muted' : 'bg-primary/10'
            )}
          >
            {getTypeIcon(notification.type)}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                'text-sm truncate',
                notification.isRead ? 'text-muted-foreground' : 'text-foreground font-medium'
              )}
            >
              {notification.title}
            </p>
            {!notification.isRead && (
              <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">{timeAgo}</p>
        </div>
      </div>
    </li>
  );
}
