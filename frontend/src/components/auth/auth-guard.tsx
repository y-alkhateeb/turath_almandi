/**
 * AuthGuard Component
 * Permission-based rendering for role and branch access control
 */

import { type ReactNode } from 'react';
import { useUserInfo } from '@/store/userStore';
import { UserRole } from '#/enum';
import { checkAny, checkAll } from '@/utils';
import type { UserInfo } from '#/entity';

export interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;

  // Role-based access
  role?: UserRole;
  roles?: UserRole[];
  requireAllRoles?: boolean;

  // Branch-based access
  branchId?: string;

  // Custom check function
  check?: (userInfo: UserInfo) => boolean;
}

/**
 * AuthGuard - Conditionally render children based on permissions
 *
 * @example
 * // Require admin role
 * <AuthGuard role={UserRole.ADMIN}>
 *   <AdminOnlyButton />
 * </AuthGuard>
 *
 * @example
 * // Require any of multiple roles
 * <AuthGuard roles={[UserRole.ADMIN, UserRole.ACCOUNTANT]}>
 *   <SharedContent />
 * </AuthGuard>
 *
 * @example
 * // Custom check with fallback
 * <AuthGuard
 *   check={(user) => user.isActive}
 *   fallback={<p>حساب غير نشط</p>}
 * >
 *   <ActiveUserContent />
 * </AuthGuard>
 */
export function AuthGuard({
  children,
  fallback = null,
  role,
  roles,
  requireAllRoles = false,
  branchId,
  check: customCheck,
}: AuthGuardProps) {
  const userInfo = useUserInfo();

  // If no user info, deny access
  if (!userInfo || !userInfo.id) {
    return <>{fallback}</>;
  }

  // Custom check function
  if (customCheck) {
    const hasAccess = customCheck(userInfo);
    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  // Single role check
  if (role) {
    const hasRole = userInfo.role === role;
    if (!hasRole) {
      return <>{fallback}</>;
    }
  }

  // Multiple roles check
  if (roles && roles.length > 0) {
    const userRoles = [userInfo.role].filter(Boolean) as UserRole[];

    let hasAccess = false;
    if (requireAllRoles) {
      hasAccess = checkAll(roles, userRoles);
    } else {
      hasAccess = checkAny(roles, userRoles);
    }

    if (!hasAccess) {
      return <>{fallback}</>;
    }
  }

  // Branch access check
  if (branchId) {
    // Admin has access to all branches
    if (userInfo.role === UserRole.ADMIN) {
      return <>{children}</>;
    }

    // Accountant can only access their assigned branch
    if (userInfo.role === UserRole.ACCOUNTANT) {
      const hasAccess = userInfo.branchId === branchId;
      if (!hasAccess) {
        return <>{fallback}</>;
      }
    }
  }

  // All checks passed
  return <>{children}</>;
}

/**
 * AdminOnly - Shortcut for admin-only content
 */
export function AdminOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <AuthGuard role={UserRole.ADMIN} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

/**
 * AccountantOnly - Shortcut for accountant-only content
 */
export function AccountantOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <AuthGuard role={UserRole.ACCOUNTANT} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

/**
 * Hook to check if user has role
 */
export function useHasRole(role: UserRole): boolean {
  const userInfo = useUserInfo();
  return userInfo?.role === role;
}

/**
 * Hook to check if user has any of the roles
 */
export function useHasAnyRole(roles: UserRole[]): boolean {
  const userInfo = useUserInfo();
  const userRoles = [userInfo?.role].filter(Boolean) as UserRole[];
  return checkAny(roles, userRoles);
}

/**
 * Hook to check if user has all roles
 */
export function useHasAllRoles(roles: UserRole[]): boolean {
  const userInfo = useUserInfo();
  const userRoles = [userInfo?.role].filter(Boolean) as UserRole[];
  return checkAll(roles, userRoles);
}

/**
 * Hook to check if user can access branch
 */
export function useCanAccessBranch(branchId?: string): boolean {
  const userInfo = useUserInfo();

  if (!branchId) return true; // No restriction
  if (userInfo?.role === UserRole.ADMIN) return true; // Admin can access all

  return userInfo?.branchId === branchId;
}
