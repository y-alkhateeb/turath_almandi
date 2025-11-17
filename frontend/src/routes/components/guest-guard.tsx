/**
 * GuestGuard Component
 * Redirects to home/dashboard if user is already authenticated
 * Used to protect routes that should only be accessible by guests (e.g., login page)
 *
 * Best Practice: Prevents authenticated users from accessing login page
 */

import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useUserToken } from '@/store/userStore';
import { PageLoading } from '@/components/loading';
import GLOBAL_CONFIG from '@/global-config';

export function GuestGuard() {
  const navigate = useNavigate();
  const { accessToken } = useUserToken();

  useEffect(() => {
    // If user is authenticated, redirect to dashboard
    if (accessToken) {
      navigate(GLOBAL_CONFIG.defaultRoute, { replace: true });
    }
  }, [accessToken, navigate]);

  // If user is authenticated, show loading while redirecting
  if (accessToken) {
    return <PageLoading message="جاري التوجيه..." />;
  }

  // If user is not authenticated, show the guest page (e.g., login)
  return <Outlet />;
}
