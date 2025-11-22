import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import GLOBAL_CONFIG from '@/global-config';

/**
 * Get access token from storage
 * Matches the new auth system structure: state.tokens.accessToken
 */
const getToken = (): string | null => {
  try {
    // Check localStorage first
    const localStore = localStorage.getItem('auth-storage');
    if (localStore) {
      const parsed = JSON.parse(localStore);
      if (parsed.state?.tokens?.accessToken) {
        return parsed.state.tokens.accessToken;
      }
    }

    // Check sessionStorage
    const sessionStore = sessionStorage.getItem('auth-storage');
    if (sessionStore) {
      const parsed = JSON.parse(sessionStore);
      if (parsed.state?.tokens?.accessToken) {
        return parsed.state.tokens.accessToken;
      }
    }

    // Fallback to old token structure for backward compatibility
    return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

/**
 * Get refresh token from storage
 * Matches the new auth system structure: state.tokens.refreshToken
 */
const getRefreshToken = (): string | null => {
  try {
    // Check localStorage first
    const localStore = localStorage.getItem('auth-storage');
    if (localStore) {
      const parsed = JSON.parse(localStore);
      if (parsed.state?.tokens?.refreshToken) {
        return parsed.state.tokens.refreshToken;
      }
    }

    // Check sessionStorage
    const sessionStore = sessionStorage.getItem('auth-storage');
    if (sessionStore) {
      const parsed = JSON.parse(sessionStore);
      if (parsed.state?.tokens?.refreshToken) {
        return parsed.state.tokens.refreshToken;
      }
    }

    // Fallback to old token structure for backward compatibility
    return localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

/**
 * Determine which storage to use based on where auth data exists
 */
const getStorage = (): Storage => {
  // If data exists in sessionStorage, use it
  if (sessionStorage.getItem('auth-storage')) {
    return sessionStorage;
  }
  return localStorage;
};

/**
 * Update access token in storage
 * Matches the new auth system structure: state.tokens.accessToken
 */
const updateAccessToken = (newAccessToken: string): void => {
  const storage = getStorage();

  try {
    const storageData = storage.getItem('auth-storage');
    if (storageData) {
      const parsed = JSON.parse(storageData);
      if (parsed.state?.tokens) {
        parsed.state.tokens.accessToken = newAccessToken;
        storage.setItem('auth-storage', JSON.stringify(parsed));
      }
    }
  } catch (error) {
    console.error('Error updating token in storage:', error);
  }
};

// Create axios instance
const axiosInstance = axios.create({
  baseURL: GLOBAL_CONFIG.apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();

        if (refreshToken) {
          const response = await axios.post(
            `${GLOBAL_CONFIG.apiBaseUrl}/auth/refresh`,
            { refresh_token: refreshToken }
          );

          const { access_token, refresh_token: newRefreshToken } = response.data;

          // Update tokens in storage
          updateAccessToken(access_token);

          // Update refresh token if provided
          if (newRefreshToken) {
            const storage = getStorage();
            try {
              const storageData = storage.getItem('auth-storage');
              if (storageData) {
                const parsed = JSON.parse(storageData);
                if (parsed.state?.tokens) {
                  parsed.state.tokens.refreshToken = newRefreshToken;
                  storage.setItem('auth-storage', JSON.stringify(parsed));
                }
              }
            } catch (storageError) {
              console.error('Error updating refresh token in storage:', storageError);
            }
          }

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user - clear all auth data
        localStorage.removeItem('auth-storage');
        sessionStorage.removeItem('auth-storage');
        // Also clear old token structure for backward compatibility
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        localStorage.removeItem('auth-remember-me');

        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      const errorMessage =
        (error.response?.data as { message?: string })?.message ||
        'Access denied. Insufficient permissions.';

      // Dynamically import toast to avoid circular dependencies
      import('../utils/toast').then(({ toast }) => {
        toast.error(errorMessage, 4000);
      });
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
export { axiosInstance as api };
