/**
 * useAuth Hook
 * Authentication hook for backward compatibility
 * Uses the new userStore architecture
 */

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useUserInfo, useUserToken, useUserActions } from '@/store/userStore';
import { login as loginApi } from '@/api/services/userService';
import type { UserRole } from '#/enum';

export const useAuth = () => {
  const user = useUserInfo();
  const { accessToken } = useUserToken();
  const { setUserInfo, setUserToken, clearUserInfoAndToken } = useUserActions();
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = !!accessToken;

  const login = async (credentials: { username: string; password: string }) => {
    setIsLoading(true);
    try {
      const response = await loginApi(credentials);
      setUserToken({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });
      setUserInfo(response.user);
      toast.success('تم تسجيل الدخول بنجاح');
      return response;
    } catch (error) {
      toast.error('فشل تسجيل الدخول');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearUserInfoAndToken();
    toast.success('تم تسجيل الخروج بنجاح');
  };

  const helpers = useMemo(
    () => ({
      isAdmin: () => user?.role === 'ADMIN',
      isAccountant: () => user?.role === 'ACCOUNTANT',
      hasRole: (role: UserRole) => user?.role === role,
      canAccessBranch: (branchId: string | null | undefined) => {
        if (!user) return false;
        if (user.role === 'ADMIN') return true;
        if (user.role === 'ACCOUNTANT' && branchId) {
          return user.branchId === branchId;
        }
        return false;
      },
    }),
    [user]
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    ...helpers,
  };
};
