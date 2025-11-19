/**
 * User Store - Auth State Persistence
 * Zustand store for persisting authentication state to localStorage/sessionStorage
 *
 * Purpose:
 * - Persist auth tokens across page reloads
 * - Store minimal user info for initial app load
 * - Handle "Remember Me" functionality (localStorage vs sessionStorage)
 *
 * Architecture:
 * - React Query manages server state (profile data)
 * - This store only handles persistence of auth state
 * - useAuth hook is the single source of truth for auth logic
 *
 * Note: Strict types, no `any`, User | null pattern
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '#/entity';

// ============================================
// TYPES
// ============================================

/**
 * Auth tokens
 * Stored separately from user for flexibility
 */
interface AuthTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

/**
 * User store state
 * Minimal state for auth persistence only
 */
interface UserStoreState {
  /** Current user (null if not authenticated) */
  user: User | null;

  /** Auth tokens (null if not authenticated) */
  tokens: AuthTokens;

  /** Whether user chose "Remember Me" */
  rememberMe: boolean;
}

/**
 * User store actions
 * Minimal actions for setting/clearing auth state
 */
interface UserStoreActions {
  /** Set user info (from login or profile fetch) */
  setUser: (user: User) => void;

  /** Set auth tokens (from login or refresh) */
  setTokens: (tokens: AuthTokens) => void;

  /** Set both user and tokens (convenience for login) */
  setAuth: (user: User, tokens: AuthTokens, rememberMe?: boolean) => void;

  /** Clear all auth state (logout) */
  clearAuth: () => void;

  /** Update user partially (for profile updates) */
  updateUser: (partial: Partial<User>) => void;
}

/**
 * Complete store type
 */
interface UserStore extends UserStoreState {
  actions: UserStoreActions;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: UserStoreState = {
  user: null,
  tokens: {
    accessToken: null,
    refreshToken: null,
  },
  rememberMe: false,
};

// ============================================
// STORAGE HELPERS
// ============================================

// Storage preference helper - not currently used but kept for potential future use
// const getStorageByPreference = (rememberMe: boolean): Storage => {
//   // Check if data exists in sessionStorage
//   const hasSessionData = sessionStorage.getItem('auth-storage') !== null;
//   // Check if data exists in localStorage
//   const hasLocalData = localStorage.getItem('auth-storage') !== null;
//
//   // If data exists in sessionStorage and not in localStorage, user is in session-only mode
//   if (hasSessionData && !hasLocalData) {
//     return sessionStorage;
//   }
//
//   // If data exists in localStorage, user has Remember Me enabled
//   if (hasLocalData) {
//     return localStorage;
//   }
//
//   // No existing data - use preference from login
//   return rememberMe ? localStorage : sessionStorage;
// };

/**
 * Migrate data between storages when rememberMe changes
 */
const migrateStorage = (fromStorage: Storage, toStorage: Storage): void => {
  const data = fromStorage.getItem('auth-storage');
  if (data) {
    toStorage.setItem('auth-storage', data);
    fromStorage.removeItem('auth-storage');
  }
};

// ============================================
// STORE CREATION
// ============================================

/**
 * User store with persistence
 * Persists to localStorage or sessionStorage based on "Remember Me"
 */
const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      actions: {
        /**
         * Set user info
         * Called after login or profile fetch
         */
        setUser: (user: User) => {
          set({ user });
        },

        /**
         * Set auth tokens
         * Called after login or token refresh
         */
        setTokens: (tokens: AuthTokens) => {
          set({ tokens });
        },

        /**
         * Set complete auth state
         * Convenience method for login flow
         */
        setAuth: (user: User, tokens: AuthTokens, rememberMe = false) => {
          const currentRememberMe = get().rememberMe;

          // If rememberMe preference changed, migrate storage
          if (currentRememberMe !== rememberMe) {
            const fromStorage = currentRememberMe ? localStorage : sessionStorage;
            const toStorage = rememberMe ? localStorage : sessionStorage;
            migrateStorage(fromStorage, toStorage);
          }

          set({ user, tokens, rememberMe });
        },

        /**
         * Clear all auth state
         * Called on logout or auth failure
         */
        clearAuth: () => {
          // Clear from both storages to be safe
          localStorage.removeItem('auth-storage');
          sessionStorage.removeItem('auth-storage');
          set(initialState);
        },

        /**
         * Update user partially
         * For profile updates without full re-login
         */
        updateUser: (partial: Partial<User>) => {
          set((state) => ({
            user: state.user ? { ...state.user, ...partial } : null,
          }));
        },
      },
    }),
    {
      name: 'auth-storage',

      /**
       * Storage strategy based on "Remember Me"
       * Uses custom storage getter that respects the rememberMe flag
       */
      storage: createJSONStorage(() => ({
        getItem: (name: string) => {
          // Check both storages and return data from whichever has it
          const sessionData = sessionStorage.getItem(name);
          if (sessionData) return sessionData;

          const localData = localStorage.getItem(name);
          if (localData) return localData;

          return null;
        },

        setItem: (name: string, value: string) => {
          try {
            const parsed = JSON.parse(value);
            const rememberMe = parsed.state?.rememberMe ?? false;

            // Use appropriate storage based on rememberMe preference
            const targetStorage = rememberMe ? localStorage : sessionStorage;
            const otherStorage = rememberMe ? sessionStorage : localStorage;

            // Set in target storage
            targetStorage.setItem(name, value);

            // Remove from other storage to prevent conflicts
            otherStorage.removeItem(name);
          } catch (error) {
            console.error('[UserStore] Error setting item:', error);
            // Fallback to localStorage if parsing fails
            localStorage.setItem(name, value);
          }
        },

        removeItem: (name: string) => {
          // Remove from both storages
          localStorage.removeItem(name);
          sessionStorage.removeItem(name);
        },
      })),

      /**
       * Partialize: only persist specific fields
       * Don't persist actions or computed values
       */
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        rememberMe: state.rememberMe,
      }),

      /**
       * Version for migrations (future-proofing)
       */
      version: 1,
    }
  )
);

// ============================================
// SELECTORS (Hook Exports)
// ============================================

/**
 * Get current user
 * Returns null if not authenticated
 */
export const useUserInfo = (): User | null => {
  return useUserStore((state) => state.user);
};

/**
 * Get auth tokens
 * Returns { accessToken: null, refreshToken: null } if not authenticated
 */
export const useUserToken = (): AuthTokens => {
  return useUserStore((state) => state.tokens);
};

/**
 * Get store actions
 * Use for setting/clearing auth state
 */
export const useUserActions = (): UserStoreActions => {
  return useUserStore((state) => state.actions);
};

/**
 * Get remember me preference
 */
export const useRememberMe = (): boolean => {
  return useUserStore((state) => state.rememberMe);
};

// ============================================
// HELPER SELECTORS (DEPRECATED - Use useAuth instead)
// ============================================

/**
 * @deprecated Use `useAuth().isAuthenticated` instead
 * Check if user is authenticated
 */
export const useIsAuthenticated = (): boolean => {
  const tokens = useUserToken();
  return !!tokens.accessToken;
};

/**
 * @deprecated Use `useAuth().isAdmin` instead
 * Check if user is admin
 */
export const useIsAdmin = (): boolean => {
  const user = useUserInfo();
  return user?.role === 'ADMIN';
};

/**
 * @deprecated Use `useAuth().isAccountant` instead
 * Check if user is accountant
 */
export const useIsAccountant = (): boolean => {
  const user = useUserInfo();
  return user?.role === 'ACCOUNTANT';
};

// ============================================
// EXPORTS
// ============================================

/**
 * Export store for direct access (rare cases only)
 * Prefer using selector hooks above
 */
export default useUserStore;

/**
 * Export store type for testing
 */
export type { UserStore, UserStoreState, UserStoreActions, AuthTokens };
