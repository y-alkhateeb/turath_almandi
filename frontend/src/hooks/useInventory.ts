/**
 * useInventory Hooks
 * React Query hooks for inventory management with optimistic updates
 *
 * Features:
 * - Paginated inventory query with filters (unit, branch, search, autoAdded)
 * - Single inventory item query
 * - Create/Update/Delete mutations with optimistic updates
 * - Inventory value calculation query
 * - Auto-added item protection (read-only)
 * - Filter state management hook
 * - Automatic cache invalidation
 * - Arabic toast messages
 * - Full error handling and strict typing
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import inventoryService from '@/api/services/inventoryService';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { useAuth } from './useAuth';
import type { InventoryItem, CreateInventoryInput, UpdateInventoryInput } from '#/entity';
import type { PaginatedResponse, InventoryQueryFilters } from '#/api';
import { ApiError } from '@/api/apiClient';

// ============================================
// QUERY HOOKS
// ============================================

/**
 * useInventory Hook
 * Query paginated list of inventory items with filters
 *
 * @param filters - Optional InventoryQueryFilters (unit, branchId, search, autoAdded, page, limit)
 * @returns Query result with paginated inventory items
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useInventory({ search: 'سكر', page: 1 });
 * const items = data?.data || [];
 * const totalPages = data?.meta.totalPages || 0;
 * ```
 */
export const useInventory = (filters?: InventoryQueryFilters) => {
  const { user, isAccountant } = useAuth();

  // Auto-filter accountants to their branch
  const appliedFilters: InventoryQueryFilters = {
    ...filters,
    branchId: isAccountant && user?.branchId ? user.branchId : filters?.branchId,
  };

  return useQuery<PaginatedResponse<InventoryItem>, ApiError>({
    queryKey: queryKeys.inventory.list(appliedFilters),
    queryFn: () => inventoryService.getAll(appliedFilters),
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1, // Only retry once on failure
  });
};

/**
 * useInventoryItem Hook
 * Query single inventory item by ID
 *
 * @param id - InventoryItem UUID
 * @param options - Query options (enabled, etc.)
 * @returns Query result with inventory item data
 *
 * @example
 * ```tsx
 * const { data: item, isLoading } = useInventoryItem(itemId);
 * if (item) {
 *   console.log(item.name, item.quantity, item.autoAdded);
 * }
 * ```
 */
export const useInventoryItem = (
  id: string,
  options?: {
    enabled?: boolean;
  }
) => {
  return useQuery<InventoryItem, ApiError>({
    queryKey: queryKeys.inventory.detail(id),
    queryFn: () => inventoryService.getOne(id),
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
    enabled: options?.enabled ?? !!id, // Can be disabled conditionally
  });
};

/**
 * useInventoryValue Hook
 * Query total inventory value for a branch
 *
 * @param branchId - Optional branch UUID (admins only, accountants auto-filtered)
 * @returns Query result with total inventory value (number)
 *
 * @example
 * ```tsx
 * const { data: totalValue, isLoading } = useInventoryValue();
 * console.log(`إجمالي قيمة المخزون: ${totalValue} دينار`);
 * ```
 */
export const useInventoryValue = (branchId?: string) => {
  const { user, isAccountant } = useAuth();

  // Auto-filter accountants to their branch
  const appliedBranchId = isAccountant && user?.branchId ? user.branchId : branchId;

  return useQuery<number, ApiError>({
    queryKey: queryKeys.inventory.value(appliedBranchId),
    queryFn: () => inventoryService.getValue(appliedBranchId),
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
    retry: 1,
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * useCreateInventory Hook
 * Mutation to create new inventory item (manual add only)
 *
 * Note: Auto-added items are created automatically via transactions
 * This mutation is only for manually adding inventory items
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const createInventory = useCreateInventory();
 *
 * const handleCreate = async () => {
 *   try {
 *     await createInventory.mutateAsync({
 *       name: 'سكر',
 *       quantity: 50,
 *       unit: 'kg',
 *       costPerUnit: 1500,
 *       branchId: branchId,
 *     });
 *     navigate('/inventory');
 *   } catch (error) {
 *     // Error already handled with toast
 *   }
 * };
 * ```
 */
export const useCreateInventory = () => {
  const queryClient = useQueryClient();

  return useMutation<InventoryItem, ApiError, CreateInventoryInput>({
    mutationFn: inventoryService.create,

    // Optimistic update
    onMutate: async (newItem) => {
      // Cancel outgoing queries to avoid race conditions
      await queryClient.cancelQueries({ queryKey: queryKeys.inventory.all });

      // Snapshot current data for rollback
      const previousInventory = queryClient.getQueriesData<PaginatedResponse<InventoryItem>>({
        queryKey: queryKeys.inventory.all,
      });

      // Optimistically update all inventory lists
      queryClient.setQueriesData<PaginatedResponse<InventoryItem>>(
        { queryKey: queryKeys.inventory.all },
        (old) => {
          if (!old || !old.data) return old;

          // Create temporary item with optimistic ID
          const tempItem: InventoryItem = {
            id: `temp-${Date.now()}`,
            branchId: newItem.branchId || '',
            name: newItem.name,
            quantity: newItem.quantity,
            unit: newItem.unit,
            costPerUnit: newItem.costPerUnit,
            autoAdded: false, // Manual items are never auto-added
            lastUpdated: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
          };

          return {
            ...old,
            data: [tempItem, ...old.data],
            meta: {
              ...old.meta,
              total: old.meta.total + 1,
            },
          };
        }
      );

      return { previousInventory };
    },

    onError: (error, _newItem, context) => {
      // Rollback on error
      if (context?.previousInventory) {
        context.previousInventory.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Note: Error toast shown by global API interceptor
    },

    onSuccess: (newItem) => {
      // Invalidate and refetch all inventory queries
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });

      // Also invalidate inventory value
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.value(newItem.branchId),
      });

      // Show success toast
      toast.success(`تم إضافة "${newItem.name}" إلى المخزون بنجاح`);
    },
  });
};

/**
 * useUpdateInventory Hook
 * Mutation to update existing inventory item
 *
 * Note: Auto-added items should be read-only in most cases
 * Consider validating autoAdded flag before allowing updates
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const updateInventory = useUpdateInventory();
 *
 * const handleUpdate = async () => {
 *   // Check if item is auto-added
 *   if (item.autoAdded) {
 *     toast.error('لا يمكن تعديل العناصر المضافة تلقائياً');
 *     return;
 *   }
 *
 *   await updateInventory.mutateAsync({
 *     id: itemId,
 *     data: { quantity: 100 },
 *   });
 * };
 * ```
 */
export const useUpdateInventory = () => {
  const queryClient = useQueryClient();

  return useMutation<InventoryItem, ApiError, { id: string; data: UpdateInventoryInput }>({
    mutationFn: ({ id, data }) => inventoryService.update(id, data),

    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.inventory.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.inventory.detail(id) });

      // Snapshot current data
      const previousItem = queryClient.getQueryData<InventoryItem>(queryKeys.inventory.detail(id));
      const previousInventory = queryClient.getQueriesData<PaginatedResponse<InventoryItem>>({
        queryKey: queryKeys.inventory.all,
      });

      // Get old branchId for value invalidation
      const oldBranchId = previousItem?.branchId;

      // Optimistically update inventory item detail
      queryClient.setQueryData<InventoryItem>(queryKeys.inventory.detail(id), (old) => {
        if (!old) return old;
        return {
          ...old,
          ...data,
          lastUpdated: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      // Optimistically update inventory item in all lists
      queryClient.setQueriesData<PaginatedResponse<InventoryItem>>(
        { queryKey: queryKeys.inventory.all },
        (old) => {
          if (!old || !old.data) return old;

          return {
            ...old,
            data: old.data.map((item) =>
              item.id === id
                ? {
                    ...item,
                    ...data,
                    lastUpdated: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  }
                : item
            ),
          };
        }
      );

      return { previousItem, previousInventory, oldBranchId };
    },

    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousItem) {
        queryClient.setQueryData(queryKeys.inventory.detail(id), context.previousItem);
      }
      if (context?.previousInventory) {
        context.previousInventory.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Note: Error toast shown by global API interceptor
    },

    onSuccess: (updatedItem, _variables, context) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.detail(updatedItem.id),
      });

      // Invalidate inventory value for both old and new branch (if changed)
      if (context?.oldBranchId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.inventory.value(context.oldBranchId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.value(updatedItem.branchId),
      });

      // Show success toast
      toast.success('تم تحديث العنصر بنجاح');
    },
  });
};

/**
 * useDeleteInventory Hook
 * Mutation to delete inventory item
 *
 * Note: Auto-added items should typically not be deletable
 * Backend may prevent deletion of items with consumption history
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const deleteInventory = useDeleteInventory();
 *
 * const handleDelete = async () => {
 *   // Check if item is auto-added
 *   if (item.autoAdded) {
 *     toast.error('لا يمكن حذف العناصر المضافة تلقائياً');
 *     return;
 *   }
 *
 *   if (confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
 *     await deleteInventory.mutateAsync(itemId);
 *   }
 * };
 * ```
 */
export const useDeleteInventory = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: inventoryService.delete,

    // Optimistic update
    onMutate: async (deletedId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.inventory.all });

      // Get the item before deletion for branchId
      const deletedItem = queryClient.getQueryData<InventoryItem>(
        queryKeys.inventory.detail(deletedId)
      );

      // Snapshot current data
      const previousInventory = queryClient.getQueriesData<PaginatedResponse<InventoryItem>>({
        queryKey: queryKeys.inventory.all,
      });

      // Optimistically remove item from all lists
      queryClient.setQueriesData<PaginatedResponse<InventoryItem>>(
        { queryKey: queryKeys.inventory.all },
        (old) => {
          if (!old || !old.data) return old;

          return {
            ...old,
            data: old.data.filter((item) => item.id !== deletedId),
            meta: {
              ...old.meta,
              total: old.meta.total - 1,
            },
          };
        }
      );

      // Remove item detail from cache
      queryClient.removeQueries({
        queryKey: queryKeys.inventory.detail(deletedId),
      });

      return { previousInventory, deletedItem };
    },

    onError: (error, _deletedId, context) => {
      // Rollback on error
      if (context?.previousInventory) {
        context.previousInventory.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Note: Error toast shown by global API interceptor
    },

    onSuccess: (_data, _deletedId, context) => {
      // Invalidate all inventory queries
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });

      // Invalidate inventory value for the deleted item's branch
      if (context?.deletedItem?.branchId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.inventory.value(context.deletedItem.branchId),
        });
      }

      // Show success toast
      toast.success('تم حذف العنصر بنجاح');
    },
  });
};

// ============================================
// FILTER STATE MANAGEMENT HOOK
// ============================================

/**
 * useInventoryFilters Hook
 * Custom hook for managing inventory filter state
 *
 * Provides convenient methods for updating filters:
 * - setFilters: Update multiple filters at once
 * - setFilter: Update a single filter
 * - resetFilters: Reset to initial state
 * - setUnit: Convenience method for unit filter
 * - setBranchId: Convenience method for branch filter
 * - setSearch: Convenience method for search filter
 * - setAutoAdded: Convenience method for autoAdded filter
 * - setPage: Update page (for pagination)
 * - setLimit: Update limit (resets page to 1)
 *
 * @param initialFilters - Optional initial filter state
 * @returns Object with filters and setter methods
 *
 * @example
 * ```tsx
 * function InventoryList() {
 *   const {
 *     filters,
 *     setSearch,
 *     setUnit,
 *     setAutoAdded,
 *     setPage,
 *     resetFilters,
 *   } = useInventoryFilters();
 *
 *   const { data, isLoading } = useInventory(filters);
 *
 *   return (
 *     <div>
 *       <input
 *         value={filters.search || ''}
 *         onChange={(e) => setSearch(e.target.value)}
 *         placeholder="بحث..."
 *       />
 *       <select
 *         value={filters.unit || ''}
 *         onChange={(e) => setUnit(e.target.value)}
 *       >
 *         <option value="">جميع الوحدات</option>
 *         <option value="kg">كيلوغرام</option>
 *         <option value="liter">لتر</option>
 *       </select>
 *       <button onClick={() => setAutoAdded(false)}>
 *         يدوي فقط
 *       </button>
 *       <button onClick={() => setAutoAdded(true)}>
 *         تلقائي فقط
 *       </button>
 *       <button onClick={resetFilters}>مسح الفلاتر</button>
 *       {data && <InventoryTable items={data.data} />}
 *       <Pagination
 *         currentPage={filters.page || 1}
 *         totalPages={data?.meta.totalPages || 0}
 *         onPageChange={setPage}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export const useInventoryFilters = (initialFilters?: Partial<InventoryQueryFilters>) => {
  const [filters, setFiltersState] = useState<InventoryQueryFilters>(initialFilters || {});

  const setFilters = useCallback((newFilters: Partial<InventoryQueryFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const setFilter = useCallback(
    <K extends keyof InventoryQueryFilters>(key: K, value: InventoryQueryFilters[K]) => {
      setFiltersState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFiltersState(initialFilters || {});
  }, [initialFilters]);

  const setUnit = useCallback((unit: string | undefined) => {
    setFiltersState((prev) => ({ ...prev, unit, page: 1 }));
  }, []);

  const setBranchId = useCallback((branchId: string | undefined) => {
    setFiltersState((prev) => ({ ...prev, branchId, page: 1 }));
  }, []);

  const setSearch = useCallback((search: string | undefined) => {
    setFiltersState((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  const setAutoAdded = useCallback((autoAdded: boolean | undefined) => {
    setFiltersState((prev) => ({ ...prev, autoAdded, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFiltersState((prev) => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setFiltersState((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  return {
    filters,
    setFilters,
    setFilter,
    resetFilters,
    setUnit,
    setBranchId,
    setSearch,
    setAutoAdded,
    setPage,
    setLimit,
  };
};

// ============================================
// HELPER HOOKS
// ============================================

/**
 * useManualInventory Hook
 * Query only manually added inventory items (convenience hook)
 *
 * @param filters - Optional additional filters
 * @returns Query result with manually added items
 */
export const useManualInventory = (filters?: Omit<InventoryQueryFilters, 'autoAdded'>) => {
  return useInventory({ ...filters, autoAdded: false });
};

/**
 * useAutoInventory Hook
 * Query only auto-added inventory items (convenience hook)
 *
 * @param filters - Optional additional filters
 * @returns Query result with auto-added items
 */
export const useAutoInventory = (filters?: Omit<InventoryQueryFilters, 'autoAdded'>) => {
  return useInventory({ ...filters, autoAdded: true });
};
