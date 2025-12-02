/**
 * LoginAuthGuard Component
 * Redirects to login page if user is not authenticated
 * Used to protect routes that require authentication
 *
 * Features:
 * - Checks for access token
 * - Preserves intended route in location state
 * - Redirects back to intended route after login
 * - Shows loading spinner while checking auth
 * - Handles token expiry gracefully
 * - Waits for Zustand hydration to avoid race conditions
 */

import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useUserToken } from '@/store/userStore';
import { useHydration } from '@/hooks/useHydration';
import { PageLoading } from '@/components/common';

export function LoginAuthGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken } = useUserToken();
  const hasHydrated = useHydration();

  useEffect(() => {
    if (hasHydrated && !accessToken) {
      // Preserve the intended route in state so we can redirect back after login
      // Don't preserve /login itself to avoid redirect loops
      const from = location.pathname !== '/login' ? location.pathname : '/dashboard';

      navigate('/login', {
        replace: true,
        state: { from },
      });
    }
  }, [hasHydrated, accessToken, navigate, location.pathname]);

  // Show loading while checking authentication
  if (!hasHydrated || !accessToken) {
    return <PageLoading message="جاري التحقق من الصلاحيات..." />;
  }

  // User is authenticated, render protected content
  return <Outlet />;
}
