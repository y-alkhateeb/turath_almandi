/**
 * ErrorBoundary Component
 *
 * React 18 Error Boundary that:
 * - Catches React errors in child components
 * - Shows user-friendly error UI with message
 * - Provides reload button to recover
 * - Reports errors to console (and error tracking service)
 * - Resets error boundary on navigation
 * - Strict TypeScript types
 *
 * Usage:
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */

import { Component, ErrorInfo, ReactNode, useState } from 'react';
import { useLocation } from 'react-router-dom';

// ============================================
// TYPES
// ============================================

interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;

  /** Custom fallback component */
  fallback?: (error: Error, errorInfo: ErrorInfo, resetError: () => void) => ReactNode;

  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;

  /** Custom error reporting function */
  reportError?: (error: Error, errorInfo: ErrorInfo) => void;

  /** Current location (from router) */
  location?: string;
}

interface ErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;

  /** The error that occurred */
  error: Error | null;

  /** Additional error information */
  errorInfo: ErrorInfo | null;
}

// ============================================
// ERROR BOUNDARY COMPONENT
// ============================================

/**
 * Error Boundary Class Component
 * Must be a class component as error boundaries are not available as hooks yet
 */
class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when an error is caught
   * This is called during the render phase
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error details when an error is caught
   * This is called during the commit phase
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Store error info in state
    this.setState({ errorInfo });

    // Report to console
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);
    console.error('Component stack:', errorInfo.componentStack);

    // Call custom onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking service
    this.reportToErrorService(error, errorInfo);

    // Call custom reportError if provided
    if (this.props.reportError) {
      this.props.reportError(error, errorInfo);
    }
  }

  /**
   * Reset error boundary on location change (navigation)
   */
  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.hasError && this.props.location !== prevProps.location) {
      this.resetErrorBoundary();
    }
  }

  /**
   * Report error to error tracking service
   * Can be replaced with actual service like Sentry, LogRocket, etc.
   */
  private reportToErrorService(error: Error, errorInfo: ErrorInfo): void {
    // TODO: Replace with actual error tracking service
    // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });

    // For now, just log to console with additional context
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.error('[Error Tracking Service]', errorReport);

    // Uncomment when integrating with error tracking service:
    // if (window.errorTracker) {
    //   window.errorTracker.captureException(error, errorReport);
    // }
  }

  /**
   * Reset error boundary state
   */
  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Reload the page
   */
  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback && errorInfo) {
        return fallback(error, errorInfo, this.resetErrorBoundary);
      }

      // Default error UI
      return (
        <ErrorFallback
          error={error}
          errorInfo={errorInfo}
          resetError={this.resetErrorBoundary}
          reloadPage={this.handleReload}
        />
      );
    }

    return children;
  }
}

// ============================================
// ERROR FALLBACK UI COMPONENT
// ============================================

interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
  reloadPage: () => void;
}

function ErrorFallback({ error, errorInfo, resetError, reloadPage }: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4"
      dir="rtl"
    >
      <div className="max-w-2xl w-full">
        {/* Error Card */}
        <div className="bg-white rounded-lg shadow-xl border-2 border-red-200 overflow-hidden">
          {/* Header */}
          <div className="bg-red-50 border-b-2 border-red-200 px-6 py-4">
            <div className="flex items-center gap-3">
              {/* Error Icon */}
              <div className="flex-shrink-0">
                <svg
                  className="h-10 w-10 text-red-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              {/* Title */}
              <div className="flex-1">
                <h1 className="text-xl font-bold text-red-900">حدث خطأ غير متوقع</h1>
                <p className="text-sm text-red-700 mt-1">
                  عذراً، حدث خطأ أثناء تحميل هذه الصفحة
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-4">
            {/* Error Message */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-900 mb-1">رسالة الخطأ:</p>
              <p className="text-sm text-red-800 font-mono break-words">
                {error.message || 'خطأ غير معروف'}
              </p>
            </div>

            {/* Suggestions */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">ما يمكنك فعله:</p>
              <ul className="text-sm text-gray-600 space-y-2 mr-4">
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 mt-1">•</span>
                  <span>حاول إعادة تحميل الصفحة باستخدام الزر أدناه</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 mt-1">•</span>
                  <span>تحقق من اتصالك بالإنترنت</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 mt-1">•</span>
                  <span>امسح ذاكرة التخزين المؤقت للمتصفح</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 mt-1">•</span>
                  <span>إذا استمرت المشكلة، تواصل مع الدعم الفني</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={reloadPage}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
              >
                إعادة تحميل الصفحة
              </button>
              <button
                onClick={resetError}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                محاولة مرة أخرى
              </button>
            </div>

            {/* Toggle Details */}
            <div className="pt-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-gray-600 hover:text-gray-900 underline focus:outline-none"
              >
                {showDetails ? 'إخفاء التفاصيل التقنية' : 'عرض التفاصيل التقنية'}
              </button>
            </div>

            {/* Technical Details */}
            {showDetails && (
              <div className="space-y-3 pt-2">
                {/* Error Stack */}
                {error.stack && (
                  <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                      Stack Trace
                    </summary>
                    <pre className="mt-2 text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap break-words font-mono">
                      {error.stack}
                    </pre>
                  </details>
                )}

                {/* Component Stack */}
                {errorInfo?.componentStack && (
                  <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                      Component Stack
                    </summary>
                    <pre className="mt-2 text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap break-words font-mono">
                      {errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
            <p className="text-xs text-gray-500 text-center">
              تم تسجيل هذا الخطأ وسيتم مراجعته من قبل فريق التطوير
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-sm text-primary-600 hover:text-primary-700 underline"
          >
            العودة إلى الصفحة الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================
// WRAPPER WITH ROUTER INTEGRATION
// ============================================

/**
 * ErrorBoundary wrapper that integrates with React Router
 * Automatically resets error boundary on navigation
 */
export function ErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, 'location'>) {
  const location = useLocation();

  return (
    <ErrorBoundaryClass {...props} location={location.pathname}>
      {children}
    </ErrorBoundaryClass>
  );
}

/**
 * ErrorBoundary without router integration
 * Use this if you need error boundary outside of router context
 */
export function ErrorBoundaryStandalone(props: Omit<ErrorBoundaryProps, 'location'>) {
  return <ErrorBoundaryClass {...props}>{props.children}</ErrorBoundaryClass>;
}

export default ErrorBoundary;
