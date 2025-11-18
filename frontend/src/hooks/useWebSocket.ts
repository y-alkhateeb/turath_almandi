/**
 * WebSocket Hooks
 * Real-time connection management with typed events and React Query integration
 *
 * Features:
 * - Automatic connection/disconnection based on auth state
 * - Typed event system
 * - React Query cache invalidation on events
 * - Reconnection handling
 * - Connection state tracking
 * - Strict typing, no `any`
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { queryKeys } from './queries/queryKeys';
import GLOBAL_CONFIG from '@/global-config';

// ============================================
// TYPES
// ============================================

/**
 * WebSocket event types
 * Matches backend event emissions
 */
export type WebSocketEventType =
  | 'transaction:created'
  | 'transaction:updated'
  | 'transaction:deleted'
  | 'debt:created'
  | 'debt:updated'
  | 'debt:paid'
  | 'notification:created'
  | 'inventory:updated'
  | 'inventory:created'
  | 'inventory:deleted'
  | 'user:updated'
  | 'branch:updated';

/**
 * Event payload types
 */
export interface WebSocketEventPayload {
  'transaction:created': { id: string; branchId: string; type: string };
  'transaction:updated': { id: string; branchId: string; type: string };
  'transaction:deleted': { id: string; branchId: string };
  'debt:created': { id: string; branchId: string; debtorName: string };
  'debt:updated': { id: string; branchId: string };
  'debt:paid': { id: string; branchId: string; amountPaid: number };
  'notification:created': { id: string; userId?: string; branchId?: string; type: string };
  'inventory:updated': { id: string; branchId: string; quantity: number };
  'inventory:created': { id: string; branchId: string; name: string };
  'inventory:deleted': { id: string; branchId: string };
  'user:updated': { id: string; username: string };
  'branch:updated': { id: string; name: string };
}

/**
 * WebSocket connection state
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Event handler function type
 */
export type EventHandler<T extends WebSocketEventType> = (
  payload: WebSocketEventPayload[T],
) => void;

// ============================================
// WEBSOCKET MANAGER (Singleton)
// ============================================

class WebSocketManager {
  private socket: WebSocket | null = null;
  private listeners: Map<WebSocketEventType, Set<EventHandler<WebSocketEventType>>> =
    new Map();
  private connectionState: ConnectionState = 'disconnected';
  private stateListeners: Set<(state: ConnectionState) => void> = new Set();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private token: string | null = null;

  /**
   * Connect to WebSocket server
   */
  connect(token: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected');
      return;
    }

    if (this.socket?.readyState === WebSocket.CONNECTING) {
      console.log('[WebSocket] Connection in progress');
      return;
    }

    this.token = token;
    this.setConnectionState('connecting');

    try {
      // Create WebSocket connection with auth token
      const wsUrl = `${GLOBAL_CONFIG.wsUrl}?token=${encodeURIComponent(token)}`;
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);

      console.log('[WebSocket] Connecting to', GLOBAL_CONFIG.wsUrl);
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      this.setConnectionState('error');
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      console.log('[WebSocket] Disconnecting');
      this.socket.onclose = null; // Prevent reconnect on manual disconnect
      this.socket.close();
      this.socket = null;
    }

    this.reconnectAttempts = 0;
    this.token = null;
    this.setConnectionState('disconnected');
  }

  /**
   * Subscribe to an event
   */
  on<T extends WebSocketEventType>(event: T, handler: EventHandler<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as EventHandler<WebSocketEventType>);
  }

  /**
   * Unsubscribe from an event
   */
  off<T extends WebSocketEventType>(event: T, handler: EventHandler<T>): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler as EventHandler<WebSocketEventType>);
    }
  }

  /**
   * Subscribe to connection state changes
   */
  onStateChange(listener: (state: ConnectionState) => void): () => void {
    this.stateListeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('[WebSocket] Connected');
    this.reconnectAttempts = 0;
    this.setConnectionState('connected');
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log('[WebSocket] Disconnected', event.code, event.reason);
    this.socket = null;
    this.setConnectionState('disconnected');

    // Attempt reconnection if we have a token (user is authenticated)
    if (this.token && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    console.error('[WebSocket] Error:', event);
    this.setConnectionState('error');
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      const { event: eventType, payload } = message;

      if (!eventType || !payload) {
        console.warn('[WebSocket] Invalid message format:', message);
        return;
      }

      // Emit event to all registered handlers
      const handlers = this.listeners.get(eventType as WebSocketEventType);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(payload);
          } catch (error) {
            console.error(`[WebSocket] Error in event handler for ${eventType}:`, error);
          }
        });
      }

      console.log(`[WebSocket] Event received: ${eventType}`, payload);
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', event.data, error);
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      return; // Already scheduled
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts; // Exponential backoff

    console.log(
      `[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
    );

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.token) {
        this.connect(this.token);
      }
    }, delay);
  }

  /**
   * Set connection state and notify listeners
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.stateListeners.forEach((listener) => {
        try {
          listener(state);
        } catch (error) {
          console.error('[WebSocket] Error in state listener:', error);
        }
      });
    }
  }
}

// Singleton instance
const wsManager = new WebSocketManager();

// ============================================
// REACT HOOKS
// ============================================

/**
 * useWebSocket Hook
 * Manages WebSocket connection lifecycle based on authentication state
 *
 * Features:
 * - Auto-connects when user is authenticated
 * - Auto-disconnects when user logs out
 * - Provides connection state
 * - Handles reconnection automatically
 *
 * @returns Object with connection state
 *
 * @example
 * ```tsx
 * function App() {
 *   const { connectionState } = useWebSocket();
 *
 *   return (
 *     <div>
 *       <StatusIndicator state={connectionState} />
 *       {connectionState === 'connected' && <div>🟢 Real-time updates active</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export const useWebSocket = () => {
  const { isAuthenticated, user } = useAuth();
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    wsManager.getState(),
  );

  // Get token from storage
  const getToken = useCallback((): string | null => {
    try {
      const localStore = localStorage.getItem('auth-storage');
      if (localStore) {
        const parsed = JSON.parse(localStore);
        return parsed.state?.userToken?.accessToken || null;
      }

      const sessionStore = sessionStorage.getItem('auth-storage');
      if (sessionStore) {
        const parsed = JSON.parse(sessionStore);
        return parsed.state?.userToken?.accessToken || null;
      }
    } catch (error) {
      console.error('[WebSocket] Error getting token:', error);
    }
    return null;
  }, []);

  // Connect/disconnect based on auth state
  useEffect(() => {
    if (isAuthenticated && user) {
      const token = getToken();
      if (token) {
        wsManager.connect(token);
      }
    } else {
      wsManager.disconnect();
    }

    // Cleanup on unmount
    return () => {
      wsManager.disconnect();
    };
  }, [isAuthenticated, user, getToken]);

  // Subscribe to connection state changes
  useEffect(() => {
    const unsubscribe = wsManager.onStateChange(setConnectionState);
    return unsubscribe;
  }, []);

  return {
    connectionState,
    isConnected: connectionState === 'connected',
    isConnecting: connectionState === 'connecting',
    isDisconnected: connectionState === 'disconnected',
    hasError: connectionState === 'error',
  };
};

/**
 * useWebSocketEvent Hook
 * Subscribe to specific WebSocket events with automatic React Query invalidation
 *
 * Features:
 * - Type-safe event subscription
 * - Automatic cache invalidation for related queries
 * - Auto cleanup on unmount
 * - Custom handler support
 *
 * @param event - WebSocket event type to subscribe to
 * @param handler - Optional custom handler (called after cache invalidation)
 *
 * @example
 * ```tsx
 * function TransactionList() {
 *   // Auto-invalidates transaction queries when new transaction created
 *   useWebSocketEvent('transaction:created');
 *
 *   // With custom handler
 *   useWebSocketEvent('transaction:created', (payload) => {
 *     console.log('New transaction:', payload.id);
 *     toast.success('تم إضافة عملية جديدة');
 *   });
 *
 *   const { data: transactions } = useTransactions();
 *   return <TransactionTable data={transactions} />;
 * }
 * ```
 */
export const useWebSocketEvent = <T extends WebSocketEventType>(
  event: T,
  handler?: EventHandler<T>,
) => {
  const queryClient = useQueryClient();
  const handlerRef = useRef(handler);

  // Keep handler ref up to date
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const eventHandler: EventHandler<T> = (payload) => {
      // Invalidate relevant queries based on event type
      switch (event) {
        case 'transaction:created':
        case 'transaction:updated':
        case 'transaction:deleted':
          queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
          break;

        case 'debt:created':
        case 'debt:updated':
        case 'debt:paid':
          queryClient.invalidateQueries({ queryKey: queryKeys.debts.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
          break;

        case 'notification:created':
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
          break;

        case 'inventory:updated':
        case 'inventory:created':
        case 'inventory:deleted':
          queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
          break;

        case 'user:updated':
          queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
          break;

        case 'branch:updated':
          queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
          break;
      }

      // Call custom handler if provided
      if (handlerRef.current) {
        handlerRef.current(payload);
      }
    };

    // Subscribe to event
    wsManager.on(event, eventHandler);

    // Cleanup on unmount
    return () => {
      wsManager.off(event, eventHandler);
    };
  }, [event, queryClient]);
};

/**
 * useWebSocketEvents Hook
 * Subscribe to multiple WebSocket events at once
 *
 * @param events - Array of event types to subscribe to
 * @param handler - Optional custom handler for all events
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   // Subscribe to multiple events
 *   useWebSocketEvents([
 *     'transaction:created',
 *     'debt:created',
 *     'notification:created',
 *   ]);
 *
 *   return <DashboardContent />;
 * }
 * ```
 */
export const useWebSocketEvents = (
  events: WebSocketEventType[],
  handler?: (event: WebSocketEventType, payload: unknown) => void,
) => {
  events.forEach((event) => {
    useWebSocketEvent(event, handler ? (payload) => handler(event, payload) : undefined);
  });
};
