/**
 * API Client
 * Axios wrapper with interceptors for authentication and error handling
 */

import axios, { type AxiosRequestConfig, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import GLOBAL_CONFIG from '@/global-config';
import { ResultStatus } from '#/enum';
import type { Result } from '#/api';

// Get token from storage (check both localStorage and sessionStorage)
const getToken = (): string | null => {
  try {
    // Check localStorage first
    const localStore = localStorage.getItem('auth-storage');
    if (localStore) {
      const parsed = JSON.parse(localStore);
      if (parsed.state?.userToken?.accessToken) {
        return parsed.state.userToken.accessToken;
      }
    }

    // Check sessionStorage
    const sessionStore = sessionStorage.getItem('auth-storage');
    if (sessionStore) {
      const parsed = JSON.parse(sessionStore);
      if (parsed.state?.userToken?.accessToken) {
        return parsed.state.userToken.accessToken;
      }
    }
  } catch (error) {
    console.error('Error getting token:', error);
  }

  return null;
};

// Get refresh token from storage
const getRefreshToken = (): string | null => {
  try {
    // Check localStorage first
    const localStore = localStorage.getItem('auth-storage');
    if (localStore) {
      const parsed = JSON.parse(localStore);
      if (parsed.state?.userToken?.refreshToken) {
        return parsed.state.userToken.refreshToken;
      }
    }

    // Check sessionStorage
    const sessionStore = sessionStorage.getItem('auth-storage');
    if (sessionStore) {
      const parsed = JSON.parse(sessionStore);
      if (parsed.state?.userToken?.refreshToken) {
        return parsed.state.userToken.refreshToken;
      }
    }
  } catch (error) {
    console.error('Error getting refresh token:', error);
  }

  return null;
};

// Determine which storage to use
const getStorage = () => {
  // If data exists in sessionStorage, use it
  if (sessionStorage.getItem('auth-storage')) {
    return sessionStorage;
  }
  return localStorage;
};

// Clear all auth data
const clearAuthData = () => {
  localStorage.removeItem('auth-storage');
  sessionStorage.removeItem('auth-storage');
};

// Create axios instance
const axiosInstance = axios.create({
  baseURL: GLOBAL_CONFIG.apiBaseUrl,
  timeout: 120000, // 120 seconds to handle Render cold starts
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
});

// Request interceptor: Add auth token
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

// Response interceptor: Handle responses and errors
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('=== AXIOS INTERCEPTOR DEBUG ===');
    console.log('Response status:', response.status);
    console.log('Response statusText:', response.statusText);
    console.log('Response data:', response.data);
    console.log('Response data type:', typeof response.data);
    console.log('==============================');

    // If the API wraps responses in a Result object, unwrap it
    const { data } = response;

    // Check if it's a Result wrapper
    if (data && typeof data === 'object' && 'status' in data) {
      const result = data as Result;

      if (result.status === ResultStatus.SUCCESS) {
        console.log('Unwrapping Result.data:', result.data);
        return result.data;
      }

      // Handle error status in Result
      const message = result.message || 'حدث خطأ غير متوقع';
      toast.error(message);
      return Promise.reject(new Error(message));
    }

    // Return data as is if not wrapped
    console.log('Returning data as-is (not wrapped):', data);
    return data;
  },
  async (error: AxiosError<Result>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const { response } = error;

    // Extract error message
    let errorMessage = 'حدث خطأ في الاتصال بالخادم';

    if (response?.data?.message) {
      errorMessage = response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Handle 401 Unauthorized - Try to refresh token
    if (response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();

        if (refreshToken) {
          const refreshResponse = await axios.post(
            `${GLOBAL_CONFIG.apiBaseUrl}/auth/refresh`,
            { refresh_token: refreshToken }
          );

          const { access_token } = refreshResponse.data;
          const storage = getStorage();

          // Update token in storage
          try {
            const storageData = storage.getItem('auth-storage');
            if (storageData) {
              const parsed = JSON.parse(storageData);
              parsed.state.userToken.accessToken = access_token;
              storage.setItem('auth-storage', JSON.stringify(parsed));
            }
          } catch (storageError) {
            console.error('Error updating token in storage:', storageError);
          }

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear auth data and redirect to login
        clearAuthData();
        window.location.href = '/login';
        toast.error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى');
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden
    if (response?.status === 403) {
      toast.error('ليس لديك صلاحية للوصول إلى هذا المورد');
    }

    // Handle other errors
    if (response?.status && response.status >= 500) {
      toast.error('خطأ في الخادم، يرجى المحاولة لاحقاً');
    }

    // Show error toast for client errors (400-499) except 401 and 403
    if (response?.status && response.status >= 400 && response.status < 500 && response.status !== 401 && response.status !== 403) {
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

// API Client class
class APIClient {
  get<T = any>(config: AxiosRequestConfig): Promise<T> {
    return this.request({ ...config, method: 'GET' });
  }

  post<T = any>(config: AxiosRequestConfig): Promise<T> {
    return this.request({ ...config, method: 'POST' });
  }

  put<T = any>(config: AxiosRequestConfig): Promise<T> {
    return this.request({ ...config, method: 'PUT' });
  }

  delete<T = any>(config: AxiosRequestConfig): Promise<T> {
    return this.request({ ...config, method: 'DELETE' });
  }

  patch<T = any>(config: AxiosRequestConfig): Promise<T> {
    return this.request({ ...config, method: 'PATCH' });
  }

  request<T = any>(config: AxiosRequestConfig): Promise<T> {
    return axiosInstance.request<any, T>(config);
  }
}

// Export singleton instance
const apiClient = new APIClient();
export default apiClient;

// Also export the axios instance for direct use if needed
export { axiosInstance };
