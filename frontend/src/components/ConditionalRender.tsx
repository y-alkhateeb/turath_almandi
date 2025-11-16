import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface ConditionalRenderProps {
  roles?: ('ADMIN' | 'ACCOUNTANT')[];
  branchId?: string | null;
  children: ReactNode;
  fallback?: ReactNode;
}

export const ConditionalRender = ({
  roles,
  branchId,
  children,
  fallback = null,
}: ConditionalRenderProps) => {
  const { user, isAdmin, hasRole, canAccessBranch } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  // Check role requirement
  if (roles && roles.length > 0) {
    const hasRequiredRole = roles.some((role) => hasRole(role));
    if (!hasRequiredRole) {
      return <>{fallback}</>;
    }
  }

  // Check branch access requirement
  if (branchId !== undefined) {
    if (!canAccessBranch(branchId)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};
