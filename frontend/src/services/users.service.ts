import { api } from './axios';

export interface User {
  id: string;
  username: string;
  role: 'ADMIN' | 'ACCOUNTANT';
  branchId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  branch?: {
    id: string;
    name: string;
    location: string;
  };
}

export const usersService = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  getOne: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },

  assignBranch: async (userId: string, branchId: string | null): Promise<User> => {
    const response = await api.patch(`/users/${userId}/assign-branch`, { branchId });
    return response.data;
  },
};
