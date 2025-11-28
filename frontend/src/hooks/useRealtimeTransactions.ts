/**
 * useRealtimeTransactions Hook
 * Real-time transaction updates with WebSocket events
 *
 * Features:
 * - Listens to transaction:created, transaction:updated, transaction:deleted events
 * - Auto-invalidates transactions and dashboard queries
 * - Shows toast for new transactions from other branches (admin only)
 * - Strict typing, no `any`
 *
 * Note: Optimistic updates are already handled by mutation hooks.
 * This hook focuses on real-time updates from other users/branches.
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
 * Transaction event payload
 */
type TransactionCreatedPayload = WebSocketEventPayload['transaction:created'];
type TransactionUpdatedPayload = WebSocketEventPayload['transaction:updated'];
type TransactionDeletedPayload = WebSocketEventPayload['transaction:deleted'];

/**
 * Transaction type labels in Arabic
 */
const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  SALE: 'بيع',
  PURCHASE: 'شراء',
  EXPENSE: 'صرفيات الصندوق',
  INCOME: 'واردات صندوق',
  SALARY: 'راتب',
  DEBT_PAYMENT: 'دفع دين',
  OTHER: 'أخرى',
};

/**
 * Get transaction type label in Arabic
 */
const getTransactionTypeLabel = (type: string): string => {
  return TRANSACTION_TYPE_LABELS[type] || type;
};

// ============================================
// MAIN HOOK
// ============================================

/**
 * useRealtimeTransactions Hook
 * Handles real-time transaction events from WebSocket
 *
 * Features:
 * - Listens to transaction events (created/updated/deleted)
 * - Auto-invalidates transactions and dashboard queries
 * - Shows toast notifications for cross-branch transactions (admin only)
 * - Optimistic updates already handled by mutations
 *
 * Note: Query invalidation is automatically handled by useWebSocketEvent.
 * This hook adds custom logic for toast notifications.
 *
 * @example
 * ```tsx
 * function TransactionList() {
 *   // Subscribe to real-time transaction updates
 *   useRealtimeTransactions();
 *
 *   const { data: transactions } = useTransactions();
 *   return <TransactionTable data={transactions} />;
 * }
 * ```
 */
export const useRealtimeTransactions = () => {
  const { user, isAdmin } = useAuth();

  /**
   * Handle transaction:created event
   * Show toast only if admin and transaction is from another branch
   */
  const handleTransactionCreated = useCallback(
    (payload: TransactionCreatedPayload) => {
      // Only show toast for admins
      if (!isAdmin) {
        return;
      }

      // Only show toast if transaction is from a different branch
      if (user?.branchId && payload.branchId !== user.branchId) {
        const typeLabel = getTransactionTypeLabel(payload.type);
        toast.info(`عملية ${typeLabel} جديدة من فرع آخر`, {
          description: `تم إضافة عملية ${typeLabel} جديدة`,
          duration: 4000,
        });
      }

      console.log('[Realtime] Transaction created:', payload);
    },
    [isAdmin, user?.branchId]
  );

  /**
   * Handle transaction:updated event
   * Show toast only if admin and transaction is from another branch
   */
  const handleTransactionUpdated = useCallback(
    (payload: TransactionUpdatedPayload) => {
      // Only show toast for admins
      if (!isAdmin) {
        return;
      }

      // Only show toast if transaction is from a different branch
      if (user?.branchId && payload.branchId !== user.branchId) {
        const typeLabel = getTransactionTypeLabel(payload.type);
        toast.info(`تم تحديث عملية ${typeLabel} من فرع آخر`, {
          description: `تم تعديل عملية ${typeLabel}`,
          duration: 4000,
        });
      }

      console.log('[Realtime] Transaction updated:', payload);
    },
    [isAdmin, user?.branchId]
  );

  /**
   * Handle transaction:deleted event
   * Show toast only if admin and transaction is from another branch
   */
  const handleTransactionDeleted = useCallback(
    (payload: TransactionDeletedPayload) => {
      // Only show toast for admins
      if (!isAdmin) {
        return;
      }

      // Only show toast if transaction is from a different branch
      if (user?.branchId && payload.branchId !== user.branchId) {
        toast.warning('تم حذف عملية من فرع آخر', {
          description: 'تم حذف عملية من فرع آخر',
          duration: 4000,
        });
      }

      console.log('[Realtime] Transaction deleted:', payload);
    },
    [isAdmin, user?.branchId]
  );

  // Subscribe to transaction events
  // Note: Query invalidation (transactions + dashboard) is handled automatically
  useWebSocketEvent('transaction:created', handleTransactionCreated);
  useWebSocketEvent('transaction:updated', handleTransactionUpdated);
  useWebSocketEvent('transaction:deleted', handleTransactionDeleted);
};

/**
 * useRealtimeTransactionCreated Hook
 * Subscribe only to transaction:created events
 *
 * @param handler - Optional custom handler
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   useRealtimeTransactionCreated((payload) => {
 *     console.log('New transaction:', payload);
 *   });
 *
 *   return <DashboardContent />;
 * }
 * ```
 */
export const useRealtimeTransactionCreated = (
  handler?: (payload: TransactionCreatedPayload) => void
) => {
  useWebSocketEvent('transaction:created', handler);
};

/**
 * useRealtimeTransactionUpdated Hook
 * Subscribe only to transaction:updated events
 *
 * @param handler - Optional custom handler
 *
 * @example
 * ```tsx
 * function TransactionDetail({ id }) {
 *   useRealtimeTransactionUpdated((payload) => {
 *     if (payload.id === id) {
 *       console.log('This transaction was updated');
 *     }
 *   });
 *
 *   return <TransactionDetails id={id} />;
 * }
 * ```
 */
export const useRealtimeTransactionUpdated = (
  handler?: (payload: TransactionUpdatedPayload) => void
) => {
  useWebSocketEvent('transaction:updated', handler);
};

/**
 * useRealtimeTransactionDeleted Hook
 * Subscribe only to transaction:deleted events
 *
 * @param handler - Optional custom handler
 *
 * @example
 * ```tsx
 * function TransactionList() {
 *   useRealtimeTransactionDeleted((payload) => {
 *     console.log('Transaction deleted:', payload.id);
 *   });
 *
 *   return <TransactionTable />;
 * }
 * ```
 */
export const useRealtimeTransactionDeleted = (
  handler?: (payload: TransactionDeletedPayload) => void
) => {
  useWebSocketEvent('transaction:deleted', handler);
};
