import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/services/users.service';
import type { UserWithBranch, CreateUserDto, UpdateUserDto } from '@/types';
import { toast } from '@/utils/toast';

// Query keys
export const usersKeys = {
  all: ['users'] as const,
  detail: (id: string) => ['users', id] as const,
};

/**
 * Hook to fetch all users
 */
export const useUsers = () => {
  return useQuery({
    queryKey: usersKeys.all,
    queryFn: () => usersService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch a single user
 */
export const useUser = (id: string) => {
  return useQuery({
    queryKey: usersKeys.detail(id),
    queryFn: () => usersService.getOne(id),
    enabled: !!id,
  });
};

/**
 * Hook to create a new user
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserDto) => usersService.create(data),
    onMutate: async (newUser) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: usersKeys.all });

      // Snapshot the previous value
      const previousUsers = queryClient.getQueryData<UserWithBranch[]>(usersKeys.all);

      // Optimistically update to the new value
      if (previousUsers) {
        queryClient.setQueryData<UserWithBranch[]>(usersKeys.all, (old = []) => [
          {
            id: 'temp-' + Date.now(),
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
    onError: (error: any, _newUser, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        queryClient.setQueryData(usersKeys.all, context.previousUsers);
      }

      const message = error.response?.data?.message || 'حدث خطأ أثناء إضافة المستخدم';
      toast.error(message);
    },
    onSuccess: () => {
      toast.success('تم إضافة المستخدم بنجاح');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
};

/**
 * Hook to update an existing user
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      usersService.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: usersKeys.all });

      // Snapshot the previous value
      const previousUsers = queryClient.getQueryData<UserWithBranch[]>(usersKeys.all);

      // Optimistically update to the new value
      if (previousUsers) {
        queryClient.setQueryData<UserWithBranch[]>(usersKeys.all, (old = []) =>
          old.map((user) =>
            user.id === id
              ? { ...user, ...data, updatedAt: new Date().toISOString() }
              : user
          )
        );
      }

      return { previousUsers };
    },
    onError: (error: any, _variables, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        queryClient.setQueryData(usersKeys.all, context.previousUsers);
      }

      const message = error.response?.data?.message || 'حدث خطأ أثناء تحديث المستخدم';
      toast.error(message);
    },
    onSuccess: () => {
      toast.success('تم تحديث المستخدم بنجاح');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
};

/**
 * Hook to delete a user (soft delete)
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersService.delete(id),
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: usersKeys.all });

      // Snapshot the previous value
      const previousUsers = queryClient.getQueryData<UserWithBranch[]>(usersKeys.all);

      // Optimistically update to the new value (mark as inactive)
      if (previousUsers) {
        queryClient.setQueryData<UserWithBranch[]>(usersKeys.all, (old = []) =>
          old.map((user) =>
            user.id === deletedId
              ? { ...user, isActive: false, updatedAt: new Date().toISOString() }
              : user
          )
        );
      }

      return { previousUsers };
    },
    onError: (error: any, _deletedId, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        queryClient.setQueryData(usersKeys.all, context.previousUsers);
      }

      const message = error.response?.data?.message || 'حدث خطأ أثناء حذف المستخدم';
      toast.error(message);
    },
    onSuccess: () => {
      toast.success('تم تعطيل المستخدم بنجاح');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
};
