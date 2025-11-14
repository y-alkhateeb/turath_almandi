import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchesService } from '@/services/branches.service';
import type { Branch, CreateBranchInput, UpdateBranchInput } from '@/types';
import { toast } from '@/utils/toast';
import { useAuth } from './useAuth';

// Query keys
export const branchesKeys = {
  all: ['branches'] as const,
  detail: (id: string) => ['branches', id] as const,
};

/**
 * Hook to fetch all branches
 * For accountants, it filters to show only their assigned branch
 */
export const useBranches = () => {
  const { user, isAccountant } = useAuth();

  return useQuery({
    queryKey: branchesKeys.all,
    queryFn: async () => {
      const branches = await branchesService.getAll();

      // If user is accountant, filter to show only their assigned branch
      if (isAccountant() && user?.branchId) {
        return branches.filter(branch => branch.id === user.branchId);
      }

      return branches;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch a single branch
 */
export const useBranch = (id: string) => {
  return useQuery({
    queryKey: branchesKeys.detail(id),
    queryFn: () => branchesService.getOne(id),
    enabled: !!id,
  });
};

/**
 * Hook to create a new branch
 */
export const useCreateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBranchInput) => branchesService.create(data),
    onMutate: async (newBranch) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: branchesKeys.all });

      // Snapshot the previous value
      const previousBranches = queryClient.getQueryData<Branch[]>(branchesKeys.all);

      // Optimistically update to the new value
      if (previousBranches) {
        queryClient.setQueryData<Branch[]>(branchesKeys.all, (old = []) => [
          ...old,
          {
            id: 'temp-' + Date.now(),
            ...newBranch,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as Branch,
        ]);
      }

      return { previousBranches };
    },
    onError: (error: any, _newBranch, context) => {
      // Rollback on error
      if (context?.previousBranches) {
        queryClient.setQueryData(branchesKeys.all, context.previousBranches);
      }

      const message = error.response?.data?.message || 'حدث خطأ أثناء إضافة الفرع';
      toast.error(message);
    },
    onSuccess: () => {
      toast.success('تم إضافة الفرع بنجاح');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: branchesKeys.all });
    },
  });
};

/**
 * Hook to update an existing branch
 */
export const useUpdateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBranchInput }) =>
      branchesService.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: branchesKeys.all });

      // Snapshot the previous value
      const previousBranches = queryClient.getQueryData<Branch[]>(branchesKeys.all);

      // Optimistically update to the new value
      if (previousBranches) {
        queryClient.setQueryData<Branch[]>(branchesKeys.all, (old = []) =>
          old.map((branch) =>
            branch.id === id
              ? { ...branch, ...data, updatedAt: new Date().toISOString() }
              : branch
          )
        );
      }

      return { previousBranches };
    },
    onError: (error: any, _variables, context) => {
      // Rollback on error
      if (context?.previousBranches) {
        queryClient.setQueryData(branchesKeys.all, context.previousBranches);
      }

      const message = error.response?.data?.message || 'حدث خطأ أثناء تحديث الفرع';
      toast.error(message);
    },
    onSuccess: () => {
      toast.success('تم تحديث الفرع بنجاح');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: branchesKeys.all });
    },
  });
};

/**
 * Hook to delete a branch
 */
export const useDeleteBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => branchesService.delete(id),
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: branchesKeys.all });

      // Snapshot the previous value
      const previousBranches = queryClient.getQueryData<Branch[]>(branchesKeys.all);

      // Optimistically update to the new value
      if (previousBranches) {
        queryClient.setQueryData<Branch[]>(branchesKeys.all, (old = []) =>
          old.filter((branch) => branch.id !== deletedId)
        );
      }

      return { previousBranches };
    },
    onError: (error: any, _deletedId, context) => {
      // Rollback on error
      if (context?.previousBranches) {
        queryClient.setQueryData(branchesKeys.all, context.previousBranches);
      }

      const message = error.response?.data?.message || 'حدث خطأ أثناء حذف الفرع';
      toast.error(message);
    },
    onSuccess: () => {
      toast.success('تم حذف الفرع بنجاح');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: branchesKeys.all });
    },
  });
};
