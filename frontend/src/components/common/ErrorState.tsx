/**
 * ErrorState - Presentational Component
 * Displays error state with status-based Arabic messages
 *
 * Features:
 * - Error icon (red alert circle)
 * - Status code to Arabic message mapping
 * - Retry button (optional)
 * - RTL support
 * - Responsive
 */

import { AlertCircle, RefreshCw } from 'lucide-react';
import { ApiError } from '@/api/apiClient';

// ============================================
// TYPES
// ============================================

export interface ErrorStateProps {
  error: Error | ApiError;
  onRetry?: () => void;
  className?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if error is ApiError
 */
function isApiError(error: Error | ApiError): error is ApiError {
  return 'statusCode' in error;
}

/**
 * Check if error is a network error
 */
function isNetworkError(error: Error | ApiError): boolean {
  // Check for common network error indicators
  if (error.message.toLowerCase().includes('network')) return true;
  if (error.message.toLowerCase().includes('failed to fetch')) return true;
  if (error.message.toLowerCase().includes('network request failed')) return true;
  if (error.message === 'Network Error') return true;

  // Check for ERR_NETWORK or similar codes
  if ('code' in error && typeof error.code === 'string') {
    const code = error.code.toLowerCase();
    if (code.includes('network') || code === 'err_network') return true;
  }

  return false;
}

/**
 * Map HTTP status code to Arabic error message
 */
function getErrorMessage(error: Error | ApiError): {
  title: string;
  description: string;
} {
  // Check for network errors first
  if (isNetworkError(error)) {
    return {
      title: 'خطأ في الاتصال',
      description: 'تعذر الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى.',
    };
  }

  // If it's an ApiError, use status code mapping
  if (isApiError(error)) {
    const statusCode = error.statusCode;

    switch (statusCode) {
      case 400:
        return {
          title: 'طلب غير صحيح',
          description: error.message || 'البيانات المرسلة غير صحيحة. يرجى التحقق والمحاولة مرة أخرى.',
        };

      case 401:
        return {
          title: 'غير مصرح',
          description: 'يرجى تسجيل الدخول للمتابعة.',
        };

      case 403:
        return {
          title: 'ليس لديك صلاحية',
          description: 'ليس لديك الصلاحية للوصول إلى هذا المحتوى.',
        };

      case 404:
        return {
          title: 'البيانات غير موجودة',
          description: 'المحتوى الذي تبحث عنه غير موجود أو تم حذفه.',
        };

      case 409:
        return {
          title: 'تعارض في البيانات',
          description: error.message || 'البيانات المرسلة تتعارض مع البيانات الموجودة.',
        };

      case 422:
        return {
          title: 'خطأ في التحقق من البيانات',
          description:
            error.validationErrors?.join(', ') ||
            error.message ||
            'البيانات المدخلة لا تطابق المتطلبات.',
        };

      case 429:
        return {
          title: 'طلبات كثيرة جداً',
          description: 'تم تجاوز عدد الطلبات المسموح به. يرجى المحاولة لاحقاً.',
        };

      case 500:
        return {
          title: 'خطأ في الخادم',
          description: 'حدث خطأ غير متوقع في الخادم. يرجى المحاولة مرة أخرى لاحقاً.',
        };

      case 502:
        return {
          title: 'خطأ في البوابة',
          description: 'الخادم غير متاح حالياً. يرجى المحاولة مرة أخرى لاحقاً.',
        };

      case 503:
        return {
          title: 'الخدمة غير متوفرة',
          description: 'الخدمة غير متوفرة حالياً. يرجى المحاولة مرة أخرى لاحقاً.',
        };

      case 504:
        return {
          title: 'انتهت مهلة البوابة',
          description: 'استغرق الطلب وقتاً طويلاً. يرجى المحاولة مرة أخرى.',
        };

      default:
        // For unknown status codes
        if (statusCode >= 500) {
          return {
            title: 'خطأ في الخادم',
            description: error.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقاً.',
          };
        }
        return {
          title: 'حدث خطأ',
          description: error.message || 'حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.',
        };
    }
  }

  // Generic error (not ApiError)
  return {
    title: 'حدث خطأ',
    description: error.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
  };
}

// ============================================
// COMPONENT
// ============================================

export function ErrorState({ error, onRetry, className = '' }: ErrorStateProps) {
  const { title, description } = getErrorMessage(error);

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
      dir="rtl"
    >
      {/* Error Icon */}
      <div className="w-16 h-16 mb-4 rounded-full bg-red-100 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>

      {/* Error Title */}
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </h3>

      {/* Error Description */}
      <p className="text-sm text-[var(--text-secondary)] max-w-md mb-6">
        {description}
      </p>

      {/* Retry Button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          إعادة المحاولة
        </button>
      )}

      {/* Additional Error Info (for development) */}
      {process.env.NODE_ENV === 'development' && isApiError(error) && (
        <details className="mt-6 text-xs text-left">
          <summary className="cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
            تفاصيل الخطأ (للتطوير فقط)
          </summary>
          <pre className="mt-2 p-4 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg overflow-x-auto text-[var(--text-secondary)]">
            {JSON.stringify(
              {
                statusCode: error.statusCode,
                error: error.error,
                message: error.message,
                path: error.path,
                timestamp: error.timestamp,
                validationErrors: error.validationErrors,
              },
              null,
              2
            )}
          </pre>
        </details>
      )}
    </div>
  );
}

export default ErrorState;
