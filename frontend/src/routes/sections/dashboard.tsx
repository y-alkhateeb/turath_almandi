/**
 * Dashboard Routes
 * Protected routes for authenticated users with lazy-loaded components
 */

import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/dashboard';
import { LoginAuthGuard } from '@/routes/components/login-auth-guard';
import { AdminRouteGuard } from '@/routes/components/admin-route-guard';
import type { RouteObject } from 'react-router-dom';

// Lazy load pages
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const TransactionsPage = lazy(() => import('@/pages/transactions/TransactionsPage'));
const CreateExpensePage = lazy(() => import('@/pages/transactions/CreateExpensePage'));
const CreateIncomePage = lazy(() => import('@/pages/transactions/CreateIncomePage'));
const ContactsPage = lazy(() => import('@/pages/contacts/ContactsPage'));
const InventoryPage = lazy(() => import('@/pages/inventory/InventoryPage'));
const CreateInventoryItemPage = lazy(() => import('@/pages/inventory/CreateInventoryItemPage'));
const EditInventoryItemPage = lazy(() => import('@/pages/inventory/EditInventoryItemPage'));
const EmployeesPage = lazy(() => import('@/pages/employees/EmployeesPage'));
const EmployeeDetailPage = lazy(() => import('@/pages/employees/EmployeeDetailPage'));
const AddEmployeePage = lazy(() => import('@/pages/employees/AddEmployeePage'));
const EditEmployeePage = lazy(() => import('@/pages/employees/EditEmployeePage'));
const BranchesPage = lazy(() => import('@/pages/branches/BranchesPage'));
const UsersPage = lazy(() => import('@/pages/settings/users/UsersPage'));
const PayablesPage = lazy(() => import('@/pages/payables/PayablesPage'));
const ReceivablesPage = lazy(() => import('@/pages/receivables/ReceivablesPage'));

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
            element: <DashboardPage />,
          },

          // Transactions
          {
            path: 'transactions',
            element: <TransactionsPage />,
          },
          {
            path: 'transactions/create/expense',
            element: <CreateExpensePage />,
          },
          {
            path: 'transactions/create/income',
            element: <CreateIncomePage />,
          },

          // Contacts
          {
            path: 'contacts',
            element: <ContactsPage />,
          },

          // Inventory
          {
            path: 'inventory',
            element: <InventoryPage />,
          },
          {
            path: 'inventory/create',
            element: <CreateInventoryItemPage />,
          },
          {
            path: 'inventory/:id/edit',
            element: <EditInventoryItemPage />,
          },

          // Employees
          {
            path: 'employees',
            element: <EmployeesPage />,
          },
          {
            path: 'employees/new',
            element: <AddEmployeePage />,
          },
          {
            path: 'employees/:id',
            element: <EmployeeDetailPage />,
          },
          {
            path: 'employees/:id/edit',
            element: <EditEmployeePage />,
          },

          // Branches (Admin only)
          {
            path: 'branches',
            element: <AdminRouteGuard />,
            children: [
              {
                index: true,
                element: <BranchesPage />,
              },
            ],
          },

          // Settings (Admin only)
          {
            path: 'settings',
            element: <AdminRouteGuard />,
            children: [
              {
                path: 'users',
                element: <UsersPage />,
              },
            ],
          },

          // Payables & Receivables
          {
            path: 'payables',
            element: <PayablesPage />,
          },
          {
            path: 'receivables',
            element: <ReceivablesPage />,
          },
        ],
      },
    ],
  },
];
