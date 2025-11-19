/**
 * User Management Service Tests
 * Tests for user management API service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockApiClient, mockSuccess, mockError, verifyRequest, resetApiClientMocks } from '@/test/apiClientMock';
import type { UserWithBranch, CreateUserInput, UpdateUserInput } from '#/entity';

// Mock the apiClient module
vi.mock('../apiClient', () => ({
  default: mockApiClient,
}));

// Import after mocking
import * as userManagementService from './userManagementService';
import { UserManagementApi } from './userManagementService';

describe('userManagementService', () => {
  const mockUser: UserWithBranch = {
    id: 'user-123',
    username: 'testuser',
    role: 'ACCOUNTANT',
    branchId: 'branch-123',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    branch: {
      id: 'branch-123',
      name: 'Main Branch',
      location: 'Downtown',
      managerName: 'John Doe',
      phone: '123456789',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  };

  beforeEach(() => {
    resetApiClientMocks();
  });

  describe('getAll', () => {
    it('should get all users', async () => {
      const mockUsers = [mockUser];
      mockApiClient.get.mockReturnValue(mockSuccess(mockUsers));

      const result = await userManagementService.getAll();

      expect(result).toEqual(mockUsers);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: UserManagementApi.GetAll,
      });
    });

    it('should return empty array when no users', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess([]));

      const result = await userManagementService.getAll();

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should handle 401 error', async () => {
      mockApiClient.get.mockReturnValue(mockError(401, 'Not authenticated'));

      await expect(userManagementService.getAll()).rejects.toThrow('Not authenticated');
    });

    it('should handle 403 error for non-admin', async () => {
      mockApiClient.get.mockReturnValue(mockError(403, 'Admin access required'));

      await expect(userManagementService.getAll()).rejects.toThrow('Admin access required');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess([mockUser]));

      const result = userManagementService.getAll();

      const _typeCheck: Promise<UserWithBranch[]> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('getOne', () => {
    it('should get user by ID', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockUser));

      const result = await userManagementService.getOne('user-123');

      expect(result).toEqual(mockUser);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: '/users/user-123',
      });
    });

    it('should get user without branch', async () => {
      const userWithoutBranch: UserWithBranch = {
        ...mockUser,
        branchId: undefined,
        branch: undefined,
      };

      mockApiClient.get.mockReturnValue(mockSuccess(userWithoutBranch));

      const result = await userManagementService.getOne('user-456');

      expect(result).toEqual(userWithoutBranch);
      expect(result.branch).toBeUndefined();
    });

    it('should handle 404 error', async () => {
      mockApiClient.get.mockReturnValue(mockError(404, 'User not found'));

      await expect(userManagementService.getOne('nonexistent')).rejects.toThrow('User not found');
    });

    it('should handle 403 error', async () => {
      mockApiClient.get.mockReturnValue(mockError(403, 'Forbidden'));

      await expect(userManagementService.getOne('user-123')).rejects.toThrow('Forbidden');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockUser));

      const result = userManagementService.getOne('user-123');

      const _typeCheck: Promise<UserWithBranch> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('create', () => {
    const createData: CreateUserInput = {
      username: 'newuser',
      password: 'Test123!@#',
      role: 'ACCOUNTANT',
      branchId: 'branch-123',
    };

    it('should create user successfully', async () => {
      mockApiClient.post.mockReturnValue(mockSuccess(mockUser));

      const result = await userManagementService.create(createData);

      expect(result).toEqual(mockUser);
      expect(mockApiClient.post).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.post, {
        url: UserManagementApi.Create,
        data: createData,
      });
    });

    it('should create admin user without branchId', async () => {
      const adminData: CreateUserInput = {
        username: 'admin',
        password: 'Admin123!@#',
        role: 'ADMIN',
      };

      const adminUser: UserWithBranch = {
        ...mockUser,
        username: 'admin',
        role: 'ADMIN',
        branchId: undefined,
        branch: undefined,
      };

      mockApiClient.post.mockReturnValue(mockSuccess(adminUser));

      const result = await userManagementService.create(adminData);

      expect(result.role).toBe('ADMIN');
      expect(result.branchId).toBeUndefined();
      verifyRequest(mockApiClient.post, {
        url: UserManagementApi.Create,
        data: adminData,
      });
    });

    it('should create accountant user with branchId', async () => {
      const accountantData: CreateUserInput = {
        username: 'accountant',
        password: 'Accountant123!@#',
        role: 'ACCOUNTANT',
        branchId: 'branch-456',
      };

      mockApiClient.post.mockReturnValue(mockSuccess(mockUser));

      await userManagementService.create(accountantData);

      verifyRequest(mockApiClient.post, {
        url: UserManagementApi.Create,
        data: accountantData,
      });
    });

    it('should handle 400 validation error', async () => {
      mockApiClient.post.mockReturnValue(mockError(400, 'Password too weak'));

      await expect(userManagementService.create(createData)).rejects.toThrow('Password too weak');
    });

    it('should handle 409 conflict error', async () => {
      mockApiClient.post.mockReturnValue(mockError(409, 'Username already exists'));

      await expect(userManagementService.create(createData)).rejects.toThrow('Username already exists');
    });

    it('should handle 401 error', async () => {
      mockApiClient.post.mockReturnValue(mockError(401, 'Not authenticated'));

      await expect(userManagementService.create(createData)).rejects.toThrow('Not authenticated');
    });

    it('should handle 403 error for non-admin', async () => {
      mockApiClient.post.mockReturnValue(mockError(403, 'Admin access required'));

      await expect(userManagementService.create(createData)).rejects.toThrow('Admin access required');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.post.mockReturnValue(mockSuccess(mockUser));

      const result = userManagementService.create(createData);

      const _typeCheck: Promise<UserWithBranch> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('update', () => {
    const updateData: UpdateUserInput = {
      role: 'ADMIN',
      branchId: 'branch-456',
      isActive: false,
    };

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, ...updateData };
      mockApiClient.patch.mockReturnValue(mockSuccess(updatedUser));

      const result = await userManagementService.update('user-123', updateData);

      expect(result).toEqual(updatedUser);
      expect(mockApiClient.patch).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.patch, {
        url: '/users/user-123',
        data: updateData,
      });
    });

    it('should update only role', async () => {
      const roleUpdate = { role: 'ADMIN' as const };
      mockApiClient.patch.mockReturnValue(mockSuccess(mockUser));

      await userManagementService.update('user-123', roleUpdate);

      verifyRequest(mockApiClient.patch, {
        url: '/users/user-123',
        data: roleUpdate,
      });
    });

    it('should update only branchId', async () => {
      const branchUpdate = { branchId: 'branch-456' };
      mockApiClient.patch.mockReturnValue(mockSuccess(mockUser));

      await userManagementService.update('user-123', branchUpdate);

      verifyRequest(mockApiClient.patch, {
        url: '/users/user-123',
        data: branchUpdate,
      });
    });

    it('should update only isActive', async () => {
      const activeUpdate = { isActive: false };
      mockApiClient.patch.mockReturnValue(mockSuccess(mockUser));

      await userManagementService.update('user-123', activeUpdate);

      verifyRequest(mockApiClient.patch, {
        url: '/users/user-123',
        data: activeUpdate,
      });
    });

    it('should update password', async () => {
      const passwordUpdate = { password: 'NewPass123!@#' };
      mockApiClient.patch.mockReturnValue(mockSuccess(mockUser));

      await userManagementService.update('user-123', passwordUpdate);

      verifyRequest(mockApiClient.patch, {
        url: '/users/user-123',
        data: passwordUpdate,
      });
    });

    it('should handle 404 error', async () => {
      mockApiClient.patch.mockReturnValue(mockError(404, 'User not found'));

      await expect(userManagementService.update('nonexistent', updateData)).rejects.toThrow('User not found');
    });

    it('should handle 400 validation error', async () => {
      mockApiClient.patch.mockReturnValue(mockError(400, 'Invalid role'));

      await expect(userManagementService.update('user-123', updateData)).rejects.toThrow('Invalid role');
    });

    it('should handle 403 error', async () => {
      mockApiClient.patch.mockReturnValue(mockError(403, 'Forbidden'));

      await expect(userManagementService.update('user-123', updateData)).rejects.toThrow('Forbidden');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.patch.mockReturnValue(mockSuccess(mockUser));

      const result = userManagementService.update('user-123', updateData);

      const _typeCheck: Promise<UserWithBranch> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('assignBranch', () => {
    it('should assign branch to user', async () => {
      const updatedUser = { ...mockUser, branchId: 'branch-456' };
      mockApiClient.patch.mockReturnValue(mockSuccess(updatedUser));

      const result = await userManagementService.assignBranch('user-123', 'branch-456');

      expect(result).toEqual(updatedUser);
      expect(mockApiClient.patch).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.patch, {
        url: '/users/user-123/assign-branch',
        data: { branchId: 'branch-456' },
      });
    });

    it('should unassign branch by setting to null', async () => {
      const updatedUser = { ...mockUser, branchId: null };
      mockApiClient.patch.mockReturnValue(mockSuccess(updatedUser));

      await userManagementService.assignBranch('user-123', null);

      verifyRequest(mockApiClient.patch, {
        url: '/users/user-123/assign-branch',
        data: { branchId: null },
      });
    });

    it('should handle 404 error for user not found', async () => {
      mockApiClient.patch.mockReturnValue(mockError(404, 'User not found'));

      await expect(userManagementService.assignBranch('nonexistent', 'branch-123')).rejects.toThrow('User not found');
    });

    it('should handle 404 error for branch not found', async () => {
      mockApiClient.patch.mockReturnValue(mockError(404, 'Branch not found'));

      await expect(userManagementService.assignBranch('user-123', 'nonexistent')).rejects.toThrow('Branch not found');
    });

    it('should handle 403 error', async () => {
      mockApiClient.patch.mockReturnValue(mockError(403, 'Forbidden'));

      await expect(userManagementService.assignBranch('user-123', 'branch-456')).rejects.toThrow('Forbidden');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.patch.mockReturnValue(mockSuccess(mockUser));

      const result = userManagementService.assignBranch('user-123', 'branch-123');

      const _typeCheck: Promise<UserWithBranch> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockApiClient.delete.mockReturnValue(mockSuccess(undefined));

      await userManagementService.deleteUser('user-123');

      expect(mockApiClient.delete).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.delete, {
        url: '/users/user-123',
      });
    });

    it('should handle 404 error', async () => {
      mockApiClient.delete.mockReturnValue(mockError(404, 'User not found'));

      await expect(userManagementService.deleteUser('nonexistent')).rejects.toThrow('User not found');
    });

    it('should handle 409 conflict error', async () => {
      mockApiClient.delete.mockReturnValue(mockError(409, 'User has related records'));

      await expect(userManagementService.deleteUser('user-123')).rejects.toThrow('User has related records');
    });

    it('should handle 403 error for non-admin', async () => {
      mockApiClient.delete.mockReturnValue(mockError(403, 'Admin access required'));

      await expect(userManagementService.deleteUser('user-123')).rejects.toThrow('Admin access required');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.delete.mockReturnValue(mockSuccess(undefined));

      const result = userManagementService.deleteUser('user-123');

      const _typeCheck: Promise<void> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('UserManagementApi', () => {
    it('should have correct endpoint values', () => {
      expect(UserManagementApi.GetAll).toBe('/users');
      expect(UserManagementApi.GetOne).toBe('/users/:id');
      expect(UserManagementApi.Create).toBe('/users');
      expect(UserManagementApi.Update).toBe('/users/:id');
      expect(UserManagementApi.AssignBranch).toBe('/users/:id/assign-branch');
      expect(UserManagementApi.Delete).toBe('/users/:id');
    });
  });

  describe('default export', () => {
    it('should export service object with all methods', () => {
      expect(userManagementService.default).toBeDefined();
      expect(userManagementService.default.getAll).toBe(userManagementService.getAll);
      expect(userManagementService.default.getOne).toBe(userManagementService.getOne);
      expect(userManagementService.default.create).toBe(userManagementService.create);
      expect(userManagementService.default.update).toBe(userManagementService.update);
      expect(userManagementService.default.assignBranch).toBe(userManagementService.assignBranch);
      expect(userManagementService.default.delete).toBe(userManagementService.deleteUser);
    });
  });
});
