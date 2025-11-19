# Optimistic Updates Guide

This document describes the optimistic update pattern used in all mutation hooks. Optimistic updates improve perceived performance by updating the UI immediately before the server responds.

## Optimistic Update Pattern

All mutation hooks follow this standard pattern:

```typescript
export const useCreateExample = () => {
  const queryClient = useQueryClient();

  return useMutation<Example, ApiError, CreateExampleInput>({
    mutationFn: exampleService.create,

    // 1. OPTIMISTIC UPDATE (onMutate)
    onMutate: async (newExample) => {
      // Cancel outgoing queries to avoid race conditions
      await queryClient.cancelQueries({ queryKey: queryKeys.examples.all });

      // Snapshot current data for rollback
      const previousExamples = queryClient.getQueriesData<PaginatedResponse<Example>>({
        queryKey: queryKeys.examples.all,
      });

      // Optimistically update cache with temp ID
      queryClient.setQueriesData<PaginatedResponse<Example>>(
        { queryKey: queryKeys.examples.all },
        (old) => {
          if (!old) return old;

          const tempExample: Example = {
            id: `temp-${Date.now()}`,
            ...newExample,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          return {
            ...old,
            data: [tempExample, ...old.data],
            meta: {
              ...old.meta,
              total: old.meta.total + 1,
            },
          };
        },
      );

      return { previousExamples };
    },

    // 2. ROLLBACK ON ERROR (onError)
    onError: (_error, _newExample, context) => {
      // Rollback to previous state
      if (context?.previousExamples) {
        context.previousExamples.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Note: Error toast shown by global API interceptor
      // Do NOT show toast here to avoid duplicate error messages
    },

    // 3. INVALIDATE ON SUCCESS (onSuccess)
    onSuccess: (newExample) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.examples.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });

      // Show success toast
      toast.success('تم إضافة المثال بنجاح');
    },
  });
};
```

---

## Mutation Types

### CREATE Mutations

**Pattern:**
- Add temporary item with `id: temp-${Date.now()}`
- Prepend to array (newest first)
- Increment total count

**Example:**
```typescript
onMutate: async (newItem) => {
  await queryClient.cancelQueries({ queryKey: queryKeys.items.all });

  const previousItems = queryClient.getQueriesData<PaginatedResponse<Item>>({
    queryKey: queryKeys.items.all,
  });

  queryClient.setQueriesData<PaginatedResponse<Item>>(
    { queryKey: queryKeys.items.all },
    (old) => {
      if (!old) return old;

      const tempItem: Item = {
        id: `temp-${Date.now()}`,
        ...newItem,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        ...old,
        data: [tempItem, ...old.data],
        meta: {
          ...old.meta,
          total: old.meta.total + 1,
        },
      };
    },
  );

  return { previousItems };
},
```

---

### UPDATE Mutations

**Pattern:**
- Update item in list immediately
- Update detail cache if exists
- Set `updatedAt` to current time

**Example:**
```typescript
onMutate: async ({ id, data }) => {
  // Cancel both list and detail queries
  await queryClient.cancelQueries({ queryKey: queryKeys.items.all });
  await queryClient.cancelQueries({ queryKey: queryKeys.items.detail(id) });

  // Snapshot both
  const previousItem = queryClient.getQueryData<Item>(
    queryKeys.items.detail(id),
  );
  const previousItems = queryClient.getQueriesData<PaginatedResponse<Item>>({
    queryKey: queryKeys.items.all,
  });

  // Update detail cache
  queryClient.setQueryData<Item>(
    queryKeys.items.detail(id),
    (old) => {
      if (!old) return old;
      return { ...old, ...data, updatedAt: new Date().toISOString() };
    },
  );

  // Update in all lists
  queryClient.setQueriesData<PaginatedResponse<Item>>(
    { queryKey: queryKeys.items.all },
    (old) => {
      if (!old) return old;

      return {
        ...old,
        data: old.data.map((item) =>
          item.id === id
            ? { ...item, ...data, updatedAt: new Date().toISOString() }
            : item,
        ),
      };
    },
  );

  return { previousItem, previousItems };
},
```

---

### DELETE Mutations

**Pattern:**
- Remove item from array immediately
- Decrement total count
- Remove detail cache

**Example:**
```typescript
onMutate: async (deletedId) => {
  await queryClient.cancelQueries({ queryKey: queryKeys.items.all });

  const previousItems = queryClient.getQueriesData<PaginatedResponse<Item>>({
    queryKey: queryKeys.items.all,
  });

  // Remove from all lists
  queryClient.setQueriesData<PaginatedResponse<Item>>(
    { queryKey: queryKeys.items.all },
    (old) => {
      if (!old) return old;

      return {
        ...old,
        data: old.data.filter((item) => item.id !== deletedId),
        meta: {
          ...old.meta,
          total: old.meta.total - 1,
        },
      };
    },
  );

  // Remove detail from cache
  queryClient.removeQueries({
    queryKey: queryKeys.items.detail(deletedId),
  });

  return { previousItems };
},
```

---

## Error Handling

### Rollback Pattern

Always rollback optimistic updates on error:

```typescript
onError: (_error, _variables, context) => {
  // Rollback detail if exists
  if (context?.previousItem) {
    queryClient.setQueryData(
      queryKeys.items.detail(id),
      context.previousItem,
    );
  }

  // Rollback all lists
  if (context?.previousItems) {
    context.previousItems.forEach(([queryKey, data]) => {
      queryClient.setQueryData(queryKey, data);
    });
  }

  // Note: Error toast shown by global API interceptor
  // Do NOT manually show error toast here
},
```

### Error Toast Handling

**IMPORTANT:** Do NOT show error toasts in `onError` handler:
- ❌ **Wrong:** `toast.error(error.message)` in onError
- ✅ **Correct:** Let global API interceptor handle errors

**Why?**
- Global API interceptor already shows error toasts
- Showing toast in onError causes duplicate error messages
- Centralized error handling ensures consistent error formatting

---

## Success Handling

### Success Pattern

```typescript
onSuccess: (newData, variables) => {
  // 1. Invalidate all related queries
  queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });

  // 2. Show success toast
  toast.success('تم إضافة العنصر بنجاح');
},
```

### Do NOT Use onSettled

**IMPORTANT:** Use `onSuccess` for invalidation, NOT `onSettled`:
- ❌ **Wrong:** Invalidate in onSettled
- ✅ **Correct:** Invalidate in onSuccess

**Why?**
- `onSettled` runs on both success AND error
- Invalidating on error wastes network bandwidth
- `onSuccess` only runs when mutation succeeds

---

## Type Safety

### Strict TypeScript

All optimistic update code uses strict TypeScript with NO `any` types:

```typescript
// ✅ CORRECT - Strict types
onError: (_error: ApiError, _variables: CreateInput, context) => {
  if (context?.previousItems) {
    context.previousItems.forEach(([queryKey, data]) => {
      queryClient.setQueryData(queryKey, data);
    });
  }
},

// ❌ WRONG - Using any
onError: (error: any, _variables, context) => {
  // Do not use any!
},
```

### Type Parameters

Always specify all 3 generic types for useMutation:

```typescript
useMutation<
  ResponseType,   // What the mutation returns
  ApiError,       // Error type (always ApiError)
  InputType       // What the mutation accepts
>({
  // ...
})
```

**Examples:**
```typescript
// Create mutation
useMutation<Item, ApiError, CreateItemInput>

// Update mutation
useMutation<Item, ApiError, { id: string; data: UpdateItemInput }>

// Delete mutation
useMutation<void, ApiError, string>

// Pay debt mutation (special case)
useMutation<Debt, ApiError, { id: string; data: PayDebtInput }>
```

---

## Complete Examples

### Example 1: Create Mutation

```typescript
export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation<Transaction, ApiError, CreateTransactionInput>({
    mutationFn: transactionService.create,

    onMutate: async (newTransaction) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.all });

      const previousTransactions = queryClient.getQueriesData<
        PaginatedResponse<Transaction>
      >({
        queryKey: queryKeys.transactions.all,
      });

      queryClient.setQueriesData<PaginatedResponse<Transaction>>(
        { queryKey: queryKeys.transactions.all },
        (old) => {
          if (!old) return old;

          const tempTransaction: Transaction = {
            id: `temp-${Date.now()}`,
            ...newTransaction,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          return {
            ...old,
            data: [tempTransaction, ...old.data],
            meta: {
              ...old.meta,
              total: old.meta.total + 1,
            },
          };
        },
      );

      return { previousTransactions };
    },

    onError: (_error, _newTransaction, context) => {
      if (context?.previousTransactions) {
        context.previousTransactions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });

      const message =
        variables.type === 'INCOME'
          ? 'تم إضافة الإيراد بنجاح'
          : 'تم إضافة المصروف بنجاح';
      toast.success(message);
    },
  });
};
```

### Example 2: Update Mutation

```typescript
export const useUpdateDebt = () => {
  const queryClient = useQueryClient();

  return useMutation<Debt, ApiError, { id: string; data: UpdateDebtInput }>({
    mutationFn: ({ id, data }) => debtService.update(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.debts.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.debts.detail(id) });

      const previousDebt = queryClient.getQueryData<Debt>(
        queryKeys.debts.detail(id),
      );
      const previousDebts = queryClient.getQueriesData<PaginatedResponse<Debt>>({
        queryKey: queryKeys.debts.all,
      });

      queryClient.setQueryData<Debt>(queryKeys.debts.detail(id), (old) => {
        if (!old) return old;
        return { ...old, ...data, updatedAt: new Date().toISOString() };
      });

      queryClient.setQueriesData<PaginatedResponse<Debt>>(
        { queryKey: queryKeys.debts.all },
        (old) => {
          if (!old) return old;

          return {
            ...old,
            data: old.data.map((debt) =>
              debt.id === id
                ? { ...debt, ...data, updatedAt: new Date().toISOString() }
                : debt,
            ),
          };
        },
      );

      return { previousDebt, previousDebts };
    },

    onError: (_error, { id }, context) => {
      if (context?.previousDebt) {
        queryClient.setQueryData(queryKeys.debts.detail(id), context.previousDebt);
      }
      if (context?.previousDebts) {
        context.previousDebts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    onSuccess: (updatedDebt) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.debts.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.debts.detail(updatedDebt.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });

      toast.success('تم تحديث الدين بنجاح');
    },
  });
};
```

---

## Best Practices Checklist

- ✅ Cancel outgoing queries in `onMutate`
- ✅ Snapshot previous data for rollback
- ✅ Use temp IDs for new items: `temp-${Date.now()}`
- ✅ Update `updatedAt` to current time
- ✅ Rollback on error in `onError`
- ✅ **DO NOT** show error toast (global interceptor handles it)
- ✅ Invalidate related queries in `onSuccess`
- ✅ Show success toast in `onSuccess`
- ✅ Use strict TypeScript types (NO `any`)
- ✅ Specify all 3 generic types for `useMutation`
- ✅ Use `onSuccess` for invalidation (NOT `onSettled`)
- ✅ Handle both list and detail caches for updates

---

## Testing Optimistic Updates

To test optimistic updates:

1. **Slow network simulation:**
   - Open DevTools → Network → Throttling → Slow 3G
   - Create/update/delete items
   - UI should update instantly
   - Server response updates with real ID

2. **Error simulation:**
   - Disconnect network
   - Create/update/delete items
   - UI should show optimistic update
   - On error, should rollback to previous state
   - Error toast should appear (from global interceptor)

3. **Race condition test:**
   - Trigger multiple mutations quickly
   - All should be queued and processed correctly
   - No data loss or inconsistencies

---

## Migration Guide

If you have old mutation hooks without optimistic updates:

### Before (No optimistic update):
```typescript
export const useCreateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: itemService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Success');
    },
    onError: (error: any) => {
      toast.error(error.message); // ❌ Duplicate error toast
    },
  });
};
```

### After (With optimistic update):
```typescript
export const useCreateItem = () => {
  const queryClient = useQueryClient();

  return useMutation<Item, ApiError, CreateItemInput>({
    mutationFn: itemService.create,

    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.items.all });

      const previousItems = queryClient.getQueriesData<PaginatedResponse<Item>>({
        queryKey: queryKeys.items.all,
      });

      queryClient.setQueriesData<PaginatedResponse<Item>>(
        { queryKey: queryKeys.items.all },
        (old) => {
          if (!old) return old;

          const tempItem: Item = {
            id: `temp-${Date.now()}`,
            ...newItem,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          return {
            ...old,
            data: [tempItem, ...old.data],
            meta: {
              ...old.meta,
              total: old.meta.total + 1,
            },
          };
        },
      );

      return { previousItems };
    },

    onError: (_error, _newItem, context) => {
      if (context?.previousItems) {
        context.previousItems.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      // ✅ No error toast - global interceptor handles it
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });

      toast.success('Success');
    },
  });
};
```

---

## Summary

All mutations must implement:
1. **Optimistic update** in `onMutate` with temp IDs
2. **Rollback** in `onError` (no error toast)
3. **Invalidation** in `onSuccess` (with success toast)
4. **Strict TypeScript** types (no `any`)
5. **Proper query keys** from centralized `queryKeys`
