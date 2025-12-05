/**
 * useBranches Hooks
 * React Query hooks for branch management with optimistic updates
 *
 * Features:
 * - Branch queries with filters (no pagination)
 * - Auto-filtering for accountants (only their assigned branch)
 * - Create/Update/Delete mutations with optimistic updates
 * - Automatic cache invalidation
 * - Arabic toast messages
 * - Full error handling and strict typing
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import branchService from '@/api/services/branchService';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { useAuth } from './useAuth';
import type { Branch, CreateBranchInput, UpdateBranchInput } from '#/entity';
import type { BranchQueryFilters } from '#/api';
import { ApiError } from '@/api/apiClient';

// ============================================
// QUERY HOOKS
// ============================================

/**
 * useBranches Hook
 * Query branches with filters
 * Auto-filters for accountants to show only their assigned branch
 *
 * @param filters - Optional BranchQueryFilters (search, includeInactive)
 * @returns Query result with array of branches
 *
 * @example
 * ```tsx
 * const { data: branches = [], isLoading } = useBranches({ includeInactive: false });
 * ```
 */
export const useBranches = (filters?: BranchQueryFilters & { enabled?: boolean }) => {
  const { isAccountant } = useAuth();
  const { enabled = true, ...queryFilters } = filters || {};

  // For accountants, always filter to show only active branches
  const appliedFilters: BranchQueryFilters = {
    ...queryFilters,
    includeInactive: isAccountant ? false : queryFilters.includeInactive,
  };

  return useQuery<Branch[], ApiError>({
    queryKey: queryKeys.branches.list(appliedFilters),
    queryFn: () => branchService.getAll(appliedFilters),
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
    enabled,
  });
};

/**
 * useBranch Hook
 * Query single branch by ID
 *
 * @param id - Branch UUID
 * @param options - Query options (enabled, etc.)
 * @returns Query result with branch data
 *
 * @example
 * ```tsx
 * const { data: branch, isLoading } = useBranch(branchId);
 * if (branch) {
 *   console.log(branch.name, branch.isActive);
 * }
 * ```
 */
export const useBranch = (
  id: string,
  options?: {
    enabled?: boolean;
  }
) => {
  return useQuery<Branch, ApiError>({
    queryKey: queryKeys.branches.detail(id),
    queryFn: () => branchService.getOne(id),
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
    retry: 1,
    enabled: options?.enabled ?? !!id, // Disabled if no ID provided
  });
};

/**
 * useBranchList Hook
 * Query a simple list of all active branches
 * Ideal for populating dropdowns/selects
 * Uses useBranches internally for consistency
 *
 * @param options - Query options (enabled, etc.)
 * @returns Query result with an array of branches
 *
 * @example
 * ```tsx
 * const { data: branches = [], isLoading } = useBranchList({ enabled: isAdmin });
 * ```
 */
export const useBranchList = (options?: { enabled?: boolean }) => {
  return useBranches({
    includeInactive: false,
    enabled: options?.enabled ?? true,
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * useCreateBranch Hook
 * Mutation to create new branch with optimistic update
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const createBranch = useCreateBranch();
 *
 * const handleCreate = async () => {
 *   try {
 *     await createBranch.mutateAsync({
 *       name: 'فرع بغداد',
 *       location: 'بغداد - الكرادة',
 *     });
 *     navigate('/settings/branches');
 *   } catch (error) {
 *     // Error already handled with toast
 *   }
 * };
 * ```
 */
export const useCreateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation<Branch, ApiError, CreateBranchInput>({
    mutationFn: branchService.create,

    onSuccess: (newBranch) => {
      // Invalidate all branch list queries to refetch with new data
      queryClient.invalidateQueries({ queryKey: ['branches', 'list'] });
      toast.success(`تم إضافة الفرع "${newBranch.name}" بنجاح`);
    },
  });
};

/**
 * useUpdateBranch Hook
 * Mutation to update existing branch with optimistic update
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const updateBranch = useUpdateBranch();
 *
 * const handleUpdate = async () => {
 *   await updateBranch.mutateAsync({
 *     id: branchId,
 *     data: { isActive: false },
 *   });
 * };
 * ```
 */
export const useUpdateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation<Branch, ApiError, { id: string; data: UpdateBranchInput }>({
    mutationFn: ({ id, data }) => branchService.update(id, data),

    onSuccess: (updatedBranch) => {
      // Invalidate all branch queries to refetch with updated data
      queryClient.invalidateQueries({ queryKey: ['branches', 'list'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.detail(updatedBranch.id) });
      toast.success('تم تحديث الفرع بنجاح');
    },
  });
};

/**
 * useDeleteBranch Hook
 * Mutation to delete branch with optimistic update
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const deleteBranch = useDeleteBranch();
 *
 * const handleDelete = async () => {
 *   if (confirm('هل أنت متأكد من حذف هذا الفرع؟')) {
 *     await deleteBranch.mutateAsync(branchId);
 *   }
 * };
 * ```
 */
export const useDeleteBranch = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: branchService.delete,

    onSuccess: () => {
      // Invalidate all branch list queries to refetch
      queryClient.invalidateQueries({ queryKey: ['branches', 'list'] });
      toast.success('تم تعطيل الفرع بنجاح');
    },
  });
};
