/**
 * User Service Tests
 * Tests for user management API service (unified)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockApiClient, mockSuccess, mockError, verifyRequest, resetApiClientMocks } from '@/test/apiClientMock';
import type { UserWithBranch, CreateUserInput, UpdateUserInput } from '#/entity';
import type { PaginatedResponse, UserQueryFilters } from '#/api';

// Mock the apiClient module
vi.mock('../apiClient', () => ({
  default: mockApiClient,
}));

// Import after mocking
import * as userService from './userService';
import { UserApiEndpoints } from './userService';

describe('userService', () => {
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
    const mockPaginatedResponse: PaginatedResponse<UserWithBranch> = {
      data: [mockUser],
      meta: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    };

    it('should get all users with default pagination', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      const result = await userService.getAll();

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: UserApiEndpoints.Base,
        params: undefined,
      });
    });

    it('should get users with filters', async () => {
      const filters: UserQueryFilters = {
        role: 'ACCOUNTANT',
        branchId: 'branch-123',
        isActive: true,
        page: 2,
        limit: 20,
      };

      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      await userService.getAll(filters);

      verifyRequest(mockApiClient.get, {
        url: UserApiEndpoints.Base,
        params: filters,
      });
    });

    it('should handle 401 error', async () => {
      mockApiClient.get.mockReturnValue(mockError(401, 'Not authenticated'));

      await expect(userService.getAll()).rejects.toThrow('Not authenticated');
    });

    it('should handle 403 error for non-admin', async () => {
      mockApiClient.get.mockReturnValue(mockError(403, 'Forbidden'));

      await expect(userService.getAll()).rejects.toThrow('Forbidden');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      const result = userService.getAll();

      const _typeCheck: Promise<PaginatedResponse<UserWithBranch>> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('getAllUnpaginated', () => {
    it('should extract data array from paginated response', async () => {
      const mockResponse: PaginatedResponse<UserWithBranch> = {
        data: [mockUser],
        meta: {
          total: 1,
          page: 1,
          limit: 1000,
          totalPages: 1,
        },
      };

      mockApiClient.get.mockReturnValue(mockSuccess(mockResponse));

      const result = await userService.getAllUnpaginated();

      expect(result).toEqual([mockUser]);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: UserApiEndpoints.Base,
        params: { limit: 1000 },
      });
    });

    it('should handle direct array response', async () => {
      const mockArrayResponse = [mockUser];

      mockApiClient.get.mockReturnValue(mockSuccess(mockArrayResponse));

      const result = await userService.getAllUnpaginated();

      expect(result).toEqual([mockUser]);
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess([mockUser]));

      const result = userService.getAllUnpaginated();

      const _typeCheck: Promise<UserWithBranch[]> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('getOne', () => {
    it('should get user by ID', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockUser));

      const result = await userService.getOne('user-123');

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

      const result = await userService.getOne('user-456');

      expect(result).toEqual(userWithoutBranch);
      expect(result.branch).toBeUndefined();
    });

    it('should handle 404 error', async () => {
      mockApiClient.get.mockReturnValue(mockError(404, 'User not found'));

      await expect(userService.getOne('nonexistent')).rejects.toThrow('User not found');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockUser));

      const result = userService.getOne('user-123');

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

      const result = await userService.create(createData);

      expect(result).toEqual(mockUser);
      expect(mockApiClient.post).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.post, {
        url: UserApiEndpoints.Base,
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

      const result = await userService.create(adminData);

      expect(result.role).toBe('ADMIN');
      verifyRequest(mockApiClient.post, {
        url: UserApiEndpoints.Base,
        data: adminData,
      });
    });

    it('should handle 400 validation error', async () => {
      mockApiClient.post.mockReturnValue(mockError(400, 'Password too weak'));

      await expect(userService.create(createData)).rejects.toThrow('Password too weak');
    });

    it('should handle 409 conflict error', async () => {
      mockApiClient.post.mockReturnValue(mockError(409, 'Username already exists'));

      await expect(userService.create(createData)).rejects.toThrow('Username already exists');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.post.mockReturnValue(mockSuccess(mockUser));

      const result = userService.create(createData);

      const _typeCheck: Promise<UserWithBranch> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('update', () => {
    const updateData: UpdateUserInput = {
      password: 'NewPass123!@#',
      role: 'ADMIN',
      isActive: false,
    };

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, ...updateData };
      mockApiClient.patch.mockReturnValue(mockSuccess(updatedUser));

      const result = await userService.update('user-123', updateData);

      expect(result).toEqual(updatedUser);
      expect(mockApiClient.patch).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.patch, {
        url: '/users/user-123',
        data: updateData,
      });
    });

    it('should update only password', async () => {
      const passwordUpdate = { password: 'NewPass123!@#' };
      mockApiClient.patch.mockReturnValue(mockSuccess(mockUser));

      await userService.update('user-123', passwordUpdate);

      verifyRequest(mockApiClient.patch, {
        url: '/users/user-123',
        data: passwordUpdate,
      });
    });

    it('should update only role', async () => {
      const roleUpdate = { role: 'ADMIN' as const };
      mockApiClient.patch.mockReturnValue(mockSuccess(mockUser));

      await userService.update('user-123', roleUpdate);

      verifyRequest(mockApiClient.patch, {
        url: '/users/user-123',
        data: roleUpdate,
      });
    });

    it('should handle 404 error', async () => {
      mockApiClient.patch.mockReturnValue(mockError(404, 'User not found'));

      await expect(userService.update('nonexistent', updateData)).rejects.toThrow('User not found');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.patch.mockReturnValue(mockSuccess(mockUser));

      const result = userService.update('user-123', updateData);

      const _typeCheck: Promise<UserWithBranch> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockApiClient.delete.mockReturnValue(mockSuccess(undefined));

      await userService.deleteUser('user-123');

      expect(mockApiClient.delete).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.delete, {
        url: '/users/user-123',
      });
    });

    it('should handle 404 error', async () => {
      mockApiClient.delete.mockReturnValue(mockError(404, 'User not found'));

      await expect(userService.deleteUser('nonexistent')).rejects.toThrow('User not found');
    });

    it('should handle 409 conflict error', async () => {
      mockApiClient.delete.mockReturnValue(mockError(409, 'User has related records'));

      await expect(userService.deleteUser('user-123')).rejects.toThrow('User has related records');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.delete.mockReturnValue(mockSuccess(undefined));

      const result = userService.deleteUser('user-123');

      const _typeCheck: Promise<void> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('assignBranch', () => {
    it('should assign branch to user using dedicated endpoint', async () => {
      const updatedUser = { ...mockUser, branchId: 'new-branch' };
      mockApiClient.patch.mockReturnValue(mockSuccess(updatedUser));

      const result = await userService.assignBranch('user-123', 'new-branch');

      expect(result).toEqual(updatedUser);
      verifyRequest(mockApiClient.patch, {
        url: '/users/user-123/assign-branch',
        data: { branchId: 'new-branch' },
      });
    });

    it('should unassign branch by setting to null', async () => {
      const updatedUser = { ...mockUser, branchId: null };
      mockApiClient.patch.mockReturnValue(mockSuccess(updatedUser));

      await userService.assignBranch('user-123', null);

      verifyRequest(mockApiClient.patch, {
        url: '/users/user-123/assign-branch',
        data: { branchId: null },
      });
    });

    it('should handle 404 error for user not found', async () => {
      mockApiClient.patch.mockReturnValue(mockError(404, 'User not found'));

      await expect(userService.assignBranch('nonexistent', 'branch-123')).rejects.toThrow('User not found');
    });

    it('should handle 404 error for branch not found', async () => {
      mockApiClient.patch.mockReturnValue(mockError(404, 'Branch not found'));

      await expect(userService.assignBranch('user-123', 'nonexistent')).rejects.toThrow('Branch not found');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.patch.mockReturnValue(mockSuccess(mockUser));

      const result = userService.assignBranch('user-123', 'branch-123');

      const _typeCheck: Promise<UserWithBranch> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('setActiveStatus', () => {
    it('should activate user', async () => {
      const activeUser = { ...mockUser, isActive: true };
      mockApiClient.patch.mockReturnValue(mockSuccess(activeUser));

      const result = await userService.setActiveStatus('user-123', true);

      expect(result.isActive).toBe(true);
      verifyRequest(mockApiClient.patch, {
        url: '/users/user-123',
        data: { isActive: true },
      });
    });

    it('should deactivate user', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockApiClient.patch.mockReturnValue(mockSuccess(inactiveUser));

      const result = await userService.setActiveStatus('user-123', false);

      expect(result.isActive).toBe(false);
      verifyRequest(mockApiClient.patch, {
        url: '/users/user-123',
        data: { isActive: false },
      });
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.patch.mockReturnValue(mockSuccess(mockUser));

      const result = userService.setActiveStatus('user-123', true);

      const _typeCheck: Promise<UserWithBranch> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('UserApiEndpoints', () => {
    it('should have correct endpoint values', () => {
      expect(UserApiEndpoints.Base).toBe('/users');
      expect(UserApiEndpoints.ById).toBe('/users/:id');
      expect(UserApiEndpoints.AssignBranch).toBe('/users/:id/assign-branch');
    });
  });

  describe('default export', () => {
    it('should export service object with all methods', () => {
      expect(userService.default).toBeDefined();
      expect(userService.default.getAll).toBe(userService.getAll);
      expect(userService.default.getAllUnpaginated).toBe(userService.getAllUnpaginated);
      expect(userService.default.getOne).toBe(userService.getOne);
      expect(userService.default.create).toBe(userService.create);
      expect(userService.default.update).toBe(userService.update);
      expect(userService.default.delete).toBe(userService.deleteUser);
      expect(userService.default.assignBranch).toBe(userService.assignBranch);
      expect(userService.default.setActiveStatus).toBe(userService.setActiveStatus);
    });
  });
});
