/**
 * Main Route Configuration
 * Aggregates all route sections and error pages
 */

import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { authRoutes } from './auth';
import { dashboardRoutes } from './dashboard';

// Lazy load error pages
const Page403 = lazy(() => import('@/pages/error/403'));
const Page404 = lazy(() => import('@/pages/error/404'));
const Page500 = lazy(() => import('@/pages/error/500'));

export const routes: RouteObject[] = [
  // Auth routes
  ...authRoutes,

  // Dashboard routes (protected)
  ...dashboardRoutes,

  // Error pages
  {
    path: '403',
    element: <Page403 />,
  },
  {
    path: '500',
    element: <Page500 />,
  },
  {
    path: '*',
    element: <Page404 />,
  },
];
