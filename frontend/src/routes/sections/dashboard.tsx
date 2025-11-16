/**
 * Dashboard Routes
 * Protected routes for authenticated users
 */

import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/dashboard';
import { LoginAuthGuard } from '@/routes/components/login-auth-guard';
import { PageLoading } from '@/components/loading';
import type { RouteObject } from 'react-router-dom';

// Lazy load dashboard pages
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const TransactionsPage = lazy(() => import('@/pages/transactions/TransactionsPage'));
const IncomePage = lazy(() => import('@/pages/transactions/IncomePage'));
const DebtsPage = lazy(() => import('@/pages/debts/DebtsPage'));
const InventoryPage = lazy(() => import('@/pages/inventory/Inventory'));
const BranchesPage = lazy(() => import('@/pages/branches/BranchesPage'));
const UsersPage = lazy(() => import('@/pages/users/UsersPage'));

// Page wrapper with suspense
function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoading />}>{children}</Suspense>;
}

export const dashboardRoutes: RouteObject[] = [
  {
    path: '/',
    element: <LoginAuthGuard />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          // Redirect root to dashboard
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          // Dashboard
          {
            path: 'dashboard',
            element: (
              <LazyPage>
                <DashboardPage />
              </LazyPage>
            ),
          },
          // Transactions
          {
            path: 'transactions',
            element: (
              <LazyPage>
                <TransactionsPage />
              </LazyPage>
            ),
          },
          // Income (specific transaction page)
          {
            path: 'income',
            element: (
              <LazyPage>
                <IncomePage />
              </LazyPage>
            ),
          },
          // Debts
          {
            path: 'debts',
            element: (
              <LazyPage>
                <DebtsPage />
              </LazyPage>
            ),
          },
          // Inventory
          {
            path: 'inventory',
            element: (
              <LazyPage>
                <InventoryPage />
              </LazyPage>
            ),
          },
          // Branches (Admin only - will be protected by AuthGuard inside the page)
          {
            path: 'branches',
            element: (
              <LazyPage>
                <BranchesPage />
              </LazyPage>
            ),
          },
          // Users (Admin only - will be protected by AuthGuard inside the page)
          {
            path: 'users',
            element: (
              <LazyPage>
                <UsersPage />
              </LazyPage>
            ),
          },
        ],
      },
    ],
  },
];
