/**
 * Error handling utility functions
 * Type-safe error extraction and formatting
 */

import { AxiosError } from 'axios';
import { ApiError } from '@/api/apiClient';
import type { ErrorResponse } from '#/api';

/**
 * Extract error message from unknown error type
 * Handles ApiError, AxiosError, Error, and string
 *
 * @param error - Error of unknown type
 * @returns User-friendly error message in Arabic
 */
export function getErrorMessage(error: unknown): string {
  // ApiError (custom class)
  if (error instanceof ApiError) {
    return error.getUserMessage();
  }

  // AxiosError
  if (error instanceof AxiosError) {
    if (error.response?.data) {
      const data = error.response.data as ErrorResponse;
      // Handle array of messages (validation errors)
      if (Array.isArray(data.message)) {
        return `خطأ في البيانات: ${data.message.join('، ')}`;
      }
      // Single message
      if (data.message) {
        return data.message;
      }
    }

    // No response data, use status code
    if (error.response?.status) {
      return getStatusCodeMessage(error.response.status);
    }

    // Network error
    if (error.code === 'ERR_NETWORK') {
      return 'خطأ في الاتصال بالشبكة، يرجى التحقق من اتصال الإنترنت';
    }

    // Timeout
    if (error.code === 'ECONNABORTED') {
      return 'انتهت مهلة الاتصال، يرجى المحاولة مرة أخرى';
    }

    // Generic Axios error
    return error.message || 'حدث خطأ في الاتصال بالخادم';
  }

  // Standard Error
  if (error instanceof Error) {
    return error.message || 'حدث خطأ غير متوقع';
  }

  // String
  if (typeof error === 'string') {
    return error;
  }

  // Unknown error type
  return 'حدث خطأ غير متوقع';
}

/**
 * Type guard to check if error is ApiError
 * @param error - Error to check
 * @returns true if error is ApiError instance
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Type guard to check if error is AxiosError
 * @param error - Error to check
 * @returns true if error is AxiosError instance
 */
export function isAxiosError(error: unknown): error is AxiosError {
  return error instanceof AxiosError;
}

/**
 * Type guard to check if error is validation error (400 with multiple messages)
 * @param error - Error to check
 * @returns true if error is validation error
 */
export function isValidationError(error: unknown): boolean {
  if (isApiError(error)) {
    return error.isValidationError();
  }

  if (isAxiosError(error)) {
    return error.response?.status === 400 && Array.isArray(error.response?.data?.message);
  }

  return false;
}

/**
 * Get validation errors from error
 * @param error - Error to extract validation errors from
 * @returns Array of validation error messages, or empty array
 */
export function getValidationErrors(error: unknown): string[] {
  if (isApiError(error)) {
    return error.validationErrors || [];
  }

  if (isAxiosError(error)) {
    const data = error.response?.data as ErrorResponse | undefined;
    if (data && Array.isArray(data.message)) {
      return data.message;
    }
  }

  return [];
}

/**
 * Map HTTP status code to user-friendly Arabic message
 * @param statusCode - HTTP status code
 * @returns User-friendly error message in Arabic
 */
export function getStatusCodeMessage(statusCode: number): string {
  switch (statusCode) {
    // 4xx Client Errors
    case 400:
      return 'خطأ في البيانات المدخلة';
    case 401:
      return 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى';
    case 403:
      return 'ليس لديك صلاحية للوصول إلى هذا المورد';
    case 404:
      return 'المورد المطلوب غير موجود';
    case 405:
      return 'العملية المطلوبة غير مسموح بها';
    case 408:
      return 'انتهت مهلة الطلب';
    case 409:
      return 'هذا العنصر موجود بالفعل';
    case 410:
      return 'المورد المطلوب لم يعد متاحاً';
    case 413:
      return 'حجم البيانات المرسلة كبير جداً';
    case 415:
      return 'نوع الملف غير مدعوم';
    case 422:
      return 'البيانات المدخلة غير صالحة';
    case 429:
      return 'تم تجاوز عدد المحاولات المسموح به، يرجى المحاولة لاحقاً';

    // 5xx Server Errors
    case 500:
      return 'خطأ في الخادم، يرجى المحاولة لاحقاً';
    case 501:
      return 'الخدمة غير مدعومة';
    case 502:
      return 'خطأ في الاتصال بالخادم';
    case 503:
      return 'الخدمة غير متاحة حالياً، يرجى المحاولة لاحقاً';
    case 504:
      return 'انتهت مهلة الاتصال بالخادم';

    // Default
    default:
      if (statusCode >= 400 && statusCode < 500) {
        return 'خطأ في الطلب، يرجى التحقق من البيانات';
      }
      if (statusCode >= 500) {
        return 'خطأ في الخادم، يرجى المحاولة لاحقاً';
      }
      return 'حدث خطأ غير متوقع';
  }
}

/**
 * Check if error is authentication error (401)
 * @param error - Error to check
 * @returns true if error is 401 Unauthorized
 */
export function isAuthenticationError(error: unknown): boolean {
  if (isApiError(error)) {
    return error.statusCode === 401;
  }

  if (isAxiosError(error)) {
    return error.response?.status === 401;
  }

  return false;
}

/**
 * Check if error is authorization error (403)
 * @param error - Error to check
 * @returns true if error is 403 Forbidden
 */
export function isAuthorizationError(error: unknown): boolean {
  if (isApiError(error)) {
    return error.statusCode === 403;
  }

  if (isAxiosError(error)) {
    return error.response?.status === 403;
  }

  return false;
}

/**
 * Check if error is not found error (404)
 * @param error - Error to check
 * @returns true if error is 404 Not Found
 */
export function isNotFoundError(error: unknown): boolean {
  if (isApiError(error)) {
    return error.statusCode === 404;
  }

  if (isAxiosError(error)) {
    return error.response?.status === 404;
  }

  return false;
}

/**
 * Check if error is network error
 * @param error - Error to check
 * @returns true if error is network error
 */
export function isNetworkError(error: unknown): boolean {
  if (isAxiosError(error)) {
    return error.code === 'ERR_NETWORK' || !error.response;
  }

  return false;
}

/**
 * Check if error is timeout error
 * @param error - Error to check
 * @returns true if error is timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  if (isAxiosError(error)) {
    return (
      error.code === 'ECONNABORTED' ||
      error.response?.status === 408 ||
      error.response?.status === 504
    );
  }

  if (isApiError(error)) {
    return error.statusCode === 408 || error.statusCode === 504;
  }

  return false;
}

/**
 * Get HTTP status code from error
 * @param error - Error to extract status code from
 * @returns HTTP status code, or undefined if not available
 */
export function getStatusCode(error: unknown): number | undefined {
  if (isApiError(error)) {
    return error.statusCode;
  }

  if (isAxiosError(error)) {
    return error.response?.status;
  }

  return undefined;
}

/**
 * Format error for logging (includes stack trace and details)
 * @param error - Error to format
 * @returns Formatted error object for logging
 */
export function formatErrorForLogging(error: unknown): {
  message: string;
  statusCode?: number;
  error?: string;
  stack?: string;
  timestamp: string;
  path?: string;
} {
  const timestamp = new Date().toISOString();

  if (isApiError(error)) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      error: error.error,
      stack: error.stack,
      timestamp: error.timestamp,
      path: error.path,
    };
  }

  if (isAxiosError(error)) {
    return {
      message: getErrorMessage(error),
      statusCode: error.response?.status,
      error: error.code,
      stack: error.stack,
      timestamp,
      path: error.config?.url,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      timestamp,
    };
  }

  return {
    message: getErrorMessage(error),
    timestamp,
  };
}
