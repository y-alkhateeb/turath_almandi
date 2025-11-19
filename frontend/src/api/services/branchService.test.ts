/**
 * Branch Service Tests
 * Tests for branch management API service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockApiClient, mockSuccess, mockError, verifyRequest, resetApiClientMocks } from '@/test/apiClientMock';
import type { Branch, CreateBranchInput, UpdateBranchInput } from '#/entity';
import type { BranchQueryFilters } from '#/api';

// Mock the apiClient module
vi.mock('../apiClient', () => ({
  default: mockApiClient,
}));

// Import after mocking
import * as branchService from './branchService';
import { BranchApiEndpoints } from './branchService';

describe('branchService', () => {
  const mockBranch: Branch = {
    id: 'branch-123',
    name: 'Main Branch',
    location: 'Downtown',
    managerName: 'John Doe',
    phone: '123456789',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    resetApiClientMocks();
  });

  describe('getAll', () => {
    it('should get all branches without filters', async () => {
      const mockBranches = [mockBranch];
      mockApiClient.get.mockReturnValue(mockSuccess(mockBranches));

      const result = await branchService.getAll();

      expect(result).toEqual(mockBranches);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: BranchApiEndpoints.GetAll,
        params: undefined,
      });
    });

    it('should get branches with filters', async () => {
      const filters: BranchQueryFilters = {
        includeInactive: true,
      };

      mockApiClient.get.mockReturnValue(mockSuccess([mockBranch]));

      await branchService.getAll(filters);

      verifyRequest(mockApiClient.get, {
        url: BranchApiEndpoints.GetAll,
        params: filters,
      });
    });

    it('should handle 401 error', async () => {
      mockApiClient.get.mockReturnValue(mockError(401, 'Not authenticated'));

      await expect(branchService.getAll()).rejects.toThrow('Not authenticated');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess([mockBranch]));

      const result = branchService.getAll();

      const _typeCheck: Promise<Branch[]> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('getAllActive', () => {
    it('should get only active branches', async () => {
      const activeBranches = [mockBranch];
      mockApiClient.get.mockReturnValue(mockSuccess(activeBranches));

      const result = await branchService.getAllActive();

      expect(result).toEqual(activeBranches);
      verifyRequest(mockApiClient.get, {
        url: BranchApiEndpoints.GetAll,
        params: { includeInactive: false },
      });
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess([mockBranch]));

      const result = branchService.getAllActive();

      const _typeCheck: Promise<Branch[]> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('getAllIncludingInactive', () => {
    it('should get all branches including inactive', async () => {
      const allBranches = [
        mockBranch,
        { ...mockBranch, id: 'branch-456', isActive: false },
      ];
      mockApiClient.get.mockReturnValue(mockSuccess(allBranches));

      const result = await branchService.getAllIncludingInactive();

      expect(result).toEqual(allBranches);
      verifyRequest(mockApiClient.get, {
        url: BranchApiEndpoints.GetAll,
        params: { includeInactive: true },
      });
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess([mockBranch]));

      const result = branchService.getAllIncludingInactive();

      const _typeCheck: Promise<Branch[]> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('getOne', () => {
    it('should get branch by ID', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockBranch));

      const result = await branchService.getOne('branch-123');

      expect(result).toEqual(mockBranch);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: '/branches/branch-123',
      });
    });

    it('should handle 404 error', async () => {
      mockApiClient.get.mockReturnValue(mockError(404, 'Branch not found'));

      await expect(branchService.getOne('nonexistent')).rejects.toThrow('Branch not found');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockBranch));

      const result = branchService.getOne('branch-123');

      const _typeCheck: Promise<Branch> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('create', () => {
    const createData: CreateBranchInput = {
      name: 'New Branch',
      location: 'Uptown',
      managerName: 'Jane Smith',
      phone: '987654321',
    };

    it('should create branch successfully', async () => {
      const newBranch = { ...mockBranch, ...createData };
      mockApiClient.post.mockReturnValue(mockSuccess(newBranch));

      const result = await branchService.create(createData);

      expect(result).toEqual(newBranch);
      expect(mockApiClient.post).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.post, {
        url: BranchApiEndpoints.Create,
        data: createData,
      });
    });

    it('should handle 400 validation error', async () => {
      mockApiClient.post.mockReturnValue(mockError(400, 'Name is required'));

      await expect(branchService.create(createData)).rejects.toThrow('Name is required');
    });

    it('should handle 403 error for non-admin', async () => {
      mockApiClient.post.mockReturnValue(mockError(403, 'Forbidden'));

      await expect(branchService.create(createData)).rejects.toThrow('Forbidden');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.post.mockReturnValue(mockSuccess(mockBranch));

      const result = branchService.create(createData);

      const _typeCheck: Promise<Branch> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('update', () => {
    const updateData: UpdateBranchInput = {
      name: 'Updated Branch',
      location: 'New Location',
      isActive: false,
    };

    it('should update branch successfully', async () => {
      const updatedBranch = { ...mockBranch, ...updateData };
      mockApiClient.patch.mockReturnValue(mockSuccess(updatedBranch));

      const result = await branchService.update('branch-123', updateData);

      expect(result).toEqual(updatedBranch);
      expect(mockApiClient.patch).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.patch, {
        url: '/branches/branch-123',
        data: updateData,
      });
    });

    it('should update only name', async () => {
      const nameUpdate = { name: 'Updated Name' };
      mockApiClient.patch.mockReturnValue(mockSuccess(mockBranch));

      await branchService.update('branch-123', nameUpdate);

      verifyRequest(mockApiClient.patch, {
        url: '/branches/branch-123',
        data: nameUpdate,
      });
    });

    it('should update only active status', async () => {
      const statusUpdate = { isActive: false };
      mockApiClient.patch.mockReturnValue(mockSuccess(mockBranch));

      await branchService.update('branch-123', statusUpdate);

      verifyRequest(mockApiClient.patch, {
        url: '/branches/branch-123',
        data: statusUpdate,
      });
    });

    it('should handle 404 error', async () => {
      mockApiClient.patch.mockReturnValue(mockError(404, 'Branch not found'));

      await expect(branchService.update('nonexistent', updateData)).rejects.toThrow('Branch not found');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.patch.mockReturnValue(mockSuccess(mockBranch));

      const result = branchService.update('branch-123', updateData);

      const _typeCheck: Promise<Branch> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('deleteBranch', () => {
    it('should delete branch successfully', async () => {
      mockApiClient.delete.mockReturnValue(mockSuccess(undefined));

      await branchService.deleteBranch('branch-123');

      expect(mockApiClient.delete).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.delete, {
        url: '/branches/branch-123',
      });
    });

    it('should handle 404 error', async () => {
      mockApiClient.delete.mockReturnValue(mockError(404, 'Branch not found'));

      await expect(branchService.deleteBranch('nonexistent')).rejects.toThrow('Branch not found');
    });

    it('should handle 409 conflict error', async () => {
      mockApiClient.delete.mockReturnValue(mockError(409, 'Branch has related records'));

      await expect(branchService.deleteBranch('branch-123')).rejects.toThrow('Branch has related records');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.delete.mockReturnValue(mockSuccess(undefined));

      const result = branchService.deleteBranch('branch-123');

      const _typeCheck: Promise<void> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('activate', () => {
    it('should activate branch', async () => {
      const activeBranch = { ...mockBranch, isActive: true };
      mockApiClient.patch.mockReturnValue(mockSuccess(activeBranch));

      const result = await branchService.activate('branch-123');

      expect(result.isActive).toBe(true);
      verifyRequest(mockApiClient.patch, {
        url: '/branches/branch-123',
        data: { isActive: true },
      });
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.patch.mockReturnValue(mockSuccess(mockBranch));

      const result = branchService.activate('branch-123');

      const _typeCheck: Promise<Branch> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('deactivate', () => {
    it('should deactivate branch', async () => {
      const inactiveBranch = { ...mockBranch, isActive: false };
      mockApiClient.patch.mockReturnValue(mockSuccess(inactiveBranch));

      const result = await branchService.deactivate('branch-123');

      expect(result.isActive).toBe(false);
      verifyRequest(mockApiClient.patch, {
        url: '/branches/branch-123',
        data: { isActive: false },
      });
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.patch.mockReturnValue(mockSuccess(mockBranch));

      const result = branchService.deactivate('branch-123');

      const _typeCheck: Promise<Branch> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('BranchApiEndpoints', () => {
    it('should have correct endpoint values', () => {
      expect(BranchApiEndpoints.GetAll).toBe('/branches');
      expect(BranchApiEndpoints.GetOne).toBe('/branches/:id');
      expect(BranchApiEndpoints.Create).toBe('/branches');
      expect(BranchApiEndpoints.Update).toBe('/branches/:id');
      expect(BranchApiEndpoints.Delete).toBe('/branches/:id');
    });
  });

  describe('default export', () => {
    it('should export service object with all methods', () => {
      expect(branchService.default).toBeDefined();
      expect(branchService.default.getAll).toBe(branchService.getAll);
      expect(branchService.default.getAllActive).toBe(branchService.getAllActive);
      expect(branchService.default.getAllIncludingInactive).toBe(branchService.getAllIncludingInactive);
      expect(branchService.default.getOne).toBe(branchService.getOne);
      expect(branchService.default.create).toBe(branchService.create);
      expect(branchService.default.update).toBe(branchService.update);
      expect(branchService.default.delete).toBe(branchService.deleteBranch);
      expect(branchService.default.activate).toBe(branchService.activate);
      expect(branchService.default.deactivate).toBe(branchService.deactivate);
    });
  });
});
