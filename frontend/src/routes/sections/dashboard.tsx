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
const DashboardPage = lazy(() => import('@/pages/dashboard/workbench'));
const TransactionsPage = lazy(() => import('@/pages/transactions/TransactionsPage'));
const IncomePage = lazy(() => import('@/pages/transactions/IncomePage'));
const CreateIncomePage = lazy(() => import('@/pages/transactions/CreateIncomePage'));
const ViewTransactionPage = lazy(() => import('@/pages/transactions/ViewTransactionPage'));
const EditTransactionPage = lazy(() => import('@/pages/transactions/EditTransactionPage'));
const DebtsPage = lazy(() => import('@/pages/debts/DebtsPage'));
const CreateDebtPage = lazy(() => import('@/pages/debts/CreateDebtPage'));
const PayDebtPage = lazy(() => import('@/pages/debts/PayDebtPage'));
const InventoryPage = lazy(() => import('@/pages/inventory/Inventory'));
const CreateInventoryPage = lazy(() => import('@/pages/inventory/CreateInventoryPage'));
const EditInventoryPage = lazy(() => import('@/pages/inventory/EditInventoryPage'));
const BranchesPage = lazy(() => import('@/pages/branches/BranchesPage'));
const CreateBranchPage = lazy(() => import('@/pages/branches/CreateBranchPage'));
const EditBranchPage = lazy(() => import('@/pages/branches/EditBranchPage'));
const UsersPage = lazy(() => import('@/pages/users/UsersPage'));
const CreateUserPage = lazy(() => import('@/pages/users/CreateUserPage'));
const EditUserPage = lazy(() => import('@/pages/users/EditUserPage'));

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
          {
            path: 'transactions/view/:id',
            element: (
              <LazyPage>
                <ViewTransactionPage />
              </LazyPage>
            ),
          },
          {
            path: 'transactions/edit/:id',
            element: (
              <LazyPage>
                <EditTransactionPage />
              </LazyPage>
            ),
          },
          // Income
          {
            path: 'income',
            element: (
              <LazyPage>
                <IncomePage />
              </LazyPage>
            ),
          },
          {
            path: 'income/create',
            element: (
              <LazyPage>
                <CreateIncomePage />
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
          {
            path: 'debts/create',
            element: (
              <LazyPage>
                <CreateDebtPage />
              </LazyPage>
            ),
          },
          {
            path: 'debts/pay/:id',
            element: (
              <LazyPage>
                <PayDebtPage />
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
          {
            path: 'inventory/create',
            element: (
              <LazyPage>
                <CreateInventoryPage />
              </LazyPage>
            ),
          },
          {
            path: 'inventory/edit/:id',
            element: (
              <LazyPage>
                <EditInventoryPage />
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
          {
            path: 'branches/create',
            element: (
              <LazyPage>
                <CreateBranchPage />
              </LazyPage>
            ),
          },
          {
            path: 'branches/edit/:id',
            element: (
              <LazyPage>
                <EditBranchPage />
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
          {
            path: 'users/create',
            element: (
              <LazyPage>
                <CreateUserPage />
              </LazyPage>
            ),
          },
          {
            path: 'users/edit/:id',
            element: (
              <LazyPage>
                <EditUserPage />
              </LazyPage>
            ),
          },
        ],
      },
    ],
  },
];
