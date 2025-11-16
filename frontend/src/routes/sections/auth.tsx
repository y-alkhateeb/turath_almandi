/**
 * Authentication Routes
 * Public routes for authentication (login, register, etc.)
 */

import { lazy } from 'react';
import { SimpleLayout } from '@/layouts/simple';
import type { RouteObject } from 'react-router-dom';

// Lazy load auth pages
const LoginPage = lazy(() => import('@/pages/auth/login'));

export const authRoutes: RouteObject[] = [
  {
    path: '/',
    element: <SimpleLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
    ],
  },
];
