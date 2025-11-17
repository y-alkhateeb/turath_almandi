/**
 * Authentication Routes
 * Public routes for authentication (login, register, etc.)
 * Uses GuestGuard to redirect authenticated users away from login page
 */

import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { GuestGuard } from '../components/guest-guard';

// Lazy load auth pages
const LoginPage = lazy(() => import('@/pages/auth/login'));

export const authRoutes: RouteObject[] = [
  {
    path: 'login',
    element: <GuestGuard />,
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
    ],
  },
];
