/**
 * LoginAuthGuard Component
 * Redirects to login page if user is not authenticated
 * Used to protect routes that require authentication
 */

import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useRouter } from '@/routes/hooks';
import { useUserToken } from '@/store/userStore';
import { PageLoading } from '@/components/loading';

export function LoginAuthGuard() {
  const router = useRouter();
  const { accessToken } = useUserToken();

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
    }
  }, [accessToken, router]);

  // Show loading while checking authentication
  if (!accessToken) {
    return <PageLoading message="جاري التحقق من الصلاحيات..." />;
  }

  return <Outlet />;
}
