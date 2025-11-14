import { api } from './axios';
import type { UserWithBranch, CreateUserDto, UpdateUserDto } from '@/types';

export const usersService = {
  create: async (data: CreateUserDto): Promise<UserWithBranch> => {
    const response = await api.post('/users', data);
    return response.data;
  },

  getAll: async (): Promise<UserWithBranch[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  getOne: async (id: string): Promise<UserWithBranch> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  update: async (id: string, data: UpdateUserDto): Promise<UserWithBranch> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },

  assignBranch: async (userId: string, branchId: string | null): Promise<UserWithBranch> => {
    const response = await api.patch(`/users/${userId}/assign-branch`, { branchId });
    return response.data;
  },

  delete: async (id: string): Promise<UserWithBranch> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};
