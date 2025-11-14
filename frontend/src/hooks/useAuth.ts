import { useAuthStore } from '@stores/authStore';
import { useMemo } from 'react';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuthStore();

  const helpers = useMemo(() => ({
    isAdmin: () => user?.role === 'ADMIN',
    isAccountant: () => user?.role === 'ACCOUNTANT',
    hasRole: (role: 'ADMIN' | 'ACCOUNTANT') => user?.role === role,
    canAccessBranch: (branchId: string | null | undefined) => {
      if (!user) return false;
      if (user.role === 'ADMIN') return true;
      if (user.role === 'ACCOUNTANT' && branchId) {
        return user.branchId === branchId;
      }
      return false;
    },
  }), [user]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    ...helpers,
  };
};
