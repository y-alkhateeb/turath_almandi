# Query Invalidation Guide

This document describes the query invalidation strategy for all mutations in the frontend application. Proper invalidation ensures the UI stays synchronized when data changes.

## Invalidation Strategy

When a mutation modifies data, it must invalidate all related queries to trigger refetching. This keeps the UI consistent across all views.

---

## Transaction Mutations

### `useCreateTransaction`
**Invalidates:**
- `queryKeys.transactions.all` - Updates transaction lists
- `queryKeys.dashboard.all` - Updates dashboard stats (revenue, expenses)
- `queryKeys.inventory.all` - Updates inventory if transaction type is PURCHASE

**Reason:** Creating a transaction affects:
- Transaction lists (all filters)
- Dashboard financial stats
- Inventory quantities (if PURCHASE type adds items)

### `useUpdateTransaction`
**Invalidates:**
- `queryKeys.transactions.all` - Updates transaction lists
- `queryKeys.transactions.detail(id)` - Updates specific transaction
- `queryKeys.dashboard.all` - Updates dashboard stats
- `queryKeys.inventory.all` - Updates inventory if transaction type is PURCHASE

**Reason:** Updating a transaction may change:
- Transaction amounts/dates affecting stats
- Purchase quantities affecting inventory

### `useDeleteTransaction`
**Invalidates:**
- `queryKeys.transactions.all` - Updates transaction lists
- `queryKeys.dashboard.all` - Updates dashboard stats
- `queryKeys.inventory.all` - Updates inventory if transaction type was PURCHASE

**Reason:** Deleting a transaction affects:
- Transaction lists and totals
- Dashboard financial calculations
- Inventory quantities (if PURCHASE type is deleted)

---

## Debt Mutations

### `useCreateDebt`
**Invalidates:**
- `queryKeys.debts.all` - Updates debt lists
- `queryKeys.notifications.all` - May trigger overdue notifications
- `queryKeys.dashboard.all` - Updates dashboard debt stats

**Reason:** Creating a debt affects:
- Debt lists and summaries
- Notifications (system may create overdue alerts)
- Dashboard debt statistics

### `useUpdateDebt`
**Invalidates:**
- `queryKeys.debts.all` - Updates debt lists
- `queryKeys.debts.detail(id)` - Updates specific debt
- `queryKeys.notifications.all` - May trigger/clear notifications
- `queryKeys.dashboard.all` - Updates dashboard debt stats

**Reason:** Updating a debt (due date, status) affects:
- Debt lists and filters
- Notification status (overdue alerts)
- Dashboard debt summaries

### `usePayDebt`
**Invalidates:**
- `queryKeys.debts.all` - Updates debt lists
- `queryKeys.debts.detail(id)` - Updates specific debt
- `queryKeys.debts.payments(id)` - Updates payment history
- `queryKeys.notifications.all` - May clear overdue notifications
- `queryKeys.dashboard.all` - Updates dashboard debt stats

**Reason:** Paying a debt affects:
- Remaining amount in debt lists
- Payment history
- Overdue notifications (may be cleared)
- Dashboard debt statistics

### `useDeleteDebt`
**Invalidates:**
- `queryKeys.debts.all` - Updates debt lists
- `queryKeys.dashboard.all` - Updates dashboard debt stats

**Reason:** Deleting a debt affects:
- Debt lists and totals
- Dashboard debt summaries

---

## Inventory Mutations

### `useCreateInventory`
**Invalidates:**
- `queryKeys.inventory.all` - Updates inventory lists
- `queryKeys.inventory.value(branchId)` - Updates total inventory value

**Reason:** Creating an inventory item affects:
- Inventory lists
- Total inventory value calculations

### `useUpdateInventory`
**Invalidates:**
- `queryKeys.inventory.all` - Updates inventory lists
- `queryKeys.inventory.detail(id)` - Updates specific item
- `queryKeys.inventory.value(branchId)` - Updates total inventory value

**Reason:** Updating inventory (quantity, cost) affects:
- Item lists
- Total inventory value (cost × quantity)

### `useDeleteInventory`
**Invalidates:**
- `queryKeys.inventory.all` - Updates inventory lists
- `queryKeys.inventory.value(branchId)` - Updates total inventory value

**Reason:** Deleting an inventory item affects:
- Inventory lists
- Total inventory value

---

## User Mutations

### `useCreateUser` / `useUpdateUser` / `useDeleteUser`
**Invalidates:**
- `queryKeys.users.all` - Updates user lists

**Reason:** User changes only affect:
- User management lists
- User filters (role, branch, status)

---

## Branch Mutations

### `useCreateBranch` / `useUpdateBranch` / `useDeleteBranch`
**Invalidates:**
- `queryKeys.branches.all` - Updates branch lists

**Reason:** Branch changes only affect:
- Branch management lists
- Branch selectors across the app

---

## Notification Mutations

### `useMarkAsRead`
**Invalidates:**
- `queryKeys.notifications.all` - Updates notification lists
- *Silent operation - no toast*

**Reason:** Marking a notification as read affects:
- Notification lists and filters
- Unread count

### `useMarkAllAsRead`
**Invalidates:**
- `queryKeys.notifications.all` - Updates notification lists

**Reason:** Marking all notifications as read affects:
- All notification lists
- Unread count

### `useUpdateNotificationSettings`
**Invalidates:**
- `queryKeys.notifications.settings()` - Updates settings

**Reason:** Updating settings only affects:
- Notification settings display
- No impact on notification lists

---

## Real-time Invalidation

WebSocket events also trigger query invalidation automatically via `useWebSocketEvent`:

### `transaction:created` / `transaction:updated` / `transaction:deleted`
**Auto-invalidates:**
- `queryKeys.transactions.all`
- `queryKeys.dashboard.all`

### `debt:created` / `debt:paid` / `debt:updated`
**Auto-invalidates:**
- `queryKeys.debts.all`
- `queryKeys.notifications.all`
- `queryKeys.dashboard.all`

### `notification:created`
**Auto-invalidates:**
- `queryKeys.notifications.all`

---

## Best Practices

1. **Always invalidate the base query** - Invalidate `.all` to catch all filtered variations
2. **Invalidate dependent statistics** - Dashboard, summaries, totals
3. **Consider cross-entity effects** - Transactions affect inventory, debts affect notifications
4. **Use optimistic updates** - Update cache immediately, rollback on error
5. **Document invalidation reasons** - Explain WHY each query is invalidated

---

## Example: Adding New Mutation

```typescript
export const useCreateExample = () => {
  const queryClient = useQueryClient();

  return useMutation<Example, ApiError, CreateExampleInput>({
    mutationFn: exampleService.create,

    onSuccess: (newExample) => {
      // 1. Invalidate primary query
      queryClient.invalidateQueries({ queryKey: queryKeys.examples.all });

      // 2. Invalidate related statistics
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });

      // 3. Invalidate cross-entity queries (if applicable)
      if (newExample.affectsInventory) {
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      }

      // 4. Show success toast
      toast.success('تم إضافة المثال بنجاح');
    },
  });
};
```

---

## TypeScript Types

All query keys are strictly typed via `QueryKeys` type from `@/hooks/queries/queryKeys`:

```typescript
// Type-safe query key usage
queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
queryClient.invalidateQueries({ queryKey: queryKeys.transactions.detail(id) });
queryClient.invalidateQueries({ queryKey: queryKeys.transactions.summary(branchId, dates) });
```

No `any` types are used in query invalidation logic.
