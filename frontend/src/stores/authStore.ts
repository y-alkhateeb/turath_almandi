import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User, LoginCredentials } from '@types/auth.types';
import { authService } from '@services/auth.service';

const STORAGE_KEY = 'auth-storage';
const REMEMBER_ME_KEY = 'auth-remember-me';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(credentials);

          // Store tokens based on rememberMe
          const storage = credentials.rememberMe ? localStorage : sessionStorage;
          storage.setItem('access_token', response.access_token);
          storage.setItem('refresh_token', response.refresh_token);

          if (credentials.rememberMe) {
            localStorage.setItem(REMEMBER_ME_KEY, 'true');
          } else {
            localStorage.removeItem(REMEMBER_ME_KEY);
          }

          set({
            user: response.user,
            token: response.access_token,
            refreshToken: response.refresh_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        // Clear tokens from both storages
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem(REMEMBER_ME_KEY);
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');

        // Clear state
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });

        // Call logout API
        authService.logout().catch(console.error);
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      setToken: (token: string) => {
        const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('access_token', token);
        set({ token });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
