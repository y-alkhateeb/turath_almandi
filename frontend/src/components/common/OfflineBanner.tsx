/**
 * OfflineBanner Component
 * Displays banner when user is offline with retry information
 *
 * Features:
 * - Shows "أنت غير متصل بالإنترنت" message
 * - RTL support for Arabic
 * - Animated slide-in/slide-out
 * - WiFi icon indicator
 * - Auto-hides when back online
 * - Accessibility support
 * - Sticky positioning at top
 *
 * @example
 * ```tsx
 * import { OfflineBanner } from '@/components/common/OfflineBanner';
 *
 * function App() {
 *   return (
 *     <>
 *       <OfflineBanner />
 *       <MainContent />
 *     </>
 *   );
 * }
 * ```
 */

import { WifiOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

// ============================================
// TYPES
// ============================================

export interface OfflineBannerProps {
  /** Optional custom class name */
  className?: string;

  /** Optional custom message (defaults to Arabic) */
  message?: string;

  /** Show retry icon */
  showRetryIcon?: boolean;
}

// ============================================
// COMPONENT
// ============================================

/**
 * OfflineBanner Component
 * Shows when user is offline, hides when online
 *
 * @param props - OfflineBannerProps
 * @returns Offline banner or null if online
 */
export function OfflineBanner({
  className = '',
  message = 'أنت غير متصل بالإنترنت',
  showRetryIcon = true,
}: OfflineBannerProps) {
  const { isOnline, wasOffline } = useOnlineStatus();

  // Don't render anything if online (unless just came back online)
  if (isOnline && !wasOffline) {
    return null;
  }

  // Show "Back online" message briefly when reconnected
  if (isOnline && wasOffline) {
    return (
      <div
        className={`
          fixed top-0 left-0 right-0 z-50
          bg-green-600 text-white
          px-4 py-3
          shadow-lg
          animate-slide-down
          ${className}
        `}
        role="status"
        aria-live="polite"
        dir="rtl"
      >
        <div className="container mx-auto flex items-center justify-center gap-3">
          {/* Success Icon */}
          <RefreshCw className="w-5 h-5 animate-spin" aria-hidden="true" />

          {/* Message */}
          <p className="text-sm font-medium">تم استعادة الاتصال بالإنترنت</p>
        </div>
      </div>
    );
  }

  // Show offline banner
  return (
    <div
      className={`
        fixed top-0 left-0 right-0 z-50
        bg-red-600 text-white
        px-4 py-3
        shadow-lg
        animate-slide-down
        ${className}
      `}
      role="alert"
      aria-live="assertive"
      dir="rtl"
    >
      <div className="container mx-auto flex items-center justify-center gap-3">
        {/* Offline Icon */}
        <WifiOff className="w-5 h-5" aria-hidden="true" />

        {/* Message */}
        <p className="text-sm font-medium">{message}</p>

        {/* Retry Icon (pulsing animation) */}
        {showRetryIcon && (
          <RefreshCw
            className="w-4 h-4 ml-2 animate-pulse"
            aria-hidden="true"
            title="في انتظار الاتصال..."
          />
        )}
      </div>
    </div>
  );
}

/**
 * BackOnlineBanner Component
 * Shows briefly when user comes back online
 * (Usually used automatically by OfflineBanner)
 */
export function BackOnlineBanner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`
        fixed top-0 left-0 right-0 z-50
        bg-green-600 text-white
        px-4 py-3
        shadow-lg
        animate-slide-down
        ${className}
      `}
      role="status"
      aria-live="polite"
      dir="rtl"
    >
      <div className="container mx-auto flex items-center justify-center gap-3">
        <RefreshCw className="w-5 h-5" aria-hidden="true" />
        <p className="text-sm font-medium">تم استعادة الاتصال بالإنترنت</p>
      </div>
    </div>
  );
}

export default OfflineBanner;
