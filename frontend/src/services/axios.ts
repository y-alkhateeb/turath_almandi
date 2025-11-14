import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const getToken = (): string | null => {
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
};

const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
};

const getStorage = () => {
  return localStorage.getItem('auth-remember-me') === 'true' ? localStorage : sessionStorage;
};

// Create axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
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
            `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/auth/refresh`,
            { refresh_token: refreshToken }
          );

          const { access_token } = response.data;
          const storage = getStorage();
          storage.setItem('access_token', access_token);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('auth-remember-me');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
