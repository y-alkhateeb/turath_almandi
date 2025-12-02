/**
 * Main Route Configuration
 * Aggregates all route sections and error pages
 */

import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { authRoutes } from './auth';
import { dashboardRoutes } from './dashboard';

// Lazy load error pages
const Error403Page = lazy(() => import('@/pages/error/403'));
const Error404Page = lazy(() => import('@/pages/error/404'));
const Error500Page = lazy(() => import('@/pages/error/500'));

export const routes: RouteObject[] = [
  // Auth routes
  ...authRoutes,

  // Dashboard routes (protected)
  ...dashboardRoutes,

  // Error pages
  {
    path: '/403',
    element: <Error403Page />,
  },
  {
    path: '/404',
    element: <Error404Page />,
  },
  {
    path: '/500',
    element: <Error500Page />,
  },

  // Catch-all 404 route - must be last
  {
    path: '*',
    element: <Error404Page />,
  },
];
