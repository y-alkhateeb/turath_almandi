/**
 * Authentication Service
 * Handles all authentication-related API calls
 *
 * Endpoints:
 * - POST /auth/login → LoginResponse
 * - POST /auth/register → User (Admin only)
 * - POST /auth/refresh → RefreshTokenResponse
 * - POST /auth/logout → void
 * - GET /auth/profile → User
 *
 * All types match backend DTOs exactly. No any types.
 */

import apiClient from '../apiClient';
import type { LoginCredentials, User } from '#/entity';
import type { LoginResponse, RefreshTokenResponse, UserProfileResponse } from '#/api';
import type { UserRole } from '@/types/enum';

// ============================================
// INPUT TYPES
// ============================================

/**
 * Register user input
 * Matches backend RegisterDto exactly
 */
export interface RegisterInput {
  username: string;
  password: string;
  role?: UserRole;
  branchId?: string;
}

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Auth API endpoints enum
 * Centralized endpoint definitions
 */
export enum AuthApiEndpoints {
  Login = '/auth/login',
  Register = '/auth/register',
  Refresh = '/auth/refresh',
  Logout = '/auth/logout',
  Profile = '/auth/profile',
}

// ============================================
// AUTH SERVICE METHODS
// ============================================

/**
 * Login user
 * POST /auth/login
 *
 * @param credentials - User credentials (username, password, rememberMe?)
 * @returns LoginResponse with user data and tokens
 * @throws ApiError on 400 (invalid credentials), 401 (unauthorized)
 */
export const login = (credentials: LoginCredentials): Promise<LoginResponse> => {
  return apiClient.post<LoginResponse>({
    url: AuthApiEndpoints.Login,
    data: credentials,
  });
};

/**
 * Register new user (Admin only)
 * POST /auth/register
 *
 * @param data - RegisterInput with username, password, role, branchId
 * @returns Created User
 * @throws ApiError on 400 (validation), 401 (not authenticated), 403 (not admin), 409 (username exists)
 */
export const register = (data: RegisterInput): Promise<User> => {
  return apiClient.post<User>({
    url: AuthApiEndpoints.Register,
    data,
  });
};

/**
 * Refresh access token
 * POST /auth/refresh
 *
 * @param refreshToken - Refresh token string
 * @returns RefreshTokenResponse with new access_token and refresh_token
 * @throws ApiError on 401 (invalid/expired refresh token)
 */
export const refreshToken = (refreshToken: string): Promise<RefreshTokenResponse> => {
  return apiClient.post<RefreshTokenResponse>({
    url: AuthApiEndpoints.Refresh,
    data: { refresh_token: refreshToken },
  });
};

/**
 * Logout user
 * POST /auth/logout
 *
 * Invalidates current refresh token on server
 * @returns void
 * @throws ApiError on 401 (not authenticated)
 */
export const logout = (): Promise<void> => {
  return apiClient.post<void>({
    url: AuthApiEndpoints.Logout,
  });
};

/**
 * Get current user profile
 * GET /auth/profile
 *
 * Returns authenticated user's profile with branch relation if applicable
 * @returns UserProfileResponse with user data and optional branch
 * @throws ApiError on 401 (not authenticated)
 */
export const getProfile = (): Promise<UserProfileResponse> => {
  return apiClient.get<UserProfileResponse>({
    url: AuthApiEndpoints.Profile,
  });
};

// ============================================
// EXPORTS
// ============================================

/**
 * Auth service object with all methods
 * Use named exports or default object
 */
const authService = {
  login,
  register,
  refreshToken,
  logout,
  getProfile,
};

export default authService;
