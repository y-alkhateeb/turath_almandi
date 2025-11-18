import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/ui/alert';
import { Button } from '@/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * ErrorAlert - Reusable error display component
 *
 * Displays error messages with optional retry functionality.
 * Provides consistent error handling across all pages.
 *
 * @example
 * ```tsx
 * <ErrorAlert
 *   error={error}
 *   message="فشل تحميل البيانات"
 *   onRetry={refetch}
 * />
 * ```
 */

export interface ErrorAlertProps {
  /** Error object or error message */
  error?: Error | string | null;
  /** Optional custom error message */
  message?: string;
  /** Optional title (default: "حدث خطأ") */
  title?: string;
  /** Optional retry callback */
  onRetry?: () => void;
  /** Optional retry button text (default: "إعادة المحاولة") */
  retryText?: string;
  /** Optional: Show error details in development */
  showDetails?: boolean;
  /** Optional: Custom class name */
  className?: string;
}

export function ErrorAlert({
  error,
  message,
  title = 'حدث خطأ',
  onRetry,
  retryText = 'إعادة المحاولة',
  showDetails = false,
  className = '',
}: ErrorAlertProps) {
  // Don't render if no error
  if (!error) return null;

  // Extract error message
  const errorMessage =
    message ||
    (typeof error === 'string' ? error : error.message) ||
    'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';

  // Show detailed error in development mode
  const isDevelopment = import.meta.env.DEV;
  const showErrorDetails = showDetails && isDevelopment && typeof error !== 'string';

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <div className="space-y-3">
          <p>{errorMessage}</p>

          {/* Error Details (Development Only) */}
          {showErrorDetails && error instanceof Error && (
            <details className="text-xs mt-2">
              <summary className="cursor-pointer font-medium">تفاصيل الخطأ (للمطورين)</summary>
              <pre className="mt-2 p-2 bg-red-100 rounded text-red-800 overflow-x-auto">
                {error.stack || error.message}
              </pre>
            </details>
          )}

          {/* Retry Button */}
          {onRetry && (
            <div className="flex items-center gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="w-4 h-4 ml-2" />
                {retryText}
              </Button>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
