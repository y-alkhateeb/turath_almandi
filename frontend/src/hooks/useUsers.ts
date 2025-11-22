/**
 * useUsers Hooks
 * React Query hooks for user management with optimistic updates
 *
 * Features:
 * - User queries
 * - Create/Update/Delete mutations with optimistic updates
 * - Automatic cache invalidation
 * - Arabic toast messages
 * - Full error handling and strict typing
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import userService from '@/api/services/userService';
import { queryKeys } from '@/hooks/queries/queryKeys';
import type { UserWithBranch, CreateUserDto, UpdateUserDto } from '@/types';
import { ApiError } from '@/api/apiClient';

// ============================================
// QUERY HOOKS
// ============================================

/**
 * useUsers Hook
 * Query all users
 *
 * @returns Query result with users array
 *
 * @example
 * ```tsx
 * const { data: users, isLoading } = useUsers();
 * ```
 */
export const useUsers = () => {
  return useQuery<UserWithBranch[], ApiError>({
    queryKey: queryKeys.users.all,
    queryFn: () => userService.getAllUnpaginated(),
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
    retry: 1,
  });
};

/**
 * useUser Hook
 * Query single user by ID
 *
 * @param id - User UUID
 * @returns Query result with user data
 *
 * @example
 * ```tsx
 * const { data: user, isLoading } = useUser(userId);
 * ```
 */
export const useUser = (id: string) => {
  return useQuery<UserWithBranch, ApiError>({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => userService.getOne(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * useCreateUser Hook
 * Mutation to create new user with optimistic update
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const createUser = useCreateUser();
 *
 * const handleCreate = async () => {
 *   try {
 *     await createUser.mutateAsync({
 *       username: 'user1',
 *       password: 'password123',
 *       role: 'ACCOUNTANT',
 *       branchId: 'branch-id',
 *     });
 *   } catch (error) {
 *     // Error already handled with toast
 *   }
 * };
 * ```
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<UserWithBranch, ApiError, CreateUserDto>({
    mutationFn: (data: CreateUserDto) => userService.create(data),

    // Optimistic update
    onMutate: async (newUser) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });

      // Snapshot current data
      const previousUsers = queryClient.getQueryData<UserWithBranch[]>(queryKeys.users.all);

      // Optimistically add new user with temp ID
      if (previousUsers) {
        queryClient.setQueryData<UserWithBranch[]>(queryKeys.users.all, (old = []) => [
          {
            id: `temp-${Date.now()}`,
            username: newUser.username,
            role: newUser.role,
            branchId: newUser.branchId || null,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            branch: null,
          } as UserWithBranch,
          ...old,
        ]);
      }

      return { previousUsers };
    },

    onError: (_error, _newUser, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        queryClient.setQueryData(queryKeys.users.all, context.previousUsers);
      }

      // Note: Error toast shown by global API interceptor
    },

    onSuccess: () => {
      // Invalidate users query
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });

      // Show success toast
      toast.success('تم إضافة المستخدم بنجاح');
    },
  });
};

/**
 * useUpdateUser Hook
 * Mutation to update existing user with optimistic update
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const updateUser = useUpdateUser();
 *
 * const handleUpdate = async () => {
 *   await updateUser.mutateAsync({
 *     id: userId,
 *     data: { role: 'ADMIN' },
 *   });
 * };
 * ```
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<UserWithBranch, ApiError, { id: string; data: UpdateUserDto }>({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      userService.update(id, data),

    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.users.detail(id) });

      // Snapshot current data
      const previousUser = queryClient.getQueryData<UserWithBranch>(queryKeys.users.detail(id));
      const previousUsers = queryClient.getQueryData<UserWithBranch[]>(queryKeys.users.all);

      // Optimistically update user detail
      queryClient.setQueryData<UserWithBranch>(queryKeys.users.detail(id), (old) => {
        if (!old) return old;
        return { ...old, ...data, updatedAt: new Date().toISOString() };
      });

      // Optimistically update user in list
      if (previousUsers) {
        queryClient.setQueryData<UserWithBranch[]>(queryKeys.users.all, (old = []) =>
          old.map((user) =>
            user.id === id ? { ...user, ...data, updatedAt: new Date().toISOString() } : user
          )
        );
      }

      return { previousUser, previousUsers };
    },

    onError: (_error, { id }, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(queryKeys.users.detail(id), context.previousUser);
      }
      if (context?.previousUsers) {
        queryClient.setQueryData(queryKeys.users.all, context.previousUsers);
      }

      // Note: Error toast shown by global API interceptor
    },

    onSuccess: (updatedUser) => {
      // Invalidate user queries
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.detail(updatedUser.id),
      });

      // Show success toast
      toast.success('تم تحديث المستخدم بنجاح');
    },
  });
};

/**
 * useDeleteUser Hook
 * Mutation to delete user (soft delete) with optimistic update
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const deleteUser = useDeleteUser();
 *
 * const handleDelete = async () => {
 *   if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
 *     await deleteUser.mutateAsync(userId);
 *   }
 * };
 * ```
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id: string) => userService.delete(id),

    // Optimistic update
    onMutate: async (deletedId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });

      // Snapshot current data
      const previousUsers = queryClient.getQueryData<UserWithBranch[]>(queryKeys.users.all);

      // Optimistically mark user as inactive (soft delete)
      if (previousUsers) {
        queryClient.setQueryData<UserWithBranch[]>(queryKeys.users.all, (old = []) =>
          old.map((user) =>
            user.id === deletedId
              ? { ...user, isActive: false, updatedAt: new Date().toISOString() }
              : user
          )
        );
      }

      return { previousUsers };
    },

    onError: (_error, _deletedId, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        queryClient.setQueryData(queryKeys.users.all, context.previousUsers);
      }

      // Note: Error toast shown by global API interceptor
    },

    onSuccess: () => {
      // Invalidate users query
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });

      // Show success toast
      toast.success('تم تعطيل المستخدم بنجاح');
    },
  });
};
