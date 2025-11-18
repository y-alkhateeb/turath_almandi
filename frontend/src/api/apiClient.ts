/**
 * API Client
 * Axios wrapper with interceptors for authentication, token refresh, and error handling
 *
 * Features:
 * - Request interceptor for Authorization header
 * - Request ID generation for tracing
 * - Response interceptor for automatic token refresh on 401
 * - Error transformation (Axios → ApiError)
 * - Proper TypeScript typing (no any types)
 */

import axios, {
  type AxiosRequestConfig,
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { toast } from 'sonner';
import GLOBAL_CONFIG from '@/global-config';
import type { ErrorResponse, RefreshTokenResponse } from '#/api';

// ============================================
// CUSTOM API ERROR CLASS
// ============================================

/**
 * Custom API Error class
 * Extends native Error with additional properties for API errors
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly error: string;
  public readonly timestamp: string;
  public readonly path?: string;
  public readonly validationErrors?: string[];

  constructor(
    statusCode: number,
    message: string | string[],
    error: string,
    timestamp?: string,
    path?: string,
  ) {
    // Handle array of messages (validation errors)
    const errorMessage = Array.isArray(message) ? message.join(', ') : message;
    super(errorMessage);

    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.error = error;
    this.timestamp = timestamp || new Date().toISOString();
    this.path = path;

    // Store validation errors separately if message is an array
    if (Array.isArray(message)) {
      this.validationErrors = message;
    }

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }

    // Set the prototype explicitly (needed for extending built-ins in TypeScript)
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Get user-friendly error message in Arabic
   */
  public getUserMessage(): string {
    // Map common status codes to Arabic messages
    switch (this.statusCode) {
      case 400:
        return this.validationErrors
          ? `خطأ في البيانات المدخلة: ${this.validationErrors.join('، ')}`
          : 'خطأ في البيانات المدخلة';
      case 401:
        return 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى';
      case 403:
        return 'ليس لديك صلاحية للوصول إلى هذا المورد';
      case 404:
        return 'المورد المطلوب غير موجود';
      case 409:
        return 'هذا العنصر موجود بالفعل';
      case 422:
        return 'البيانات المدخلة غير صالحة';
      case 429:
        return 'تم تجاوز عدد المحاولات المسموح به، يرجى المحاولة لاحقاً';
      case 500:
        return 'خطأ في الخادم، يرجى المحاولة لاحقاً';
      case 502:
        return 'خطأ في الاتصال بالخادم';
      case 503:
        return 'الخدمة غير متاحة حالياً، يرجى المحاولة لاحقاً';
      case 504:
        return 'انتهت مهلة الاتصال بالخادم';
      default:
        return this.message || 'حدث خطأ غير متوقع';
    }
  }

  /**
   * Check if error is a validation error (400 with multiple messages)
   */
  public isValidationError(): boolean {
    return this.statusCode === 400 && this.validationErrors !== undefined;
  }

  /**
   * Create ApiError from Axios error
   */
  public static fromAxiosError(error: AxiosError<ErrorResponse>): ApiError {
    if (error.response) {
      // Server responded with error status
      const { data, status } = error.response;

      return new ApiError(
        data?.statusCode || status,
        data?.message || error.message,
        data?.error || 'Error',
        data?.timestamp,
        data?.path || error.config?.url,
      );
    }

    if (error.request) {
      // Request was made but no response received (network error)
      return new ApiError(
        0,
        'فشل الاتصال بالخادم. تحقق من اتصالك بالإنترنت.',
        'NetworkError',
        new Date().toISOString(),
        error.config?.url,
      );
    }

    // Something happened in setting up the request
    return new ApiError(
      0,
      error.message || 'حدث خطأ غير متوقع',
      'RequestError',
      new Date().toISOString(),
    );
  }
}

// ============================================
// TOKEN MANAGEMENT
// ============================================

/**
 * Get access token from storage
 */
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

/**
 * Get refresh token from storage
 */
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
 * Clear all auth data from both storages
 */
const clearAuthData = (): void => {
  localStorage.removeItem('auth-storage');
  sessionStorage.removeItem('auth-storage');
};

/**
 * Update access token in storage
 */
const updateAccessToken = (newAccessToken: string): void => {
  const storage = getStorage();

  try {
    const storageData = storage.getItem('auth-storage');
    if (storageData) {
      const parsed = JSON.parse(storageData);
      if (parsed.state?.userToken) {
        parsed.state.userToken.accessToken = newAccessToken;
        storage.setItem('auth-storage', JSON.stringify(parsed));
      }
    }
  } catch (error) {
    console.error('Error updating token in storage:', error);
  }
};

// ============================================
// REQUEST ID GENERATION
// ============================================

/**
 * Generate unique request ID for tracing
 * Format: timestamp-random
 */
const generateRequestId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${random}`;
};

// ============================================
// AXIOS INSTANCE
// ============================================

/**
 * Create axios instance with base configuration
 */
const axiosInstance = axios.create({
  baseURL: GLOBAL_CONFIG.apiBaseUrl,
  timeout: 120000, // 120 seconds to handle Render cold starts
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
});

// ============================================
// REQUEST INTERCEPTOR
// ============================================

/**
 * Request interceptor: Add auth token and request ID
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // Add Authorization header
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID for tracing
    if (config.headers) {
      config.headers['X-Request-ID'] = generateRequestId();
    }

    return config;
  },
  (error: AxiosError): Promise<never> => {
    return Promise.reject(ApiError.fromAxiosError(error));
  },
);

// ============================================
// RESPONSE INTERCEPTOR
// ============================================

/**
 * Flag to prevent multiple simultaneous token refresh requests
 */
let isRefreshing = false;

/**
 * Queue of failed requests waiting for token refresh
 */
let failedRequestsQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

/**
 * Process queued requests after token refresh
 */
const processQueue = (error: Error | null, token: string | null = null): void => {
  failedRequestsQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });

  failedRequestsQueue = [];
};

/**
 * Response interceptor: Handle token refresh and error transformation
 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse['data'] => {
    // Return response data directly (unwrap axios response)
    return response.data;
  },
  async (error: AxiosError<ErrorResponse>): Promise<never> => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Transform Axios error to ApiError
    const apiError = ApiError.fromAxiosError(error);

    // Handle 401 Unauthorized - Token refresh logic
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Check if we're already refreshing
      if (isRefreshing) {
        // Queue this request to be retried after refresh completes
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // Mark request as retried to prevent infinite loops
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call refresh endpoint
        const refreshResponse = await axios.post<RefreshTokenResponse>(
          `${GLOBAL_CONFIG.apiBaseUrl}/auth/refresh`,
          { refresh_token: refreshToken },
        );

        const { access_token, refresh_token: newRefreshToken } = refreshResponse.data;

        // Update tokens in storage
        updateAccessToken(access_token);

        // Update refresh token if provided
        if (newRefreshToken) {
          const storage = getStorage();
          try {
            const storageData = storage.getItem('auth-storage');
            if (storageData) {
              const parsed = JSON.parse(storageData);
              if (parsed.state?.userToken) {
                parsed.state.userToken.refreshToken = newRefreshToken;
                storage.setItem('auth-storage', JSON.stringify(parsed));
              }
            }
          } catch (storageError) {
            console.error('Error updating refresh token in storage:', storageError);
          }
        }

        // Process queued requests
        processQueue(null, access_token);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        isRefreshing = false;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear auth and redirect to login
        processQueue(
          refreshError instanceof Error ? refreshError : new Error('Token refresh failed'),
          null,
        );
        isRefreshing = false;

        clearAuthData();
        window.location.href = '/login';
        toast.error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى');

        return Promise.reject(apiError);
      }
    }

    // Show user-friendly error toast
    const userMessage = apiError.getUserMessage();

    // Don't show toast for certain status codes
    const silentStatusCodes = [401]; // 401 is handled above with redirect
    if (!silentStatusCodes.includes(apiError.statusCode)) {
      toast.error(userMessage);
    }

    return Promise.reject(apiError);
  },
);

// ============================================
// API CLIENT CLASS
// ============================================

/**
 * API Client class with typed methods
 * Provides a clean interface for making API requests
 */
class APIClient {
  /**
   * GET request
   */
  get<T>(config: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET' });
  }

  /**
   * POST request
   */
  post<T>(config: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST' });
  }

  /**
   * PUT request
   */
  put<T>(config: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT' });
  }

  /**
   * DELETE request
   */
  delete<T>(config: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  patch<T>(config: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH' });
  }

  /**
   * Generic request method
   */
  request<T>(config: AxiosRequestConfig): Promise<T> {
    return axiosInstance.request<T, T>(config);
  }
}

// ============================================
// EXPORTS
// ============================================

/**
 * Export singleton instance
 */
const apiClient = new APIClient();
export default apiClient;

/**
 * Export axios instance for direct use if needed
 */
export { axiosInstance };
