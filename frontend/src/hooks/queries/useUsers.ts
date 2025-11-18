/**
 * useUsers Hooks
 * React Query hooks for user management with optimistic updates
 *
 * Features:
 * - Paginated users query with filters
 * - Single user query
 * - Create/Update/Delete mutations with optimistic updates
 * - Automatic cache invalidation
 * - Arabic toast messages
 * - Full error handling and strict typing
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import userService from '@/api/services/userService';
import { queryKeys } from './queryKeys';
import type { User, CreateUserInput, UpdateUserInput } from '#/entity';
import type { PaginatedResponse, UserQueryFilters } from '#/api';
import { ApiError } from '@/api/apiClient';

// ============================================
// QUERY HOOKS
// ============================================

/**
 * useUsers Hook
 * Query paginated list of users with filters
 *
 * @param filters - Optional UserQueryFilters (role, branchId, isActive, page, limit)
 * @returns Query result with paginated users
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useUsers({ role: 'ADMIN', page: 1 });
 * const users = data?.data || [];
 * const totalPages = data?.meta.totalPages || 0;
 * ```
 */
export const useUsers = (filters?: UserQueryFilters) => {
  return useQuery<PaginatedResponse<User>, ApiError>({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => userService.getAll(filters),
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1, // Only retry once on failure
  });
};

/**
 * useUser Hook
 * Query single user by ID
 *
 * @param id - User UUID
 * @param options - Query options (enabled, etc.)
 * @returns Query result with user data
 *
 * @example
 * ```tsx
 * const { data: user, isLoading } = useUser(userId);
 * if (user) {
 *   console.log(user.username, user.role);
 * }
 * ```
 */
export const useUser = (
  id: string,
  options?: {
    enabled?: boolean;
  },
) => {
  return useQuery<User, ApiError>({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => userService.getOne(id),
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
    enabled: options?.enabled ?? true, // Can be disabled conditionally
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
 *       username: 'newuser',
 *       password: 'SecurePass123!',
 *       role: 'ACCOUNTANT',
 *       branchId: 'branch-id',
 *     });
 *     navigate('/users');
 *   } catch (error) {
 *     // Error already handled with toast
 *   }
 * };
 * ```
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<User, ApiError, CreateUserInput>({
    mutationFn: userService.create,

    // Optimistic update
    onMutate: async (newUser) => {
      // Cancel outgoing queries to avoid race conditions
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });

      // Snapshot current data for rollback
      const previousUsers = queryClient.getQueriesData<PaginatedResponse<User>>({
        queryKey: queryKeys.users.all,
      });

      // Optimistically update all user lists
      queryClient.setQueriesData<PaginatedResponse<User>>(
        { queryKey: queryKeys.users.all },
        (old) => {
          if (!old) return old;

          // Create temporary user with optimistic ID
          const tempUser: User = {
            id: `temp-${Date.now()}`,
            username: newUser.username,
            role: newUser.role,
            branchId: newUser.branchId || null,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          return {
            ...old,
            data: [tempUser, ...old.data],
            meta: {
              ...old.meta,
              total: old.meta.total + 1,
            },
          };
        },
      );

      return { previousUsers };
    },

    onError: (error, _newUser, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        context.previousUsers.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Show error toast
      if (error.statusCode === 409) {
        toast.error(''3E 'DE3*./E EH,H/ ('DA9D');
      } else if (error.statusCode === 400) {
        toast.error(''D1,'! 'D*-BB EF 'D(J'F'* 'DE/.D)');
      } else if (error.statusCode === 403) {
        toast.error('DJ3 D/JC 5D'-J) D%F4'! E3*./EJF');
      } else {
        toast.error('-/+ .7# #+F'! %F4'! 'DE3*./E');
      }
    },

    onSuccess: (newUser) => {
      // Invalidate and refetch all user queries
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });

      // Show success toast
      toast.success(`*E %F4'! 'DE3*./E "${newUser.username}" (F,'-`);
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
 *     data: { isActive: false },
 *   });
 * };
 * ```
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<
    User,
    ApiError,
    { id: string; data: UpdateUserInput }
  >({
    mutationFn: ({ id, data }) => userService.update(id, data),

    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.users.detail(id) });

      // Snapshot current data
      const previousUser = queryClient.getQueryData<User>(
        queryKeys.users.detail(id),
      );
      const previousUsers = queryClient.getQueriesData<PaginatedResponse<User>>({
        queryKey: queryKeys.users.all,
      });

      // Optimistically update user detail
      queryClient.setQueryData<User>(
        queryKeys.users.detail(id),
        (old) => {
          if (!old) return old;
          return { ...old, ...data, updatedAt: new Date().toISOString() };
        },
      );

      // Optimistically update user in all lists
      queryClient.setQueriesData<PaginatedResponse<User>>(
        { queryKey: queryKeys.users.all },
        (old) => {
          if (!old) return old;

          return {
            ...old,
            data: old.data.map((user) =>
              user.id === id
                ? { ...user, ...data, updatedAt: new Date().toISOString() }
                : user,
            ),
          };
        },
      );

      return { previousUser, previousUsers };
    },

    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(queryKeys.users.detail(id), context.previousUser);
      }
      if (context?.previousUsers) {
        context.previousUsers.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Show error toast
      if (error.statusCode === 404) {
        toast.error(''DE3*./E :J1 EH,H/');
      } else if (error.statusCode === 400) {
        toast.error(''D1,'! 'D*-BB EF 'D(J'F'* 'DE/.D)');
      } else if (error.statusCode === 403) {
        toast.error('DJ3 D/JC 5D'-J) D*9/JD 'DE3*./EJF');
      } else {
        toast.error('-/+ .7# #+F'! *-/J+ 'DE3*./E');
      }
    },

    onSuccess: (updatedUser) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.detail(updatedUser.id),
      });

      // Show success toast
      toast.success('*E *-/J+ 'DE3*./E (F,'-');
    },
  });
};

/**
 * useDeleteUser Hook
 * Mutation to delete user with optimistic update
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const deleteUser = useDeleteUser();
 *
 * const handleDelete = async () => {
 *   if (confirm('GD #F* E*#C/ EF -0A G0' 'DE3*./E')) {
 *     await deleteUser.mutateAsync(userId);
 *   }
 * };
 * ```
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: userService.delete,

    // Optimistic update
    onMutate: async (deletedId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });

      // Snapshot current data
      const previousUsers = queryClient.getQueriesData<PaginatedResponse<User>>({
        queryKey: queryKeys.users.all,
      });

      // Optimistically remove user from all lists
      queryClient.setQueriesData<PaginatedResponse<User>>(
        { queryKey: queryKeys.users.all },
        (old) => {
          if (!old) return old;

          return {
            ...old,
            data: old.data.filter((user) => user.id !== deletedId),
            meta: {
              ...old.meta,
              total: old.meta.total - 1,
            },
          };
        },
      );

      // Remove user detail from cache
      queryClient.removeQueries({
        queryKey: queryKeys.users.detail(deletedId),
      });

      return { previousUsers };
    },

    onError: (error, _deletedId, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        context.previousUsers.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Show error toast
      if (error.statusCode === 404) {
        toast.error(''DE3*./E :J1 EH,H/');
      } else if (error.statusCode === 409) {
        toast.error('D' JECF -0A 'DE3*./E D#FG E1*(7 (3,D'* #.1I');
      } else if (error.statusCode === 403) {
        toast.error('DJ3 D/JC 5D'-J) D-0A 'DE3*./EJF');
      } else {
        toast.error('-/+ .7# #+F'! -0A 'DE3*./E');
      }
    },

    onSuccess: () => {
      // Invalidate all user queries
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });

      // Show success toast
      toast.success('*E -0A 'DE3*./E (F,'-');
    },
  });
};

// ============================================
// HELPER HOOKS
// ============================================

/**
 * useActiveUsers Hook
 * Query only active users (convenience hook)
 *
 * @returns Query result with active users
 */
export const useActiveUsers = () => {
  return useUsers({ isActive: true });
};

/**
 * useAdminUsers Hook
 * Query only admin users (convenience hook)
 *
 * @returns Query result with admin users
 */
export const useAdminUsers = () => {
  return useUsers({ role: 'ADMIN' });
};

/**
 * useAccountantUsers Hook
 * Query only accountant users (convenience hook)
 *
 * @returns Query result with accountant users
 */
export const useAccountantUsers = () => {
  return useUsers({ role: 'ACCOUNTANT' });
};
