import { api } from './axios';
import type { Branch, CreateBranchInput, UpdateBranchInput } from '@/types/branches.types';

export const branchesService = {
  getAll: async (): Promise<Branch[]> => {
    const response = await api.get('/branches');
    return response.data;
  },

  getOne: async (id: string): Promise<Branch> => {
    const response = await api.get(`/branches/${id}`);
    return response.data;
  },

  create: async (data: CreateBranchInput): Promise<Branch> => {
    const response = await api.post('/branches', data);
    return response.data;
  },

  update: async (id: string, data: UpdateBranchInput): Promise<Branch> => {
    const response = await api.put(`/branches/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/branches/${id}`);
  },
};
