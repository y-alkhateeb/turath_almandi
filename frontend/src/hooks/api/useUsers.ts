/**
 * useUsers Hooks
 * React Query hooks for user management with optimistic updates
 *
 * Features:
 * - User queries with filters (no pagination)
 * - Create/Update/Delete mutations with optimistic updates
 * - Automatic cache invalidation
 * - Arabic toast messages
 * - Full error handling and strict typing
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import userService from '@/api/services/userService';
import { queryKeys } from '@/hooks/queries/queryKeys';
import type { UserWithBranch, CreateUserInput, UpdateUserInput } from '#/entity';
import type { UserQueryFilters } from '#/api';
import { ApiError } from '@/api/apiClient';

// ============================================
// QUERY HOOKS
// ============================================

/**
 * useUsers Hook
 * Query users with filters
 *
 * @param filters - Optional UserQueryFilters (role, isActive, search)
 * @returns Query result with array of users
 *
 * @example
 * ```tsx
 * const { data: users = [], isLoading } = useUsers({ role: 'ACCOUNTANT' });
 * ```
 */
export const useUsers = (filters?: UserQueryFilters) => {
  return useQuery<UserWithBranch[], ApiError>({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => userService.getAll(filters),
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
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

  return useMutation<UserWithBranch, ApiError, CreateUserInput>({
    mutationFn: (data: CreateUserInput) => userService.create(data),

    onSuccess: () => {
      // Invalidate all user list queries to refetch with new data
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
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

  return useMutation<UserWithBranch, ApiError, { id: string; data: UpdateUserInput }>({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserInput }) =>
      userService.update(id, data),

    onSuccess: (updatedUser) => {
      // Invalidate all user queries to refetch with updated data
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(updatedUser.id) });
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

    onSuccess: () => {
      // Invalidate all user list queries to refetch
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
      toast.success('تم تعطيل المستخدم بنجاح');
    },
  });
};
