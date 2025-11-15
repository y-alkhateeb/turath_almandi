import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../services/inventory.service';
import { toast } from '../utils/toast';
import type {
  InventoryItem,
  CreateInventoryInput,
  UpdateInventoryInput,
  InventoryFilters,
  PaginatedInventoryResponse,
} from '../types/inventory.types';

/**
 * Query Keys for Inventory
 * Centralized query key management for cache invalidation
 */
export const inventoryKeys = {
  all: ['inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: (filters?: InventoryFilters) => [...inventoryKeys.lists(), filters] as const,
  details: () => [...inventoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...inventoryKeys.details(), id] as const,
};

/**
 * Hook to fetch all inventory items with optional filters
 */
export const useInventory = (filters?: InventoryFilters) => {
  return useQuery({
    queryKey: inventoryKeys.list(filters),
    queryFn: () => inventoryService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch a single inventory item
 */
export const useInventoryItem = (id: string) => {
  return useQuery({
    queryKey: inventoryKeys.detail(id),
    queryFn: () => inventoryService.getOne(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to create a new inventory item (manual add)
 * Includes optimistic updates and cache invalidation
 */
export const useCreateInventory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInventoryInput) => inventoryService.create(data),

    onMutate: async (newItem) => {
      // Cancel any outgoing refetches to avoid optimistic update being overwritten
      await queryClient.cancelQueries({ queryKey: inventoryKeys.lists() });

      // Snapshot the previous value
      const previousInventory = queryClient.getQueryData<PaginatedInventoryResponse>(
        inventoryKeys.lists()
      );

      // Return context with snapshot for rollback
      return { previousInventory };
    },

    onError: (error: any, _newItem, context) => {
      // Rollback on error
      if (context?.previousInventory) {
        queryClient.setQueryData(
          inventoryKeys.lists(),
          context.previousInventory
        );
      }

      // Show error message
      const errorMessage =
        error?.response?.data?.message || 'حدث خطأ أثناء إضافة العنصر';
      toast.error(errorMessage, 4000);
    },

    onSuccess: () => {
      toast.success('تم إضافة العنصر إلى المخزون بنجاح');
    },

    onSettled: () => {
      // Refetch to ensure data is in sync with backend
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
};

/**
 * Hook to update an inventory item
 */
export const useUpdateInventory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInventoryInput }) =>
      inventoryService.update(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: inventoryKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: inventoryKeys.lists() });

      const previousItem = queryClient.getQueryData(inventoryKeys.detail(id));

      // Optimistically update the detail
      queryClient.setQueryData<InventoryItem>(
        inventoryKeys.detail(id),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            ...data,
            lastUpdated: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
      );

      return { previousItem, id };
    },

    onError: (error: any, _variables, context) => {
      if (context?.previousItem && context?.id) {
        queryClient.setQueryData(
          inventoryKeys.detail(context.id),
          context.previousItem
        );
      }

      const errorMessage =
        error?.response?.data?.message || 'حدث خطأ أثناء تحديث العنصر';
      toast.error(errorMessage, 4000);
    },

    onSuccess: () => {
      toast.success('تم تحديث العنصر بنجاح');
    },

    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
};

/**
 * Hook to delete an inventory item
 */
export const useDeleteInventory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => inventoryService.delete(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: inventoryKeys.lists() });

      const previousInventory = queryClient.getQueryData<PaginatedInventoryResponse>(
        inventoryKeys.lists()
      );

      return { previousInventory, id };
    },

    onError: (error: any, _id, context) => {
      if (context?.previousInventory) {
        queryClient.setQueryData(
          inventoryKeys.lists(),
          context.previousInventory
        );
      }

      const errorMessage =
        error?.response?.data?.message || 'حدث خطأ أثناء حذف العنصر';
      toast.error(errorMessage, 4000);
    },

    onSuccess: () => {
      toast.success('تم حذف العنصر بنجاح');
    },

    onSettled: (_data, _error, id) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
};
