/**
 * useDiscountReasons Hooks
 * React Query hooks for discount reason management
 *
 * Features:
 * - Get all discount reasons (sorted by sortOrder)
 * - Create/Update/Delete mutations
 * - Auto-invalidation of cache
 * - Arabic toast messages
 * - Full error handling and strict typing
 */

import { useQuery, useMutation, useQueryClient } from '@tantml:query/react-query';
import { toast } from 'sonner';
import discountReasonService from '@/api/services/discountReasonService';
import { queryKeys } from '@/hooks/queries/queryKeys';
import type {
  DiscountReason,
  CreateDiscountReasonDto,
  UpdateDiscountReasonDto,
} from '@/api/services/discountReasonService';
import { ApiError } from '@/api/apiClient';

// ============================================
// QUERY HOOKS
// ============================================

/**
 * useDiscountReasons Hook
 * Query all discount reasons sorted by sortOrder and reason
 *
 * @returns Query result with discount reasons array
 *
 * @example
 * ```tsx
 * const { data: reasons, isLoading } = useDiscountReasons();
 * const defaultReasons = reasons?.filter(r => r.isDefault) || [];
 * ```
 */
export const useDiscountReasons = () => {
  return useQuery<DiscountReason[], ApiError>({
    queryKey: [queryKeys.discountReasons.all],
    queryFn: discountReasonService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes - reasons don't change often
  });
};

/**
 * useDiscountReason Hook
 * Query single discount reason by ID
 *
 * @param id - Discount reason UUID
 * @returns Query result with single discount reason
 *
 * @example
 * ```tsx
 * const { data: reason, isLoading } = useDiscountReason(id);
 * ```
 */
export const useDiscountReason = (id: string) => {
  return useQuery<DiscountReason, ApiError>({
    queryKey: [queryKeys.discountReasons.detail(id)],
    queryFn: () => discountReasonService.getById(id),
    enabled: !!id,
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * useCreateDiscountReason Hook
 * Create new discount reason mutation
 *
 * @returns Mutation object with mutate function
 *
 * @example
 * ```tsx
 * const { mutate: createReason, isPending } = useCreateDiscountReason();
 *
 * createReason({
 *   reason: 'خصم خاص',
 *   description: 'خصم للعملاء المميزين',
 *   isDefault: false,
 *   sortOrder: 10,
 * });
 * ```
 */
export const useCreateDiscountReason = () => {
  const queryClient = useQueryClient();

  return useMutation<DiscountReason, ApiError, CreateDiscountReasonDto>({
    mutationFn: discountReasonService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.discountReasons.all] });
      toast.success('تم إضافة سبب الخصم بنجاح');
    },
    onError: (error: ApiError) => {
      const message = error.response?.data?.message || 'فشل في إضافة سبب الخصم';
      toast.error(message);
    },
  });
};

/**
 * useUpdateDiscountReason Hook
 * Update existing discount reason mutation
 *
 * @returns Mutation object with mutate function
 *
 * @example
 * ```tsx
 * const { mutate: updateReason, isPending } = useUpdateDiscountReason();
 *
 * updateReason({
 *   id: 'uuid',
 *   data: { reason: 'خصم محدث' },
 * });
 * ```
 */
export const useUpdateDiscountReason = () => {
  const queryClient = useQueryClient();

  return useMutation<DiscountReason, ApiError, { id: string; data: UpdateDiscountReasonDto }>({
    mutationFn: ({ id, data }) => discountReasonService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.discountReasons.all] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.discountReasons.detail(id)] });
      toast.success('تم تحديث سبب الخصم بنجاح');
    },
    onError: (error: ApiError) => {
      const message = error.response?.data?.message || 'فشل في تحديث سبب الخصم';
      toast.error(message);
    },
  });
};

/**
 * useDeleteDiscountReason Hook
 * Delete (soft delete) discount reason mutation
 *
 * @returns Mutation object with mutate function
 *
 * @example
 * ```tsx
 * const { mutate: deleteReason, isPending } = useDeleteDiscountReason();
 *
 * deleteReason('uuid');
 * ```
 */
export const useDeleteDiscountReason = () => {
  const queryClient = useQueryClient();

  return useMutation<DiscountReason, ApiError, string>({
    mutationFn: discountReasonService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.discountReasons.all] });
      toast.success('تم حذف سبب الخصم بنجاح');
    },
    onError: (error: ApiError) => {
      const message = error.response?.data?.message || 'فشل في حذف سبب الخصم';
      toast.error(message);
    },
  });
};
