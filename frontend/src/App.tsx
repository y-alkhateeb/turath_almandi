/**
 * App Component
 * Main application component with routing and WebSocket initialization
 *
 * Features:
 * - Renders application routes
 * - Initializes WebSocket connection when authenticated
 * - Handles connection state globally
 */

import { useRoutes } from 'react-router-dom';
import { routes } from '@/routes';
import { useWebSocket } from '@/hooks/useWebSocket';

function App() {
  // Initialize WebSocket connection
  // This hook automatically:
  // - Connects when user is authenticated
  // - Passes access token from storage
  // - Handles connection errors with auto-retry
  // - Disconnects on unmount or logout
  // - Reconnects on auth state changes
  const { connectionState, isConnected } = useWebSocket();

  // Log connection state changes in development
  if (import.meta.env.DEV) {
    console.log('[App] WebSocket state:', connectionState);
  }

  return useRoutes(routes);
}

export default App;
