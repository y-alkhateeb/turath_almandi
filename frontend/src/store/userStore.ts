/**
 * User Store
 * Manages user authentication and user data using Zustand
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, UserToken } from '#/entity';
import { UserRole } from '#/enum';

type UserStore = {
  userInfo: Partial<User>;
  userToken: UserToken;
  actions: {
    setUserInfo: (userInfo: User) => void;
    setUserToken: (token: UserToken) => void;
    clearUserInfoAndToken: () => void;
  };
};

const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      userInfo: {},
      userToken: {},
      actions: {
        setUserInfo: (userInfo) =>
          set({
            userInfo,
          }),
        setUserToken: (token) =>
          set({
            userToken: token,
          }),
        clearUserInfoAndToken: () => {
          set({
            userInfo: {},
            userToken: {},
          });
        },
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => {
        // Check if "Remember Me" was used by checking both storages
        const localData = localStorage.getItem('auth-storage');
        const sessionData = sessionStorage.getItem('auth-storage');

        // If we have data in sessionStorage, use sessionStorage
        if (sessionData) {
          return sessionStorage;
        }
        // Otherwise use localStorage (default)
        return localStorage;
      }),
      partialize: (state) => ({
        userInfo: state.userInfo,
        userToken: state.userToken,
      }),
    }
  )
);

// Selectors
export const useUserInfo = () => useUserStore((state) => state.userInfo);
export const useUserToken = () => useUserStore((state) => state.userToken);
export const useUserPermissions = () => useUserStore((state) => state.userInfo.role || null);
export const useUserActions = () => useUserStore((state) => state.actions);

// Helper hooks
export const useIsAuthenticated = () => {
  const token = useUserToken();
  return !!token.accessToken;
};

export const useIsAdmin = () => {
  const userInfo = useUserInfo();
  return userInfo.role === UserRole.ADMIN;
};

export const useIsAccountant = () => {
  const userInfo = useUserInfo();
  return userInfo.role === UserRole.ACCOUNTANT;
};

export const useHasRole = (role: UserRole) => {
  const userInfo = useUserInfo();
  return userInfo.role === role;
};

export const useCanAccessBranch = (branchId?: string) => {
  const userInfo = useUserInfo();
  const isAdmin = userInfo.role === UserRole.ADMIN;

  // Admin can access all branches
  if (isAdmin) return true;

  // Accountant can only access their assigned branch
  if (!branchId) return true; // If no branch specified, allow access
  return userInfo.branchId === branchId;
};

export default useUserStore;
