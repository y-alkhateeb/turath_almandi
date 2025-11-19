/**
 * useOnlineStatus Hook Usage Examples
 *
 * This file demonstrates various ways to use the useOnlineStatus hook
 * for offline detection and handling in your application.
 */

import { useOnlineStatus, useIsOnline } from './useOnlineStatus';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { Button } from '@/ui/button';

// ============================================
// EXAMPLE 1: Basic Usage with Banner
// ============================================

/**
 * Most common usage: Show offline banner
 */
function BasicExample() {
  return (
    <div>
      <OfflineBanner />
      <div className="p-8">
        <h1>My App</h1>
        <p>Content here...</p>
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 2: Custom Offline Message
// ============================================

/**
 * Show custom offline UI based on online status
 */
function CustomOfflineExample() {
  const { isOnline } = useOnlineStatus();

  if (!isOnline) {
    return (
      <div className="flex items-center justify-center min-h-screen" dir="rtl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">أنت غير متصل بالإنترنت</h1>
          <p className="text-gray-600 mb-6">يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى</p>
          <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>App Content (Online)</h1>
    </div>
  );
}

// ============================================
// EXAMPLE 3: Disable Actions When Offline
// ============================================

/**
 * Disable form submissions and buttons when offline
 */
function FormWithOfflineExample() {
  const { isOnline } = useOnlineStatus();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOnline) {
      alert('لا يمكن إرسال النموذج أثناء عدم الاتصال بالإنترنت');
      return;
    }

    // Submit form...
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <input
        type="text"
        placeholder="Name"
        className="border p-2 w-full mb-4"
        disabled={!isOnline}
      />

      <Button
        type="submit"
        disabled={!isOnline}
        className={!isOnline ? 'opacity-50 cursor-not-allowed' : ''}
      >
        {isOnline ? 'Submit' : 'Offline - Cannot Submit'}
      </Button>

      {!isOnline && <p className="text-sm text-red-600 mt-2">Form is disabled while offline</p>}
    </form>
  );
}

// ============================================
// EXAMPLE 4: Show "Back Online" Notification
// ============================================

/**
 * Detect when user comes back online
 */
function BackOnlineExample() {
  const { isOnline, wasOffline } = useOnlineStatus();

  return (
    <div className="p-4">
      {wasOffline && isOnline && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          ✅ You're back online! All data will be synced.
        </div>
      )}

      <div>
        <p>Current status: {isOnline ? '🟢 Online' : '🔴 Offline'}</p>
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 5: Conditional Rendering Based on Status
// ============================================

/**
 * Show different content based on online/offline state
 */
function ConditionalContentExample() {
  const isOnline = useIsOnline(); // Simple hook, returns just boolean

  return (
    <div className="p-4">
      {isOnline ? (
        <div>
          <h2>Live Data</h2>
          <p>This content requires internet connection</p>
          {/* Fetch and display live data */}
        </div>
      ) : (
        <div>
          <h2>Cached Data</h2>
          <p>Showing cached data while offline</p>
          {/* Show cached/offline data */}
        </div>
      )}
    </div>
  );
}

// ============================================
// EXAMPLE 6: API Call with Offline Check
// ============================================

/**
 * Check online status before making API calls
 */
function ApiCallExample() {
  const { isOnline } = useOnlineStatus();

  const fetchData = async () => {
    if (!isOnline) {
      console.error('Cannot fetch data while offline');
      return;
    }

    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      console.log('Data:', data);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  return (
    <div className="p-4">
      <Button onClick={fetchData} disabled={!isOnline}>
        Fetch Data
      </Button>

      {!isOnline && <p className="text-red-600 mt-2">Cannot fetch data while offline</p>}
    </div>
  );
}

// ============================================
// EXAMPLE 7: Show Network Status Indicator
// ============================================

/**
 * Show persistent network status indicator
 */
function NetworkStatusIndicator() {
  const { isOnline } = useOnlineStatus();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full shadow-lg
          ${isOnline ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
        `}
      >
        <span
          className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-200' : 'bg-red-200'} animate-pulse`}
        />
        <span className="text-sm font-medium">{isOnline ? 'Online' : 'Offline'}</span>
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 8: Retry Failed Actions When Online
// ============================================

/**
 * Queue actions and retry when back online
 */
function RetryQueueExample() {
  const { isOnline, wasOffline } = useOnlineStatus();

  const saveData = async () => {
    if (!isOnline) {
      // Queue for later (in real app, use localStorage or state)
      console.log('Queued for later');
      localStorage.setItem('pendingAction', JSON.stringify({ action: 'save', data: {} }));
      return;
    }

    // Save immediately if online
    await fetch('/api/save', { method: 'POST', body: JSON.stringify({}) });
  };

  // Retry queued actions when back online
  React.useEffect(() => {
    if (wasOffline && isOnline) {
      const pendingAction = localStorage.getItem('pendingAction');
      if (pendingAction) {
        console.log('Retrying queued action:', pendingAction);
        // Execute queued action
        localStorage.removeItem('pendingAction');
      }
    }
  }, [wasOffline, isOnline]);

  return (
    <div className="p-4">
      <Button onClick={saveData}>{isOnline ? 'Save Now' : 'Queue for Later'}</Button>
    </div>
  );
}

// ============================================
// EXAMPLE 9: Full App Integration
// ============================================

/**
 * Complete app with offline detection
 */
function FullAppExample() {
  const { isOnline, wasOffline } = useOnlineStatus();

  return (
    <div className="min-h-screen">
      {/* Offline Banner (shows at top when offline) */}
      <OfflineBanner />

      {/* Network Status Indicator (bottom-right corner) */}
      <NetworkStatusIndicator />

      {/* Main Content */}
      <div className="p-8">
        <h1>My Application</h1>

        {/* Show "back online" notification */}
        {wasOffline && isOnline && (
          <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
            <p className="text-green-800">✅ Connection restored! Data is being synced...</p>
          </div>
        )}

        {/* App content */}
        <div>
          <p>Status: {isOnline ? 'Connected' : 'Disconnected'}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// RECOMMENDED PATTERNS
// ============================================

/**
 * PATTERN 1: Global Banner (Most Common)
 *
 * Add OfflineBanner to your App.tsx:
 *
 * function App() {
 *   return (
 *     <>
 *       <OfflineBanner />
 *       <YourAppRoutes />
 *     </>
 *   );
 * }
 */

/**
 * PATTERN 2: Disable Forms When Offline
 *
 * const { isOnline } = useOnlineStatus();
 *
 * <form onSubmit={handleSubmit}>
 *   <input disabled={!isOnline} />
 *   <button disabled={!isOnline}>Submit</button>
 * </form>
 */

/**
 * PATTERN 3: Show Cached Data When Offline
 *
 * const isOnline = useIsOnline();
 *
 * const { data } = useQuery({
 *   queryKey: ['data'],
 *   queryFn: fetchData,
 *   enabled: isOnline,  // Only fetch when online
 *   staleTime: Infinity,  // Use cached data when offline
 * });
 */

/**
 * PATTERN 4: Auto-Retry on Reconnect
 *
 * React Query automatically handles this!
 * The useOnlineStatus hook calls:
 * - queryClient.invalidateQueries() - Retries all failed queries
 * - queryClient.resumePausedMutations() - Retries paused mutations
 */

// Export all examples
export {
  BasicExample,
  CustomOfflineExample,
  FormWithOfflineExample,
  BackOnlineExample,
  ConditionalContentExample,
  ApiCallExample,
  NetworkStatusIndicator,
  RetryQueueExample,
  FullAppExample,
};
