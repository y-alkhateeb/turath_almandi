/**
 * useAuth Hook
 * Comprehensive authentication hook with React Query integration
 *
 * Features:
 * - Login/Logout mutations with automatic cache management
 * - Profile query with auto-refetch on mount
 * - Integration with userStore for state persistence
 * - Computed helpers: isAdmin, isAccountant
 * - Automatic token refresh via API interceptor
 * - Full error handling and TypeScript strict typing
 */

import { useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useUserInfo, useUserToken, useUserActions } from '@/store/userStore';
import authService from '@/api/services/authService';
import { queryKeys } from '@/hooks/queries/queryKeys';
import type { LoginCredentials } from '#/entity';
import type { LoginResponse, UserProfileResponse } from '#/api';
import type { User } from '#/entity';
import { UserRole } from '#/enum';
import { ApiError } from '@/api/apiClient';

// ============================================
// TYPES
// ============================================

/**
 * UseAuth return type
 * Strict typing for all return values
 */
export interface UseAuthReturn {
  /** Current user or null if not authenticated */
  user: User | null;

  /** Loading state for initial profile fetch */
  isLoading: boolean;

  /** Whether user is admin */
  isAdmin: boolean;

  /** Whether user is accountant */
  isAccountant: boolean;

  /** Whether user is authenticated (has token) */
  isAuthenticated: boolean;

  /** Login mutation function */
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;

  /** Logout mutation function */
  logout: () => Promise<void>;

  /** Refetch user profile */
  refetch: () => Promise<void>;

  /** Loading state for login mutation */
  isLoggingIn: boolean;

  /** Loading state for logout mutation */
  isLoggingOut: boolean;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

/**
 * useAuth Hook
 * Main authentication hook with React Query integration
 *
 * @returns UseAuthReturn with user, loading states, mutations, and helpers
 *
 * @example
 * ```tsx
 * function LoginPage() {
 *   const { login, isLoggingIn, isAuthenticated } = useAuth();
 *
 *   const handleLogin = async () => {
 *     try {
 *       await login({ username: 'admin', password: 'password' });
 *       navigate('/dashboard');
 *     } catch (error) {
 *       // Error already handled by mutation
 *     }
 *   };
 *
 *   return <LoginForm onSubmit={handleLogin} loading={isLoggingIn} />;
 * }
 * ```
 */
export const useAuth = (): UseAuthReturn => {
  const queryClient = useQueryClient();

  // Get user data from Zustand store
  const userInfo = useUserInfo();
  const tokens = useUserToken();
  const { setUser, setAuth, clearAuth } = useUserActions();

  // Determine if authenticated
  const isAuthenticated = !!tokens.accessToken;

  // ============================================
  // PROFILE QUERY
  // ============================================

  /**
   * Profile query
   * Fetches current user profile if authenticated
   * Auto-refetches on mount and window focus
   */
  const {
    data: _profileData,
    isLoading: isLoadingProfile,
    refetch: refetchProfile,
    error,
  } = useQuery<UserProfileResponse, ApiError>({
    queryKey: queryKeys.auth.profile,
    queryFn: authService.getProfile,
    enabled: isAuthenticated, // Only fetch if user has token
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
    refetchOnMount: 'always', // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window regains focus
    retry: 1, // Only retry once on failure
  });

  // Sync user state with profile data
  useEffect(() => {
    if (_profileData) {
      setUser(_profileData as unknown as User);
    }
  }, [_profileData, setUser]);

  // Handle auth error
  useEffect(() => {
    if (error?.statusCode === 401) {
      clearAuth();
      queryClient.clear();
    }
  }, [error, clearAuth, queryClient]);

  // ============================================
  // LOGIN MUTATION
  // ============================================

  /**
   * Login mutation
   * Handles user login and cache updates
   */
  const loginMutation = useMutation<LoginResponse, ApiError, LoginCredentials>({
    mutationFn: authService.login,

    onSuccess: (data, variables) => {
      // Store tokens and user info
      setAuth(
        data.user as unknown as User,
        {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        },
        variables.rememberMe ?? false // Use rememberMe from login form
      );

      // Update profile cache
      queryClient.setQueryData(queryKeys.auth.profile, {
        user: data.user as unknown as User,
      });

      // Show success message
      toast.success('تم تسجيل الدخول بنجاح');
    },

    // onError removed - global API interceptor handles error toasts
  });

  // ============================================
  // LOGOUT MUTATION
  // ============================================

  /**
   * Logout mutation
   * Handles user logout and clears all caches
   */
  const logoutMutation = useMutation<void, ApiError, void>({
    mutationFn: authService.logout,

    onSuccess: () => {
      // Clear user store
      clearAuth();

      // Clear all React Query caches
      queryClient.clear();

      // Show success message
      toast.success('تم تسجيل الخروج بنجاح');
    },

    onError: () => {
      // Even if logout fails on server, clear local state
      clearAuth();
      queryClient.clear();

      // Note: Error toast shown by global API interceptor
      // Still show success since we cleared local data
      toast.success('تم تسجيل الخروج بنجاح');
    },
  });

  // ============================================
  // COMPUTED HELPERS
  // ============================================

  /**
   * Computed values based on user info
   * Memoized to prevent unnecessary re-renders
   */
  const computed = useMemo(() => {
    const user = (userInfo as User) || null;

    return {
      user,
      isAdmin: user?.role === UserRole.ADMIN,
      isAccountant: user?.role === UserRole.ACCOUNTANT,
    };
  }, [userInfo]);

  // ============================================
  // REFETCH HELPER
  // ============================================

  /**
   * Refetch profile helper
   * Wrapper around query refetch
   */
  const refetch = async (): Promise<void> => {
    await refetchProfile();
  };

  // ============================================
  // RETURN
  // ============================================

  return {
    // User data
    user: computed.user,

    // Loading states
    isLoading: isLoadingProfile,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,

    // Auth state
    isAuthenticated,

    // Computed helpers
    isAdmin: computed.isAdmin,
    isAccountant: computed.isAccountant,

    // Mutations
    login: loginMutation.mutateAsync,
    logout: () => logoutMutation.mutateAsync(),

    // Query helpers
    refetch,
  };
};

/**
 * Export default for backward compatibility
 */
export default useAuth;
