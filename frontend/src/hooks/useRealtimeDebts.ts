/**
 * useRealtimeDebts Hook
 * Real-time debt updates with WebSocket events
 *
 * Features:
 * - Listens to debt:created, debt:paid, debt:updated events
 * - Auto-invalidates debts and notifications queries
 * - Shows toast for overdue alerts and payment notifications
 * - Updates debt summary via query invalidation
 * - Strict typing, no `any`
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useWebSocketEvent } from './useWebSocket';
import { useAuth } from './useAuth';
import type { WebSocketEventPayload } from './useWebSocket';

// ============================================
// TYPES
// ============================================

/**
 * Debt event payloads
 */
type DebtCreatedPayload = WebSocketEventPayload['debt:created'];
type DebtPaidPayload = WebSocketEventPayload['debt:paid'];
type DebtUpdatedPayload = WebSocketEventPayload['debt:updated'];

/**
 * Format currency for display
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ar-IQ', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// ============================================
// MAIN HOOK
// ============================================

/**
 * useRealtimeDebts Hook
 * Handles real-time debt events from WebSocket
 *
 * Features:
 * - Listens to debt events (created/paid/updated)
 * - Auto-invalidates debts and notifications queries
 * - Shows toast notifications for debt actions
 * - Alerts for overdue debts
 * - Payment confirmations
 *
 * Note: Query invalidation is automatically handled by useWebSocketEvent.
 * This hook adds custom logic for toast notifications and alerts.
 *
 * @example
 * ```tsx
 * function DebtList() {
 *   // Subscribe to real-time debt updates
 *   useRealtimeDebts();
 *
 *   const { data: debts } = useDebts();
 *   return <DebtTable data={debts} />;
 * }
 * ```
 */
export const useRealtimeDebts = () => {
  const { user, isAccountant, isAdmin } = useAuth();

  /**
   * Handle debt:created event
   * Show toast notification for new debts
   */
  const handleDebtCreated = useCallback(
    (payload: DebtCreatedPayload) => {
      // Show notification if:
      // - Admin (sees all debts)
      // - Accountant in the same branch
      const shouldNotify =
        isAdmin || (isAccountant && user?.branchId === payload.branchId);

      if (shouldNotify) {
        toast.info('💳 دين جديد', {
          description: `تم إضافة دين جديد للمدين: ${payload.debtorName}`,
          duration: 4000,
        });
      }

      console.log('[Realtime] Debt created:', payload);
    },
    [isAdmin, isAccountant, user?.branchId],
  );

  /**
   * Handle debt:paid event
   * Show success toast for debt payments
   */
  const handleDebtPaid = useCallback(
    (payload: DebtPaidPayload) => {
      // Show notification if:
      // - Admin (sees all debts)
      // - Accountant in the same branch
      const shouldNotify =
        isAdmin || (isAccountant && user?.branchId === payload.branchId);

      if (shouldNotify) {
        const formattedAmount = formatCurrency(payload.amountPaid);
        toast.success('✅ تم دفع دين', {
          description: `تم دفع ${formattedAmount}`,
          duration: 5000,
        });
      }

      console.log('[Realtime] Debt paid:', payload);
    },
    [isAdmin, isAccountant, user?.branchId],
  );

  /**
   * Handle debt:updated event
   * Show toast notification for debt updates
   */
  const handleDebtUpdated = useCallback(
    (payload: DebtUpdatedPayload) => {
      // Show notification if:
      // - Admin (sees all debts)
      // - Accountant in the same branch
      const shouldNotify =
        isAdmin || (isAccountant && user?.branchId === payload.branchId);

      if (shouldNotify) {
        toast.info('📝 تم تحديث دين', {
          description: 'تم تحديث معلومات الدين',
          duration: 4000,
        });
      }

      console.log('[Realtime] Debt updated:', payload);
    },
    [isAdmin, isAccountant, user?.branchId],
  );

  // Subscribe to debt events
  // Note: Query invalidation (debts + notifications + dashboard) is handled automatically
  useWebSocketEvent('debt:created', handleDebtCreated);
  useWebSocketEvent('debt:paid', handleDebtPaid);
  useWebSocketEvent('debt:updated', handleDebtUpdated);
};

/**
 * useRealtimeDebtCreated Hook
 * Subscribe only to debt:created events
 *
 * @param handler - Optional custom handler
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   useRealtimeDebtCreated((payload) => {
 *     console.log('New debt:', payload.debtorName);
 *   });
 *
 *   return <DashboardContent />;
 * }
 * ```
 */
export const useRealtimeDebtCreated = (
  handler?: (payload: DebtCreatedPayload) => void,
) => {
  useWebSocketEvent('debt:created', handler);
};

/**
 * useRealtimeDebtPaid Hook
 * Subscribe only to debt:paid events
 *
 * @param handler - Optional custom handler
 *
 * @example
 * ```tsx
 * function DebtDetail({ id }) {
 *   useRealtimeDebtPaid((payload) => {
 *     if (payload.id === id) {
 *       console.log('This debt was paid:', payload.amountPaid);
 *     }
 *   });
 *
 *   return <DebtDetails id={id} />;
 * }
 * ```
 */
export const useRealtimeDebtPaid = (
  handler?: (payload: DebtPaidPayload) => void,
) => {
  useWebSocketEvent('debt:paid', handler);
};

/**
 * useRealtimeDebtUpdated Hook
 * Subscribe only to debt:updated events
 *
 * @param handler - Optional custom handler
 *
 * @example
 * ```tsx
 * function DebtList() {
 *   useRealtimeDebtUpdated((payload) => {
 *     console.log('Debt updated:', payload.id);
 *   });
 *
 *   return <DebtTable />;
 * }
 * ```
 */
export const useRealtimeDebtUpdated = (
  handler?: (payload: DebtUpdatedPayload) => void,
) => {
  useWebSocketEvent('debt:updated', handler);
};

/**
 * useOverdueDebtAlerts Hook
 * Shows alerts for overdue debts
 *
 * Note: This is a placeholder for future implementation.
 * Overdue detection should be done on the backend and sent as notifications.
 *
 * @example
 * ```tsx
 * function App() {
 *   // Show alerts for overdue debts
 *   useOverdueDebtAlerts();
 *
 *   return <AppContent />;
 * }
 * ```
 */
export const useOverdueDebtAlerts = () => {
  const { isAdmin, isAccountant } = useAuth();

  // Only enable for admins and accountants
  const shouldMonitor = isAdmin || isAccountant;

  const handleDebtCreated = useCallback(
    (payload: DebtCreatedPayload) => {
      // Overdue logic should be handled by backend
      // Backend should send notification:created events for overdue debts
      console.log('[Overdue Monitor] New debt created:', payload);
    },
    [],
  );

  const handleDebtUpdated = useCallback(
    (payload: DebtUpdatedPayload) => {
      // Overdue logic should be handled by backend
      // Backend should send notification:created events for overdue debts
      console.log('[Overdue Monitor] Debt updated:', payload);
    },
    [],
  );

  // Only subscribe if user has permission
  if (shouldMonitor) {
    useWebSocketEvent('debt:created', handleDebtCreated);
    useWebSocketEvent('debt:updated', handleDebtUpdated);
  }
};
