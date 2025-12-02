/**
 * Inventory React Query Hooks
 * Hooks for fetching inventory items and consumption operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/apiClient';
import inventoryService from '@/api/services/inventoryService';
import type { InventoryUnit } from '#/enum';
import type {
  RecordConsumptionInput,
  InventoryConsumption,
  DailyConsumptionSummary,
  ConsumptionHistoryItem,
} from '#/entity';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: InventoryUnit;
  costPerUnit: number;
  sellingPrice: number | null;
  branchId: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

// ============================================
// QUERY KEYS
// ============================================

export const inventoryKeys = {
  all: ['inventory'] as const,
  items: (branchId?: string) => [...inventoryKeys.all, 'items', branchId] as const,
  consumption: {
    all: [...inventoryKeys.all, 'consumption'] as const,
    history: (id: string) => [...inventoryKeys.consumption.all, 'history', id] as const,
    daily: (date: string, branchId?: string) =>
      [...inventoryKeys.consumption.all, 'daily', date, branchId] as const,
  },
};

// ============================================
// INVENTORY ITEM QUERIES
// ============================================

/**
 * Fetch all inventory items (for dropdowns)
 */
export function useInventoryItems(branchId?: string) {
  return useQuery({
    queryKey: inventoryKeys.items(branchId),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);
      params.append('limit', '1000'); // Get all for dropdown

      const queryString = params.toString();
      const url = `/inventory?${queryString}`;

      return apiClient.get<PaginatedResponse<InventoryItem>>({ url });
    },
    select: (data) => data.data, // Return just the array
  });
}

// ============================================
// CONSUMPTION QUERIES & MUTATIONS (ADMIN ONLY)
// ============================================

/**
 * Get consumption history for a specific inventory item
 * GET /inventory/:id/consumption-history
 */
export function useConsumptionHistory(
  inventoryItemId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    enabled?: boolean;
  }
) {
  return useQuery<ConsumptionHistoryItem[]>({
    queryKey: inventoryKeys.consumption.history(inventoryItemId),
    queryFn: () =>
      inventoryService.getConsumptionHistory(
        inventoryItemId,
        options?.startDate,
        options?.endDate
      ),
    enabled: options?.enabled !== false && !!inventoryItemId,
  });
}

/**
 * Get daily consumption summary
 * GET /inventory/consumption/daily
 */
export function useDailyConsumption(
  date: string,
  branchId?: string,
  options?: { enabled?: boolean }
) {
  return useQuery<DailyConsumptionSummary>({
    queryKey: inventoryKeys.consumption.daily(date, branchId),
    queryFn: () => inventoryService.getDailyConsumption(date, branchId),
    enabled: options?.enabled !== false && !!date,
  });
}

/**
 * Record consumption/damage mutation
 * POST /inventory/:id/consume
 * Admin only
 */
export function useRecordConsumption() {
  const queryClient = useQueryClient();

  return useMutation<
    InventoryConsumption,
    Error,
    { inventoryItemId: string; data: RecordConsumptionInput }
  >({
    mutationFn: ({ inventoryItemId, data }) =>
      inventoryService.recordConsumption(inventoryItemId, data),
    onSuccess: (_data, variables) => {
      // Invalidate inventory items (quantity changed)
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      // Invalidate consumption history for this item
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.consumption.history(variables.inventoryItemId),
      });
      // Invalidate daily consumption summaries
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.consumption.all,
      });
    },
  });
}
