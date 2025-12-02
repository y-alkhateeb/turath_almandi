/**
 * useBranches Hooks
 * React Query hooks for branch management with optimistic updates
 *
 * Features:
 * - Branch queries with isActive filtering
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
 * Query branches with optional isActive filtering
 * Auto-filters for accountants to show only their assigned branch
 *
 * @param options - Query options
 * @param options.isActive - Optional filter for active branches (default: true for accountants, undefined for admins)
 * @param options.enabled - Optional flag to enable/disable the query (default: true)
 * @returns Query result with branches array
 *
 * @example
 * ```tsx
 * // Get all active branches (default for accountants)
 * const { data: branches, isLoading } = useBranches();
 *
 * // Get all branches including inactive (admins only)
 * const { data: allBranches } = useBranches({ isActive: undefined });
 *
 * // Get only active branches explicitly
 * const { data: activeBranches } = useBranches({ isActive: true });
 *
 * // Conditionally fetch branches (e.g., only for admins)
 * const { data: branches } = useBranches({ enabled: isAdmin });
 * ```
 */
export const useBranches = (options?: { isActive?: boolean; enabled?: boolean }) => {
  const { user, isAccountant } = useAuth();

  // For accountants, default to showing only active branches
  // For admins, default to showing all branches
  const includeInactive = isAccountant
    ? options?.isActive === undefined
      ? false
      : !options.isActive
    : options?.isActive === undefined
      ? true
      : !options.isActive;

  const filters: BranchQueryFilters = {
    includeInactive,
  };

  return useQuery<Branch[], ApiError>({
    queryKey: queryKeys.branches.list(filters),
    queryFn: async () => {
      const branches = await branchService.getAll(filters);

      // If user is accountant, filter to show only their assigned branch
      // This is a client-side filter in addition to server-side filtering
      if (isAccountant && user?.branchId) {
        return branches.filter((branch) => branch.id === user.branchId);
      }

      return branches;
    },
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
    retry: 1, // Only retry once on failure
    enabled: options?.enabled ?? true, // Default to enabled
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
 *     navigate('/branches');
 *   } catch (error) {
 *     // Error already handled with toast
 *   }
 * };
 * ```
 */
export const useCreateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation<Branch, ApiError, CreateBranchInput, { previousBranches?: [any, Branch[] | undefined][] }>({
    mutationFn: branchService.create,

    // Optimistic update
    onMutate: async (newBranch) => {
      // Cancel outgoing queries to avoid race conditions
      await queryClient.cancelQueries({ queryKey: queryKeys.branches.all });

      // Snapshot current data for rollback
      const previousBranches = queryClient.getQueriesData<Branch[]>({
        queryKey: queryKeys.branches.all,
      });

      // Optimistically update all branch lists
      queryClient.setQueriesData<Branch[]>({ queryKey: queryKeys.branches.all }, (old) => {
        if (!old) return old;

        // Create temporary branch with optimistic ID
        const tempBranch: Branch = {
          id: `temp-${Date.now()}`,
          name: newBranch.name,
          location: newBranch.location,
          managerName: newBranch.managerName,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return [tempBranch, ...old];
      });

      return { previousBranches };
    },

    onError: (_error, _newBranch, context) => {
      // Rollback on error
      if (context?.previousBranches) {
        context.previousBranches.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Note: Error toast shown by global API interceptor
    },

    onSuccess: (newBranch) => {
      // Invalidate and refetch all branch queries
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });

      // Show success toast
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

  return useMutation<
    Branch,
    ApiError,
    { id: string; data: UpdateBranchInput },
    { previousBranch?: Branch; previousBranches?: [any, Branch[] | undefined][] }
  >({
    mutationFn: ({ id, data }) => branchService.update(id, data),

    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.branches.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.branches.detail(id) });

      // Snapshot current data
      const previousBranch = queryClient.getQueryData<Branch>(queryKeys.branches.detail(id));
      const previousBranches = queryClient.getQueriesData<Branch[]>({
        queryKey: queryKeys.branches.all,
      });

      // Optimistically update branch detail
      queryClient.setQueryData<Branch>(queryKeys.branches.detail(id), (old) => {
        if (!old) return old;
        return { ...old, ...data, updatedAt: new Date().toISOString() };
      });

      // Optimistically update branch in all lists
      queryClient.setQueriesData<Branch[]>({ queryKey: queryKeys.branches.all }, (old) => {
        if (!old) return old;

        return old.map((branch) =>
          branch.id === id ? { ...branch, ...data, updatedAt: new Date().toISOString() } : branch
        );
      });

      return { previousBranch, previousBranches };
    },

    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousBranch) {
        queryClient.setQueryData(queryKeys.branches.detail(id), context.previousBranch);
      }
      if (context?.previousBranches) {
        context.previousBranches.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Note: Error toast shown by global API interceptor
    },

    onSuccess: (updatedBranch) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.branches.detail(updatedBranch.id),
      });

      // Show success toast
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

  return useMutation<
    void,
    ApiError,
    string,
    { previousBranch?: Branch; previousBranches?: [any, Branch[] | undefined][] }
  >({
    mutationFn: branchService.delete,

    // Optimistic update - Backend does soft delete (sets isActive = false)
    // So we update isActive instead of removing the branch
    onMutate: async (deletedId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.branches.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.branches.detail(deletedId) });

      // Snapshot current data
      const previousBranch = queryClient.getQueryData<Branch>(queryKeys.branches.detail(deletedId));
      const previousBranches = queryClient.getQueriesData<Branch[]>({
        queryKey: queryKeys.branches.all,
      });

      // Optimistically update isActive to false (soft delete)
      queryClient.setQueriesData<Branch[]>({ queryKey: queryKeys.branches.all }, (old) => {
        if (!old) return old;
        return old.map((branch) =>
          branch.id === deletedId
            ? { ...branch, isActive: false, updatedAt: new Date().toISOString() }
            : branch
        );
      });

      // Update branch detail cache
      queryClient.setQueryData<Branch>(queryKeys.branches.detail(deletedId), (old) => {
        if (!old) return old;
        return { ...old, isActive: false, updatedAt: new Date().toISOString() };
      });

      return { previousBranch, previousBranches };
    },

    onError: (_error, deletedId, context) => {
      // Rollback on error
      if (context?.previousBranch) {
        queryClient.setQueryData(queryKeys.branches.detail(deletedId), context.previousBranch);
      }
      if (context?.previousBranches) {
        context.previousBranches.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Note: Error toast shown by global API interceptor
    },

    onSuccess: () => {
      // Invalidate all branch queries
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });

      // Show success toast - Changed from "deleted" to "deactivated" since it's soft delete
      toast.success('تم تعطيل الفرع بنجاح');
    },
  });
};

// ============================================
// HELPER HOOKS
// ============================================

/**
 * useActiveBranches Hook
 * Query only active branches (convenience hook)
 *
 * @returns Query result with active branches
 */
export const useActiveBranches = () => {
  return useBranches({ isActive: true });
};

/**
 * useAllBranches Hook
 * Query all branches including inactive (convenience hook)
 * Admin only - accountants always see only their branch
 *
 * @returns Query result with all branches
 */
export const useAllBranches = () => {
  return useBranches({ isActive: undefined });
};
