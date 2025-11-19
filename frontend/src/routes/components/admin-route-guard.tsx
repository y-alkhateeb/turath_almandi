/**
 * AdminRouteGuard Component
 * Protects routes that require ADMIN role
 * Composes with LoginAuthGuard - assumes user is already authenticated
 *
 * Usage:
 * Wrap admin-only routes with this guard
 * It will redirect non-admin users to /dashboard with error toast
 */

import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useRouter } from '@/routes/hooks';
import { useUser } from '@/store/userStore';
import { PageLoading } from '@/components/loading';
import { isAdmin } from '@/utils/permissions';
import { toast } from 'sonner';

export function AdminRouteGuard() {
  const router = useRouter();
  const location = useLocation();
  const user = useUser();

  useEffect(() => {
    // User is loaded but not admin
    if (user && !isAdmin(user)) {
      toast.error('ليس لديك صلاحية للوصول إلى هذه الصفحة');
      router.replace('/dashboard');
    }
  }, [user, router]);

  // Still loading user data
  if (!user) {
    return <PageLoading message="جاري التحقق من الصلاحيات..." />;
  }

  // User loaded but not admin (while redirecting)
  if (!isAdmin(user)) {
    return <PageLoading message="إعادة التوجيه..." />;
  }

  // User is admin, render protected content
  return <Outlet />;
}
