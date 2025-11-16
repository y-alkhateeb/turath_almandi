import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { useAuth } from '@hooks/useAuth';
import MainLayout from '@components/layout/MainLayout';
import ProtectedRoute from '@components/ProtectedRoute';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';

// Lazy load page components for code splitting
const LoginPage = lazy(() => import('@pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('@pages/dashboard/DashboardPage'));
const BranchesPage = lazy(() => import('@pages/branches').then(module => ({ default: module.BranchesPage })));
const UsersPage = lazy(() => import('@pages/users').then(module => ({ default: module.UsersPage })));
const TransactionsPage = lazy(() => import('@pages/transactions/TransactionsPage'));
const DebtsPage = lazy(() => import('@pages/debts').then(module => ({ default: module.DebtsPage })));
const InventoryPage = lazy(() => import('@pages/inventory/Inventory'));

// Public Route Component (redirect to dashboard if already authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="lg" />
  </div>
);

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="debts" element={<DebtsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="branches" element={<BranchesPage />} />
          <Route path="users" element={<UsersPage />} />
          {/* Add more protected routes here */}
        </Route>

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
