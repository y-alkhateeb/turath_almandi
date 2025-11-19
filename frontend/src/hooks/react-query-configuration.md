# React Query Configuration & Best Practices

## Overview

This document describes the React Query configuration and patterns used throughout the application to handle concurrent requests, caching, refetching, and racing conditions.

## Global Configuration

**Location**: `frontend/src/main.tsx` (lines 11-19)

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,                          // Retry failed queries once
      refetchOnWindowFocus: false,       // Disabled globally
      staleTime: 5 * 60 * 1000,         // 5 minutes default
    },
  },
});
```

### Global Defaults Explained

| Setting | Value | Reasoning |
|---------|-------|-----------|
| **retry** | `1` | Only retry once to avoid excessive server load and slow error feedback |
| **refetchOnWindowFocus** | `false` | Disabled to prevent excessive refetches when switching browser tabs |
| **staleTime** | `5 minutes` | Default for stable data (users, branches) |

---

## Query Hooks Configuration

### Stable Data Queries (5 minutes staleTime)

**Use Case**: Data that changes infrequently (users, branches, settings)

#### useUsers Hook

```typescript
export const useUsers = () => {
  return useQuery<UserWithBranch[], ApiError>({
    queryKey: queryKeys.users.all,
    queryFn: () => usersService.getAll(),
    staleTime: 5 * 60 * 1000,  // ✅ 5 minutes - users don't change often
    gcTime: 10 * 60 * 1000,    // Cache for 10 minutes
    retry: 1,
  });
};
```

**File**: `frontend/src/hooks/useUsers.ts:35-43`

**Why 5 minutes?**
- Users list changes infrequently (only when admin creates/updates users)
- Reduces unnecessary API calls
- Real-time updates handled by WebSocket invalidation
- Balance between freshness and performance

#### useBranches Hook

```typescript
export const useBranches = (options?: { isActive?: boolean }) => {
  // ...filters setup...

  return useQuery<Branch[], ApiError>({
    queryKey: queryKeys.branches.list(filters),
    queryFn: async () => { /* ... */ },
    staleTime: 5 * 60 * 1000,  // ✅ 5 minutes - branches rarely change
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
};
```

**File**: `frontend/src/hooks/useBranches.ts:48-86`

**Why 5 minutes?**
- Branches are rarely created/updated
- Very stable data
- Users typically work within one branch during a session

---

### Dynamic Data Queries (2 minutes staleTime)

**Use Case**: Data that changes frequently (transactions, debts, inventory)

#### useTransactions Hook

```typescript
export const useTransactions = (filters?: TransactionQueryFilters) => {
  return useQuery<PaginatedResponse<Transaction>, ApiError>({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: () => transactionService.getAll(filters),
    staleTime: 2 * 60 * 1000,  // ✅ 2 minutes - transactions change frequently
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
};
```

**File**: `frontend/src/hooks/useTransactions.ts:55-63`

**Why 2 minutes?**
- Transactions created frequently throughout the day
- Multiple users may create transactions concurrently
- Shorter staleTime ensures fresher data
- Real-time updates via WebSocket help keep data fresh

#### useDebts Hook

```typescript
export const useDebts = (filters?: DebtQueryFilters) => {
  const { user, isAccountant } = useAuth();

  const appliedFilters: DebtQueryFilters = {
    ...filters,
    branchId: isAccountant && user?.branchId ? user.branchId : filters?.branchId,
  };

  return useQuery<PaginatedResponse<Debt>, ApiError>({
    queryKey: queryKeys.debts.list(appliedFilters),
    queryFn: () => debtService.getAll(appliedFilters),
    staleTime: 2 * 60 * 1000,  // ✅ 2 minutes - debts updated frequently
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
};
```

**File**: `frontend/src/hooks/useDebts.ts:58-74`

**Why 2 minutes?**
- Debt payments made throughout the day
- Debt status changes frequently (ACTIVE → PARTIAL → PAID)
- Multiple users may update debts concurrently

---

## refetchOnWindowFocus Configuration

### Global Setting: DISABLED

**Location**: `main.tsx:15`

```typescript
refetchOnWindowFocus: false,  // ✅ Disabled globally
```

### Why Disabled?

1. **Prevents Excessive Refetches**: Users often switch tabs while working, don't want constant refetches
2. **Better UX**: No loading spinners when switching back to tab
3. **Bandwidth Savings**: Reduces unnecessary API calls
4. **Real-time Updates**: WebSocket provides real-time updates, so refetchOnWindowFocus is redundant

### When to Enable (Per-Query Override)

For **critical data** that MUST be fresh when user returns:

```typescript
// Example: Notification count (if not using WebSocket)
export const useUnreadNotificationsCount = () => {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationService.getUnreadCount(),
    staleTime: 0,  // Always stale
    refetchOnWindowFocus: true,  // ✅ Override global setting
  });
};
```

**Use Cases for Enabling**:
- Notification counts (time-sensitive)
- User balance/wallet (financial data)
- Active session status
- Live chat/messaging

**Current Status**: All hooks use global setting (disabled)

---

## Handling Racing Conditions in Mutations

All mutation hooks implement the **Optimistic Update Pattern** with proper race condition handling.

### Pattern Overview

```typescript
useMutation({
  mutationFn: service.create,

  // STEP 1: Optimistic Update (before API call)
  onMutate: async (newData) => {
    // 1.1: Cancel outgoing queries to prevent racing
    await queryClient.cancelQueries({ queryKey: queryKeys.entity.all });

    // 1.2: Snapshot current data for rollback
    const previousData = queryClient.getQueryData(queryKeys.entity.all);

    // 1.3: Optimistically update cache
    queryClient.setQueryData(queryKeys.entity.all, (old) => {
      // Add/update/delete optimistically with temp ID
      return [...newData, ...old];
    });

    // 1.4: Return context for rollback
    return { previousData };
  },

  // STEP 2: Rollback on Error
  onError: (error, variables, context) => {
    // Restore previous data
    if (context?.previousData) {
      queryClient.setQueryData(queryKeys.entity.all, context.previousData);
    }
    // Error toast shown by global API interceptor
  },

  // STEP 3: Invalidate on Success
  onSuccess: () => {
    // Invalidate and refetch to get server data
    queryClient.invalidateQueries({ queryKey: queryKeys.entity.all });
    toast.success('Success message');
  },
});
```

### Racing Conditions Prevented

#### Race 1: Concurrent Mutations

**Problem**: Two users create/update same entity simultaneously

**Solution**:
```typescript
onMutate: async (newData) => {
  // Cancel ALL outgoing queries before optimistic update
  await queryClient.cancelQueries({ queryKey: queryKeys.users.all });

  // Now no race - our optimistic update won't be overwritten
  // by an inflight query response
}
```

#### Race 2: Query Refetch During Mutation

**Problem**: Query refetches while mutation is in progress, overwriting optimistic update

**Solution**:
```typescript
onMutate: async (newData) => {
  // Cancel prevents refetch from overwriting our optimistic update
  await queryClient.cancelQueries({ queryKey: queryKeys.users.all });

  // Snapshot for rollback
  const previousUsers = queryClient.getQueryData(queryKeys.users.all);

  // Safe to update now - no concurrent fetches
  queryClient.setQueryData(queryKeys.users.all, (old) => [...newData, ...old]);

  return { previousUsers };
}
```

#### Race 3: Multiple Simultaneous Deletes

**Problem**: User clicks delete on multiple items rapidly

**Solution**:
```typescript
// Each mutation cancels queries independently
onMutate: async (deletedId) => {
  await queryClient.cancelQueries({ queryKey: queryKeys.users.all });

  // Snapshot current state
  const previousUsers = queryClient.getQueryData(queryKeys.users.all);

  // Optimistically remove item
  queryClient.setQueryData(queryKeys.users.all, (old) =>
    old.filter((user) => user.id !== deletedId)
  );

  return { previousUsers };
},

onError: (error, deletedId, context) => {
  // Each mutation can rollback independently
  if (context?.previousUsers) {
    queryClient.setQueryData(queryKeys.users.all, context.previousUsers);
  }
}
```

### Examples from Codebase

#### useCreateUser (Full Implementation)

**File**: `frontend/src/hooks/useUsers.ts:96-152`

```typescript
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<UserWithBranch, ApiError, CreateUserDto>({
    mutationFn: (data: CreateUserDto) => usersService.create(data),

    onMutate: async (newUser) => {
      // ✅ Cancel to prevent race conditions
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });

      // ✅ Snapshot for rollback
      const previousUsers = queryClient.getQueryData<UserWithBranch[]>(
        queryKeys.users.all,
      );

      // ✅ Optimistic update with temp ID
      if (previousUsers) {
        queryClient.setQueryData<UserWithBranch[]>(
          queryKeys.users.all,
          (old = []) => [
            {
              id: `temp-${Date.now()}`,  // Temp ID prevents conflicts
              username: newUser.username,
              role: newUser.role,
              // ...other fields
            } as UserWithBranch,
            ...old,
          ],
        );
      }

      return { previousUsers };
    },

    onError: (_error, _newUser, context) => {
      // ✅ Rollback on error
      if (context?.previousUsers) {
        queryClient.setQueryData(queryKeys.users.all, context.previousUsers);
      }
    },

    onSuccess: () => {
      // ✅ Invalidate to fetch real server data
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success('تم إضافة المستخدم بنجاح');
    },
  });
};
```

#### useUpdateBranch (Multiple Query Invalidation)

**File**: `frontend/src/hooks/useBranches.ts:225-300`

```typescript
export const useUpdateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation<Branch, ApiError, { id: string; data: UpdateBranchInput }>({
    mutationFn: ({ id, data }) => branchService.update(id, data),

    onMutate: async ({ id, data }) => {
      // ✅ Cancel ALL branch queries (list + detail)
      await queryClient.cancelQueries({ queryKey: queryKeys.branches.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.branches.detail(id) });

      // ✅ Snapshot BOTH queries
      const previousBranch = queryClient.getQueryData<Branch>(
        queryKeys.branches.detail(id),
      );
      const previousBranches = queryClient.getQueriesData<Branch[]>({
        queryKey: queryKeys.branches.all,
      });

      // ✅ Update detail query
      queryClient.setQueryData<Branch>(
        queryKeys.branches.detail(id),
        (old) => {
          if (!old) return old;
          return { ...old, ...data, updatedAt: new Date().toISOString() };
        },
      );

      // ✅ Update ALL list queries (different filters)
      queryClient.setQueriesData<Branch[]>(
        { queryKey: queryKeys.branches.all },
        (old) => {
          if (!old) return old;
          return old.map((branch) =>
            branch.id === id
              ? { ...branch, ...data, updatedAt: new Date().toISOString() }
              : branch,
          );
        },
      );

      return { previousBranch, previousBranches };
    },

    onError: (error, { id }, context) => {
      // ✅ Rollback BOTH queries
      if (context?.previousBranch) {
        queryClient.setQueryData(queryKeys.branches.detail(id), context.previousBranch);
      }
      if (context?.previousBranches) {
        context.previousBranches.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    onSuccess: (updatedBranch) => {
      // ✅ Invalidate ALL related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.branches.detail(updatedBranch.id),
      });
      toast.success('تم تحديث الفرع بنجاح');
    },
  });
};
```

---

## Best Practices Summary

### ✅ DO

1. **Use appropriate staleTime**:
   - 5 minutes for stable data (users, branches, settings)
   - 2 minutes for dynamic data (transactions, debts, inventory)
   - 0 for real-time critical data (with WebSocket fallback)

2. **Cancel queries before optimistic updates**:
   ```typescript
   await queryClient.cancelQueries({ queryKey: queryKeys.entity.all });
   ```

3. **Always snapshot for rollback**:
   ```typescript
   const previousData = queryClient.getQueryData(queryKeys.entity.all);
   return { previousData };
   ```

4. **Invalidate queries on success**:
   ```typescript
   queryClient.invalidateQueries({ queryKey: queryKeys.entity.all });
   ```

5. **Use temp IDs for optimistic creates**:
   ```typescript
   id: `temp-${Date.now()}`  // Prevents conflicts
   ```

6. **Handle multiple related queries**:
   ```typescript
   // Cancel all related queries
   await queryClient.cancelQueries({ queryKey: queryKeys.entity.all });
   await queryClient.cancelQueries({ queryKey: queryKeys.entity.detail(id) });
   ```

7. **Use `setQueriesData` for multiple cache entries**:
   ```typescript
   // Update ALL filtered lists
   queryClient.setQueriesData<Entity[]>(
     { queryKey: queryKeys.entity.all },
     (old) => { /* update all matches */ }
   );
   ```

### ❌ DON'T

1. **Don't skip cancelQueries**:
   ```typescript
   // ❌ BAD - race condition possible
   onMutate: async (newData) => {
     queryClient.setQueryData(queryKeys.entity.all, ...);
   }

   // ✅ GOOD - no race
   onMutate: async (newData) => {
     await queryClient.cancelQueries({ queryKey: queryKeys.entity.all });
     queryClient.setQueryData(queryKeys.entity.all, ...);
   }
   ```

2. **Don't forget rollback context**:
   ```typescript
   // ❌ BAD - can't rollback
   onMutate: async (newData) => {
     await queryClient.cancelQueries({ queryKey: queryKeys.entity.all });
     queryClient.setQueryData(...);
     // Missing return statement!
   }

   // ✅ GOOD - can rollback
   onMutate: async (newData) => {
     await queryClient.cancelQueries({ queryKey: queryKeys.entity.all });
     const previousData = queryClient.getQueryData(...);
     queryClient.setQueryData(...);
     return { previousData };  // ✅ Return for rollback
   }
   ```

3. **Don't use same ID for optimistic and real data**:
   ```typescript
   // ❌ BAD - ID conflict
   id: newData.id  // Might conflict with existing ID

   // ✅ GOOD - unique temp ID
   id: `temp-${Date.now()}`
   ```

4. **Don't enable refetchOnWindowFocus globally**:
   - Only enable for critical data that MUST be fresh
   - Use WebSocket for real-time updates instead

5. **Don't use staleTime: 0 everywhere**:
   - Causes excessive refetches
   - Defeats purpose of caching
   - Only use for time-critical data

---

## Query Key Organization

**File**: `frontend/src/hooks/queries/queryKeys.ts`

All query keys follow a hierarchical structure:

```typescript
export const queryKeys = {
  users: {
    all: ['users'],                          // All users queries
    list: (filters) => ['users', filters],   // Filtered users
    detail: (id) => ['users', id],           // Single user
  },

  branches: {
    all: ['branches'],
    list: (filters) => ['branches', filters],
    detail: (id) => ['branches', id],
  },

  transactions: {
    all: ['transactions'],
    list: (filters) => ['transactions', filters],
    detail: (id) => ['transactions', id],
    summary: (branchId, dates) => ['transactions', 'summary', branchId, dates],
  },

  // ...etc for all entities
};
```

**Benefits**:
- Type-safe query keys
- Easy invalidation patterns
- Consistent naming across app
- Prevents typos

---

## Concurrent Request Scenarios

### Scenario 1: User Creates Transaction While List is Loading

**Flow**:
1. User navigates to transactions page → `useTransactions()` starts fetching
2. Before fetch completes, user clicks "Create Transaction"
3. `useCreateTransaction.mutate()` is called

**Handling**:
```typescript
onMutate: async (newTransaction) => {
  // ✅ Cancel the inflight fetch
  await queryClient.cancelQueries({ queryKey: queryKeys.transactions.all });

  // ✅ Optimistically add to cache
  queryClient.setQueryData(queryKeys.transactions.all, (old) => {
    // old might be undefined if fetch was cancelled
    if (!old) return old;
    return { ...old, data: [tempTransaction, ...old.data] };
  });
}
```

**Result**: No race - inflight fetch is cancelled, optimistic update shows immediately

### Scenario 2: Multiple Users Update Same Entity

**Flow**:
1. User A loads branch list
2. User B updates branch X (name change)
3. User A's cache is now stale

**Handling**:
- **WebSocket**: Real-time update invalidates User A's cache
- **staleTime**: After 5 minutes, cache marked stale, refetch on next access
- **Manual Refresh**: User A can click refresh button

**Code**:
```typescript
// WebSocket listener (in useRealtimeSync hook)
socket.on('branch:updated', (branchId) => {
  queryClient.invalidateQueries({
    queryKey: queryKeys.branches.all
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.branches.detail(branchId)
  });
});
```

### Scenario 3: Rapid Deletes

**Flow**:
1. User selects 3 items to delete
2. Clicks delete on all 3 rapidly
3. 3 mutations fire concurrently

**Handling**:
```typescript
// Each mutation runs independently
onMutate: async (deletedId) => {
  // Each one cancels and snapshots independently
  await queryClient.cancelQueries({ queryKey: queryKeys.entity.all });
  const previousData = queryClient.getQueryData(queryKeys.entity.all);

  // Each one removes its item
  queryClient.setQueryData(queryKeys.entity.all, (old) =>
    old.filter((item) => item.id !== deletedId)
  );

  return { previousData };
},

onError: (error, deletedId, context) => {
  // Each one can rollback independently if it fails
  if (context?.previousData) {
    queryClient.setQueryData(queryKeys.entity.all, context.previousData);
  }
}
```

**Result**: All 3 items removed optimistically, any failures roll back individually

---

## Testing Recommendations

### Unit Tests

```typescript
describe('useCreateUser', () => {
  it('should cancel queries before optimistic update', async () => {
    const { result } = renderHook(() => useCreateUser(), {
      wrapper: createQueryWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync(newUser);
    });

    expect(queryClient.cancelQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.users.all,
    });
  });

  it('should rollback on error', async () => {
    // Mock error
    server.use(
      rest.post('/api/users', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );

    const { result } = renderHook(() => useCreateUser(), {
      wrapper: createQueryWrapper(),
    });

    // Verify rollback happened
    // ...
  });
});
```

### Integration Tests

1. **Test concurrent mutations**
2. **Test optimistic updates**
3. **Test rollback on error**
4. **Test cache invalidation**
5. **Test staleTime behavior**

---

## Related Documentation

- [apiClient.401-handling.md](../api/apiClient.401-handling.md) - 401 error handling
- [apiClient.test-plan.md](../api/apiClient.test-plan.md) - API testing
- [queryKeys.ts](./queries/queryKeys.ts) - Query key factory
- [React Query Docs](https://tanstack.com/query/latest/docs/react/overview)

---

## Configuration Summary Table

| Hook | Entity | staleTime | gcTime | retry | refetchOnWindowFocus | Notes |
|------|--------|-----------|--------|-------|----------------------|-------|
| **useUsers** | Users | 5 min | 10 min | 1 | false (global) | Stable data |
| **useBranches** | Branches | 5 min | 10 min | 1 | false (global) | Stable data |
| **useTransactions** | Transactions | 2 min | 5 min | 1 | false (global) | Dynamic data |
| **useDebts** | Debts | 2 min | 5 min | 1 | false (global) | Dynamic data |
| **useInventory** | Inventory | 2 min | 5 min | 1 | false (global) | Dynamic data |

---

## Future Improvements

1. **Consider enabling refetchOnWindowFocus for**:
   - Notification count
   - User balance
   - Active session status

2. **Monitor staleTime effectiveness**:
   - Track how often users see stale data
   - Adjust based on usage patterns

3. **Add request deduplication**:
   - React Query already deduplicates by default
   - Monitor for any edge cases

4. **Implement query prefetching**:
   - Prefetch next page on pagination
   - Prefetch detail view on hover

5. **Add persistent query cache**:
   - Use `persistQueryClient` for offline support
   - Cache queries to localStorage/IndexedDB
