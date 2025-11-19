/**
 * Dashboard Routes
 * Protected routes for authenticated users with lazy-loaded components
 *
 * Route Structure:
 * - /dashboard - Main dashboard
 * - /transactions/* - Transaction management (list, create, view, edit)
 * - /debts/* - Debt management (list, create, view)
 * - /inventory/* - Inventory management (list, create, edit)
 * - /reports - Reports page
 * - /notifications - Notifications (main and settings)
 * - /management/system/* - System management (admin-only: users, branches, audit)
 * - /profile - User profile
 */

import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/dashboard';
import { LoginAuthGuard } from '@/routes/components/login-auth-guard';
import { PageLoading } from '@/components/loading';
import type { RouteObject } from 'react-router-dom';

// ============================================
// LAZY-LOADED PAGES
// ============================================

// Dashboard
const DashboardPage = lazy(() => import('@/pages/dashboard/workbench'));

// Transactions
const TransactionsListPage = lazy(() => import('@/pages/transactions/list'));
const TransactionsCreatePage = lazy(() => import('@/pages/transactions/create'));
const TransactionsViewPage = lazy(() => import('@/pages/transactions/view/[id]'));
const TransactionsEditPage = lazy(() => import('@/pages/transactions/edit/[id]'));

// Debts
const DebtsListPage = lazy(() => import('@/pages/debts/list'));
const DebtsCreatePage = lazy(() => import('@/pages/debts/create'));
const DebtsViewPage = lazy(() => import('@/pages/debts/view/[id]'));

// Inventory
const InventoryListPage = lazy(() => import('@/pages/inventory/list'));
const InventoryCreatePage = lazy(() => import('@/pages/inventory/create'));
const InventoryEditPage = lazy(() => import('@/pages/inventory/edit/[id]'));

// Reports
const ReportsPage = lazy(() => import('@/pages/reports'));

// Notifications
const NotificationsPage = lazy(() => import('@/pages/notifications'));
const NotificationsSettingsPage = lazy(() => import('@/pages/notifications/settings'));

// Management / System (Admin-only)
const UsersListPage = lazy(() => import('@/pages/management/system/users/list'));
const UsersCreatePage = lazy(() => import('@/pages/management/system/users/create'));
const UsersEditPage = lazy(() => import('@/pages/management/system/users/edit/[id]'));

const BranchesListPage = lazy(() => import('@/pages/management/system/branches/list'));
const BranchesCreatePage = lazy(() => import('@/pages/management/system/branches/create'));
const BranchesEditPage = lazy(() => import('@/pages/management/system/branches/edit/[id]'));

const AuditLogPage = lazy(() => import('@/pages/management/system/audit'));

// Profile
const ProfilePage = lazy(() => import('@/pages/profile'));

// ============================================
// LAZY PAGE WRAPPER
// ============================================

/**
 * Suspense wrapper for lazy-loaded pages
 * Shows loading spinner while page loads
 */
function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoading />}>{children}</Suspense>;
}

// ============================================
// ROUTE CONFIGURATION
// ============================================

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

          // ============================================
          // DASHBOARD
          // ============================================
          {
            path: 'dashboard',
            element: (
              <LazyPage>
                <DashboardPage />
              </LazyPage>
            ),
          },

          // ============================================
          // TRANSACTIONS
          // ============================================
          {
            path: 'transactions',
            children: [
              // Redirect /transactions to /transactions/list
              {
                index: true,
                element: <Navigate to="/transactions/list" replace />,
              },
              {
                path: 'list',
                element: (
                  <LazyPage>
                    <TransactionsListPage />
                  </LazyPage>
                ),
              },
              {
                path: 'create',
                element: (
                  <LazyPage>
                    <TransactionsCreatePage />
                  </LazyPage>
                ),
              },
              {
                path: 'view/:id',
                element: (
                  <LazyPage>
                    <TransactionsViewPage />
                  </LazyPage>
                ),
              },
              {
                path: 'edit/:id',
                element: (
                  <LazyPage>
                    <TransactionsEditPage />
                  </LazyPage>
                ),
              },
            ],
          },

          // ============================================
          // DEBTS
          // ============================================
          {
            path: 'debts',
            children: [
              // Redirect /debts to /debts/list
              {
                index: true,
                element: <Navigate to="/debts/list" replace />,
              },
              {
                path: 'list',
                element: (
                  <LazyPage>
                    <DebtsListPage />
                  </LazyPage>
                ),
              },
              {
                path: 'create',
                element: (
                  <LazyPage>
                    <DebtsCreatePage />
                  </LazyPage>
                ),
              },
              {
                path: 'view/:id',
                element: (
                  <LazyPage>
                    <DebtsViewPage />
                  </LazyPage>
                ),
              },
            ],
          },

          // ============================================
          // INVENTORY
          // ============================================
          {
            path: 'inventory',
            children: [
              // Redirect /inventory to /inventory/list
              {
                index: true,
                element: <Navigate to="/inventory/list" replace />,
              },
              {
                path: 'list',
                element: (
                  <LazyPage>
                    <InventoryListPage />
                  </LazyPage>
                ),
              },
              {
                path: 'create',
                element: (
                  <LazyPage>
                    <InventoryCreatePage />
                  </LazyPage>
                ),
              },
              {
                path: 'edit/:id',
                element: (
                  <LazyPage>
                    <InventoryEditPage />
                  </LazyPage>
                ),
              },
            ],
          },

          // ============================================
          // REPORTS
          // ============================================
          {
            path: 'reports',
            element: (
              <LazyPage>
                <ReportsPage />
              </LazyPage>
            ),
          },

          // ============================================
          // NOTIFICATIONS
          // ============================================
          {
            path: 'notifications',
            children: [
              {
                index: true,
                element: (
                  <LazyPage>
                    <NotificationsPage />
                  </LazyPage>
                ),
              },
              {
                path: 'settings',
                element: (
                  <LazyPage>
                    <NotificationsSettingsPage />
                  </LazyPage>
                ),
              },
            ],
          },

          // ============================================
          // MANAGEMENT / SYSTEM (Admin-only)
          // Admin guards are implemented inside each page component
          // ============================================
          {
            path: 'management/system',
            children: [
              // Users Management
              {
                path: 'users',
                children: [
                  // Redirect /management/system/users to list
                  {
                    index: true,
                    element: <Navigate to="/management/system/users/list" replace />,
                  },
                  {
                    path: 'list',
                    element: (
                      <LazyPage>
                        <UsersListPage />
                      </LazyPage>
                    ),
                  },
                  {
                    path: 'create',
                    element: (
                      <LazyPage>
                        <UsersCreatePage />
                      </LazyPage>
                    ),
                  },
                  {
                    path: 'edit/:id',
                    element: (
                      <LazyPage>
                        <UsersEditPage />
                      </LazyPage>
                    ),
                  },
                ],
              },

              // Branches Management
              {
                path: 'branches',
                children: [
                  // Redirect /management/system/branches to list
                  {
                    index: true,
                    element: <Navigate to="/management/system/branches/list" replace />,
                  },
                  {
                    path: 'list',
                    element: (
                      <LazyPage>
                        <BranchesListPage />
                      </LazyPage>
                    ),
                  },
                  {
                    path: 'create',
                    element: (
                      <LazyPage>
                        <BranchesCreatePage />
                      </LazyPage>
                    ),
                  },
                  {
                    path: 'edit/:id',
                    element: (
                      <LazyPage>
                        <BranchesEditPage />
                      </LazyPage>
                    ),
                  },
                ],
              },

              // Audit Log
              {
                path: 'audit',
                element: (
                  <LazyPage>
                    <AuditLogPage />
                  </LazyPage>
                ),
              },
            ],
          },

          // ============================================
          // PROFILE
          // ============================================
          {
            path: 'profile',
            element: (
              <LazyPage>
                <ProfilePage />
              </LazyPage>
            ),
          },
        ],
      },
    ],
  },
];
