/**
 * NotificationBadge - Presentational Component
 * Bell icon with unread notification badge
 *
 * Features:
 * - Bell icon with badge showing unread count
 * - Animate when new notification arrives
 * - Click to open notification panel
 * - Hide badge if count = 0
 * - RTL support
 * - No business logic
 */

import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';

// ============================================
// TYPES
// ============================================

export interface NotificationBadgeProps {
  unreadCount: number;
  onClick: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function NotificationBadge({ unreadCount, onClick }: NotificationBadgeProps) {
  const [prevCount, setPrevCount] = useState(unreadCount);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Detect when new notification arrives (count increases)
  useEffect(() => {
    if (unreadCount > prevCount) {
      // Trigger animation
      setShouldAnimate(true);

      // Reset animation after it completes
      const timer = setTimeout(() => {
        setShouldAnimate(false);
      }, 1000);

      return () => clearTimeout(timer);
    }

    setPrevCount(unreadCount);
  }, [unreadCount, prevCount]);

  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-lg hover:bg-[var(--bg-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
      aria-label={`الإشعارات${unreadCount > 0 ? ` - ${unreadCount} غير مقروء` : ''}`}
    >
      {/* Bell Icon */}
      <Bell
        className={`w-6 h-6 text-[var(--text-primary)] ${shouldAnimate ? 'animate-bell-ring' : ''}`}
      />

      {/* Unread Badge */}
      {unreadCount > 0 && (
        <span
          className={`
            absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center
            text-xs font-bold text-white bg-red-500 rounded-full
            ${shouldAnimate ? 'animate-badge-bounce' : ''}
          `}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      {/* Pulse Ring for new notifications */}
      {shouldAnimate && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full animate-ping opacity-75" />
      )}

      {/* CSS for custom animations */}
      <style>{`
        @keyframes bell-ring {
          0%, 100% {
            transform: rotate(0deg);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: rotate(-10deg);
          }
          20%, 40%, 60%, 80% {
            transform: rotate(10deg);
          }
        }

        @keyframes badge-bounce {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
        }

        .animate-bell-ring {
          animation: bell-ring 1s ease-in-out;
        }

        .animate-badge-bounce {
          animation: badge-bounce 0.5s ease-in-out;
        }
      `}</style>
    </button>
  );
}

export default NotificationBadge;
