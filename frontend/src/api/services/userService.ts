/**
 * User Service
 * Authentication and user management endpoints
 */

import apiClient from '../apiClient';
import type { LoginCredentials, AuthResponse, User } from '#/entity';

// API endpoints enum
export enum UserApi {
  Login = '/auth/login',
  Logout = '/auth/logout',
  Me = '/auth/me',
  Refresh = '/auth/refresh',
}

// Login
export const login = (credentials: LoginCredentials) =>
  apiClient.post<AuthResponse>({
    url: UserApi.Login,
    data: credentials,
  });

// Logout
export const logout = () =>
  apiClient.post<void>({
    url: UserApi.Logout,
  });

// Get current user
export const getCurrentUser = () =>
  apiClient.get<User>({
    url: UserApi.Me,
  });

// Refresh token
export const refreshToken = (refreshToken: string) =>
  apiClient.post<{ access_token: string }>({
    url: UserApi.Refresh,
    data: { refresh_token: refreshToken },
  });

// Export as default object
export default {
  login,
  logout,
  getCurrentUser,
  refreshToken,
};
