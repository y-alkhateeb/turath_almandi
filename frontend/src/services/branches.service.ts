import { api } from './axios';

export interface Branch {
  id: string;
  name: string;
  location: string;
  managerName: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const branchesService = {
  getAll: async (): Promise<Branch[]> => {
    const response = await api.get('/branches');
    return response.data;
  },

  getOne: async (id: string): Promise<Branch> => {
    const response = await api.get(`/branches/${id}`);
    return response.data;
  },

  create: async (data: Omit<Branch, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>): Promise<Branch> => {
    const response = await api.post('/branches', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Branch>): Promise<Branch> => {
    const response = await api.patch(`/branches/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/branches/${id}`);
  },
};
