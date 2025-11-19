/**
 * ErrorBoundary Usage Examples
 *
 * This file demonstrates various ways to use the ErrorBoundary component
 * to catch and handle React errors in your application.
 */

import { useState } from 'react';
import { ErrorBoundary, ErrorBoundaryStandalone } from './ErrorBoundary';
import { ErrorInfo } from 'react';

// ============================================
// EXAMPLE 1: Basic Usage (Wrap Entire App)
// ============================================

/**
 * Most common usage: Wrap your entire app in ErrorBoundary
 * This catches all errors in the component tree
 */
function BasicExample() {
  return (
    <ErrorBoundary>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">تطبيقي</h1>
        <p>محتوى التطبيق هنا...</p>
      </div>
    </ErrorBoundary>
  );
}

// ============================================
// EXAMPLE 2: Wrap Specific Routes
// ============================================

/**
 * Wrap specific routes or sections to isolate errors
 */
function RouteExample() {
  return (
    <ErrorBoundary>
      <div className="dashboard">
        <h1>لوحة التحكم</h1>
        {/* Dashboard content */}
      </div>
    </ErrorBoundary>
  );
}

// ============================================
// EXAMPLE 3: Custom Error Handler
// ============================================

/**
 * Add custom error handling logic
 */
function CustomHandlerExample() {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // Send to analytics
    console.log('Custom error handler:', error.message);

    // Track in analytics
    // analytics.track('error', { message: error.message });
  };

  return (
    <ErrorBoundary onError={handleError}>
      <div className="content">
        <h1>المحتوى</h1>
      </div>
    </ErrorBoundary>
  );
}

// ============================================
// EXAMPLE 4: Custom Error Reporting
// ============================================

/**
 * Integrate with error tracking service (Sentry, LogRocket, etc.)
 */
function CustomReportingExample() {
  const reportToSentry = (error: Error, errorInfo: ErrorInfo) => {
    // Example: Sentry integration
    // Sentry.captureException(error, {
    //   contexts: {
    //     react: {
    //       componentStack: errorInfo.componentStack,
    //     },
    //   },
    // });

    console.log('Reporting to error tracking service:', error);
  };

  return (
    <ErrorBoundary reportError={reportToSentry}>
      <div className="app">
        <h1>التطبيق</h1>
      </div>
    </ErrorBoundary>
  );
}

// ============================================
// EXAMPLE 5: Custom Fallback UI
// ============================================

/**
 * Provide your own error fallback UI
 */
function CustomFallbackExample() {
  const customFallback = (error: Error, errorInfo: ErrorInfo, resetError: () => void) => {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50" dir="rtl">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-800 mb-4">عذراً!</h1>
          <p className="text-gray-700 mb-4">حدث خطأ في التطبيق</p>
          <p className="text-sm text-gray-600 mb-6 font-mono bg-gray-100 p-3 rounded">
            {error.message}
          </p>
          <button
            onClick={resetError}
            className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            حاول مرة أخرى
          </button>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary fallback={customFallback}>
      <div className="app">
        <h1>التطبيق</h1>
      </div>
    </ErrorBoundary>
  );
}

// ============================================
// EXAMPLE 6: Standalone (No Router)
// ============================================

/**
 * Use ErrorBoundaryStandalone outside of React Router context
 * (e.g., in Storybook, tests, or non-router apps)
 */
function StandaloneExample() {
  return (
    <ErrorBoundaryStandalone>
      <div className="widget">
        <h1>Widget خارج Router</h1>
      </div>
    </ErrorBoundaryStandalone>
  );
}

// ============================================
// EXAMPLE 7: Multiple Boundaries
// ============================================

/**
 * Use multiple error boundaries to isolate different sections
 * If one section crashes, others continue working
 */
function MultipleBoundariesExample() {
  return (
    <div className="app">
      {/* Main App Error Boundary */}
      <ErrorBoundary>
        <header className="header">
          <h1>الترويسة</h1>
        </header>
      </ErrorBoundary>

      <div className="content">
        {/* Sidebar Error Boundary */}
        <ErrorBoundary>
          <aside className="sidebar">
            <nav>القائمة الجانبية</nav>
          </aside>
        </ErrorBoundary>

        {/* Main Content Error Boundary */}
        <ErrorBoundary>
          <main className="main">
            <h2>المحتوى الرئيسي</h2>
          </main>
        </ErrorBoundary>
      </div>

      {/* Footer Error Boundary */}
      <ErrorBoundary>
        <footer className="footer">
          <p>التذييل</p>
        </footer>
      </ErrorBoundary>
    </div>
  );
}

// ============================================
// EXAMPLE 8: Testing Error Boundaries
// ============================================

/**
 * Component that throws an error for testing
 */
function BuggyComponent({ shouldCrash }: { shouldCrash: boolean }) {
  if (shouldCrash) {
    throw new Error('💥 Intentional crash for testing!');
  }

  return <div>Component is working fine ✅</div>;
}

/**
 * Demo showing error boundary in action
 */
function TestErrorBoundaryExample() {
  const [crash, setCrash] = useState(false);

  return (
    <div className="p-8" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">اختبار Error Boundary</h1>

      <button
        onClick={() => setCrash(true)}
        className="mb-6 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
      >
        تسبب في خطأ
      </button>

      <ErrorBoundary>
        <div className="p-6 bg-gray-50 rounded-lg">
          <BuggyComponent shouldCrash={crash} />
        </div>
      </ErrorBoundary>
    </div>
  );
}

// ============================================
// EXAMPLE 9: Nested Boundaries
// ============================================

/**
 * Nested error boundaries for granular error handling
 * Inner boundary catches errors first, outer boundary as fallback
 */
function NestedBoundariesExample() {
  return (
    <ErrorBoundary onError={(error) => console.log('Outer boundary:', error.message)}>
      <div className="outer">
        <h1>Outer Section</h1>

        <ErrorBoundary onError={(error) => console.log('Inner boundary:', error.message)}>
          <div className="inner">
            <h2>Inner Section</h2>
            {/* Error here caught by inner boundary */}
          </div>
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}

// ============================================
// EXAMPLE 10: With Lazy Loading
// ============================================

/**
 * Error boundary with React.lazy for code splitting
 */
function LazyLoadingExample() {
  const LazyComponent = React.lazy(() => import('./SomeHeavyComponent'));

  return (
    <ErrorBoundary>
      <React.Suspense fallback={<div>جاري التحميل...</div>}>
        <LazyComponent />
      </React.Suspense>
    </ErrorBoundary>
  );
}

// ============================================
// EXAMPLE 11: App Root Usage Pattern
// ============================================

/**
 * Recommended pattern for App.tsx or main.tsx
 */
function AppRootExample() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to error tracking service
        console.error('Application error:', error);
        console.error('Error info:', errorInfo);

        // Send to Sentry, LogRocket, etc.
        // errorTracker.captureException(error, { errorInfo });
      }}
      reportError={(error, errorInfo) => {
        // Additional reporting logic
        const errorReport = {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        };

        // Send to backend API
        // fetch('/api/errors', {
        //   method: 'POST',
        //   body: JSON.stringify(errorReport),
        // });
      }}
    >
      <div className="app">
        {/* Your entire app */}
      </div>
    </ErrorBoundary>
  );
}

// ============================================
// EXAMPLE 12: With Error State Management
// ============================================

/**
 * Manage error state alongside error boundary
 */
function ErrorStateExample() {
  const [hasGlobalError, setHasGlobalError] = useState(false);

  return (
    <ErrorBoundary
      onError={(error) => {
        setHasGlobalError(true);
        // Maybe show a toast notification
        // toast.error('حدث خطأ في التطبيق');
      }}
    >
      {hasGlobalError && (
        <div className="fixed top-4 right-4 p-4 bg-red-100 border border-red-400 rounded-lg">
          <p className="text-red-800">تم اكتشاف خطأ في التطبيق</p>
        </div>
      )}

      <div className="app">
        {/* App content */}
      </div>
    </ErrorBoundary>
  );
}

// ============================================
// RECOMMENDED PATTERNS
// ============================================

/**
 * PATTERN 1: Wrap entire app (most common)
 *
 * In your main App.tsx or Router component:
 *
 * <ErrorBoundary>
 *   <BrowserRouter>
 *     <Routes>
 *       ...
 *     </Routes>
 *   </BrowserRouter>
 * </ErrorBoundary>
 */

/**
 * PATTERN 2: Per-route boundaries (better isolation)
 *
 * <BrowserRouter>
 *   <Routes>
 *     <Route path="/" element={
 *       <ErrorBoundary>
 *         <HomePage />
 *       </ErrorBoundary>
 *     } />
 *     <Route path="/dashboard" element={
 *       <ErrorBoundary>
 *         <DashboardPage />
 *       </ErrorBoundary>
 *     } />
 *   </Routes>
 * </BrowserRouter>
 */

/**
 * PATTERN 3: Component-level boundaries (maximum isolation)
 *
 * Wrap individual complex components:
 *
 * <div className="page">
 *   <ErrorBoundary>
 *     <ComplexChart />
 *   </ErrorBoundary>
 *
 *   <ErrorBoundary>
 *     <DataTable />
 *   </ErrorBoundary>
 * </div>
 */

// ============================================
// ERROR TYPES TO CATCH
// ============================================

/**
 * ErrorBoundary catches:
 * - Rendering errors
 * - Lifecycle method errors
 * - Constructor errors in child components
 *
 * ErrorBoundary DOES NOT catch:
 * - Event handler errors (use try-catch)
 * - Async code errors (use try-catch or .catch())
 * - Server-side rendering errors
 * - Errors in the error boundary itself
 *
 * Example of errors NOT caught:
 */

function EventHandlerExample() {
  const handleClick = () => {
    // This error will NOT be caught by ErrorBoundary
    // Use try-catch instead:
    try {
      throw new Error('Error in event handler');
    } catch (error) {
      console.error('Caught in try-catch:', error);
    }
  };

  const handleAsyncOperation = async () => {
    // This error will NOT be caught by ErrorBoundary
    try {
      await fetch('/api/data');
    } catch (error) {
      console.error('Caught async error:', error);
    }
  };

  return (
    <ErrorBoundary>
      <button onClick={handleClick}>Click me (won't crash app)</button>
      <button onClick={handleAsyncOperation}>Async operation</button>
    </ErrorBoundary>
  );
}

// Export all examples
export {
  BasicExample,
  RouteExample,
  CustomHandlerExample,
  CustomReportingExample,
  CustomFallbackExample,
  StandaloneExample,
  MultipleBoundariesExample,
  TestErrorBoundaryExample,
  NestedBoundariesExample,
  LazyLoadingExample,
  AppRootExample,
  ErrorStateExample,
  EventHandlerExample,
};
