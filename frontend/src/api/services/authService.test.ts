/**
 * Auth Service Tests
 * Tests for authentication API service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockApiClient, mockSuccess, mockError, verifyRequest, resetApiClientMocks } from '@/test/apiClientMock';
import type { LoginCredentials } from '#/entity';
import type { LoginResponse, RefreshTokenResponse, UserProfileResponse } from '#/api';

// Mock the apiClient module
vi.mock('../apiClient', () => ({
  default: mockApiClient,
}));

// Import after mocking
import * as authService from './authService';
import { AuthApiEndpoints } from './authService';

describe('authService', () => {
  beforeEach(() => {
    resetApiClientMocks();
  });

  describe('login', () => {
    const credentials: LoginCredentials = {
      username: 'testuser',
      password: 'Test123!@#',
      rememberMe: true,
    };

    const mockResponse: LoginResponse = {
      user: {
        id: '123',
        username: 'testuser',
        role: 'ADMIN',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      access_token: 'access-token-123',
      refresh_token: 'refresh-token-123',
    };

    it('should login successfully with valid credentials', async () => {
      mockApiClient.post.mockReturnValue(mockSuccess(mockResponse));

      const result = await authService.login(credentials);

      expect(result).toEqual(mockResponse);
      expect(mockApiClient.post).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.post, {
        url: AuthApiEndpoints.Login,
        data: credentials,
      });
    });

    it('should handle login with rememberMe=false', async () => {
      const credentialsNoRemember = { ...credentials, rememberMe: false };
      mockApiClient.post.mockReturnValue(mockSuccess(mockResponse));

      await authService.login(credentialsNoRemember);

      verifyRequest(mockApiClient.post, {
        url: AuthApiEndpoints.Login,
        data: credentialsNoRemember,
      });
    });

    it('should handle login without rememberMe field', async () => {
      const { rememberMe, ...credentialsWithoutRemember } = credentials;
      mockApiClient.post.mockReturnValue(mockSuccess(mockResponse));

      await authService.login(credentialsWithoutRemember);

      verifyRequest(mockApiClient.post, {
        url: AuthApiEndpoints.Login,
        data: credentialsWithoutRemember,
      });
    });

    it('should handle 401 Unauthorized error', async () => {
      mockApiClient.post.mockReturnValue(mockError(401, 'Invalid credentials'));

      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
      expect(mockApiClient.post).toHaveBeenCalledTimes(1);
    });

    it('should handle 400 Bad Request error', async () => {
      mockApiClient.post.mockReturnValue(mockError(400, 'Validation failed'));

      await expect(authService.login(credentials)).rejects.toThrow('Validation failed');
    });

    it('should handle network errors', async () => {
      mockApiClient.post.mockReturnValue(Promise.reject(new Error('Network error')));

      await expect(authService.login(credentials)).rejects.toThrow('Network error');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.post.mockReturnValue(mockSuccess(mockResponse));

      const result = authService.login(credentials);

      // Type assertion to verify return type
      const _typeCheck: Promise<LoginResponse> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('refreshToken', () => {
    const refreshToken = 'refresh-token-123';

    const mockResponse: RefreshTokenResponse = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
    };

    it('should refresh token successfully', async () => {
      mockApiClient.post.mockReturnValue(mockSuccess(mockResponse));

      const result = await authService.refreshToken(refreshToken);

      expect(result).toEqual(mockResponse);
      expect(mockApiClient.post).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.post, {
        url: AuthApiEndpoints.Refresh,
        data: { refresh_token: refreshToken },
      });
    });

    it('should handle 401 error for invalid refresh token', async () => {
      mockApiClient.post.mockReturnValue(mockError(401, 'Invalid refresh token'));

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow('Invalid refresh token');
    });

    it('should handle expired refresh token', async () => {
      mockApiClient.post.mockReturnValue(mockError(401, 'Refresh token expired'));

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow('Refresh token expired');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.post.mockReturnValue(mockSuccess(mockResponse));

      const result = authService.refreshToken(refreshToken);

      const _typeCheck: Promise<RefreshTokenResponse> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockApiClient.post.mockReturnValue(mockSuccess(undefined));

      await authService.logout();

      expect(mockApiClient.post).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.post, {
        url: AuthApiEndpoints.Logout,
      });
    });

    it('should handle 401 error when not authenticated', async () => {
      mockApiClient.post.mockReturnValue(mockError(401, 'Not authenticated'));

      await expect(authService.logout()).rejects.toThrow('Not authenticated');
    });

    it('should handle network errors during logout', async () => {
      mockApiClient.post.mockReturnValue(Promise.reject(new Error('Network error')));

      await expect(authService.logout()).rejects.toThrow('Network error');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.post.mockReturnValue(mockSuccess(undefined));

      const result = authService.logout();

      const _typeCheck: Promise<void> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('getProfile', () => {
    const mockProfile: UserProfileResponse = {
      user: {
        id: '123',
        username: 'testuser',
        role: 'ADMIN',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    };

    it('should get user profile successfully', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockProfile));

      const result = await authService.getProfile();

      expect(result).toEqual(mockProfile);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: AuthApiEndpoints.Profile,
      });
    });

    it('should get profile with branch information', async () => {
      const profileWithBranch: UserProfileResponse = {
        ...mockProfile,
        user: {
          ...mockProfile.user,
          branchId: 'branch-123',
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
        },
      };

      mockApiClient.get.mockReturnValue(mockSuccess(profileWithBranch));

      const result = await authService.getProfile();

      expect(result).toEqual(profileWithBranch);
      expect(result.user.branch).toBeDefined();
    });

    it('should handle 401 error when not authenticated', async () => {
      mockApiClient.get.mockReturnValue(mockError(401, 'Not authenticated'));

      await expect(authService.getProfile()).rejects.toThrow('Not authenticated');
    });

    it('should handle 404 error when user not found', async () => {
      mockApiClient.get.mockReturnValue(mockError(404, 'User not found'));

      await expect(authService.getProfile()).rejects.toThrow('User not found');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockProfile));

      const result = authService.getProfile();

      const _typeCheck: Promise<UserProfileResponse> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('AuthApiEndpoints', () => {
    it('should have correct endpoint values', () => {
      expect(AuthApiEndpoints.Login).toBe('/auth/login');
      expect(AuthApiEndpoints.Refresh).toBe('/auth/refresh');
      expect(AuthApiEndpoints.Logout).toBe('/auth/logout');
      expect(AuthApiEndpoints.Profile).toBe('/auth/profile');
    });
  });

  describe('default export', () => {
    it('should export service object with all methods', () => {
      expect(authService.default).toBeDefined();
      expect(authService.default.login).toBe(authService.login);
      expect(authService.default.refreshToken).toBe(authService.refreshToken);
      expect(authService.default.logout).toBe(authService.logout);
      expect(authService.default.getProfile).toBe(authService.getProfile);
    });
  });
});
