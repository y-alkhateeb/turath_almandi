/**
 * App Component
 * Main application component with routing and real-time synchronization
 *
 * Features:
 * - Renders application routes
 * - Initializes WebSocket connection when authenticated
 * - Sets up all real-time listeners (notifications, transactions, debts)
 * - Handles connection state globally
 * - Provides real-time sync across all features
 */

import { useRoutes } from 'react-router-dom';
import { routes } from '@/routes';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

function App() {
  // Initialize real-time synchronization
  // This hook automatically:
  // - Connects WebSocket when user is authenticated
  // - Sets up all real-time listeners:
  //   * Notifications (toast, sound, badge)
  //   * Transactions (cross-branch updates)
  //   * Debts (payment alerts, overdue notifications)
  // - Handles connection errors with auto-retry
  // - Invalidates queries for real-time data updates
  // - Disconnects on unmount or logout
  const { connectionState, isConnected } = useRealtimeSync();

  // Log connection state changes in development
  if (import.meta.env.DEV) {
    console.log('[App] Realtime sync state:', connectionState, { isConnected });
  }

  return useRoutes(routes);
}

export default App;
