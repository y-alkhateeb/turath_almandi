/**
 * Permission utility functions
 * Type-safe permission checks for role-based access control
 */

import type { User } from '@/types/auth.types';

/**
 * Check if user is an admin
 * @param user - User object (can be null)
 * @returns true if user is admin
 */
export function isAdmin(user: User | null | undefined): boolean {
  return user?.role === 'ADMIN';
}

/**
 * Check if user is an accountant
 * @param user - User object (can be null)
 * @returns true if user is accountant
 */
export function isAccountant(user: User | null | undefined): boolean {
  return user?.role === 'ACCOUNTANT';
}

/**
 * Check if user can access a specific branch
 * Rules:
 * - Admins can access all branches
 * - Accountants can only access their own branch
 *
 * @param user - User object
 * @param branchId - Branch ID to check access for
 * @returns true if user can access the branch
 */
export function canAccessBranch(
  user: User | null | undefined,
  branchId: string | null | undefined
): boolean {
  if (!user) return false;

  // Admins can access all branches
  if (user.role === 'ADMIN') return true;

  // Accountants can only access their own branch
  if (user.role === 'ACCOUNTANT') {
    // If no branchId specified, checking general branch access
    if (!branchId) return user.branchId !== null;

    // Check if accountant's branchId matches the requested branchId
    return user.branchId === branchId;
  }

  return false;
}

/**
 * Check if user can manage users (create, update, delete)
 * Only admins can manage users
 *
 * @param user - User object
 * @returns true if user can manage users
 */
export function canManageUsers(user: User | null | undefined): boolean {
  return isAdmin(user);
}

/**
 * Check if user can manage branches (create, update, delete)
 * Only admins can manage branches
 *
 * @param user - User object
 * @returns true if user can manage branches
 */
export function canManageBranches(user: User | null | undefined): boolean {
  return isAdmin(user);
}

/**
 * Check if user can view all branches
 * Rules:
 * - Admins can view all branches
 * - Accountants can only view their own branch
 *
 * @param user - User object
 * @returns true if user can view all branches
 */
export function canViewAllBranches(user: User | null | undefined): boolean {
  return isAdmin(user);
}

/**
 * Check if user can export reports
 * Currently all authenticated users can export reports
 * Can be restricted in the future if needed
 *
 * @param user - User object
 * @returns true if user can export reports
 */
export function canExportReports(user: User | null | undefined): boolean {
  // All authenticated users can export reports
  return user !== null && user !== undefined;
}

/**
 * Check if user can view audit logs
 * Only admins can view audit logs
 *
 * @param user - User object
 * @returns true if user can view audit logs
 */
export function canViewAuditLogs(user: User | null | undefined): boolean {
  return isAdmin(user);
}

/**
 * Check if user can manage transactions
 * Rules:
 * - Admins can manage all transactions
 * - Accountants can only manage transactions in their branch
 *
 * @param user - User object
 * @param transactionBranchId - Branch ID of the transaction (optional)
 * @returns true if user can manage transactions
 */
export function canManageTransactions(
  user: User | null | undefined,
  transactionBranchId?: string | null
): boolean {
  if (!user) return false;

  // Admins can manage all transactions
  if (user.role === 'ADMIN') return true;

  // Accountants can only manage transactions in their branch
  if (user.role === 'ACCOUNTANT') {
    // If no specific transaction branch, check if accountant has a branch
    if (!transactionBranchId) return user.branchId !== null;

    // Check if transaction is in accountant's branch
    return user.branchId === transactionBranchId;
  }

  return false;
}

/**
 * Check if user can manage debts
 * Rules:
 * - Admins can manage all debts
 * - Accountants can only manage debts in their branch
 *
 * @param user - User object
 * @param debtBranchId - Branch ID of the debt (optional)
 * @returns true if user can manage debts
 */
export function canManageDebts(
  user: User | null | undefined,
  debtBranchId?: string | null
): boolean {
  if (!user) return false;

  // Admins can manage all debts
  if (user.role === 'ADMIN') return true;

  // Accountants can only manage debts in their branch
  if (user.role === 'ACCOUNTANT') {
    // If no specific debt branch, check if accountant has a branch
    if (!debtBranchId) return user.branchId !== null;

    // Check if debt is in accountant's branch
    return user.branchId === debtBranchId;
  }

  return false;
}

/**
 * Check if user can manage inventory
 * Rules:
 * - Admins can manage all inventory
 * - Accountants can only manage inventory in their branch
 *
 * @param user - User object
 * @param inventoryBranchId - Branch ID of the inventory item (optional)
 * @returns true if user can manage inventory
 */
export function canManageInventory(
  user: User | null | undefined,
  inventoryBranchId?: string | null
): boolean {
  if (!user) return false;

  // Admins can manage all inventory
  if (user.role === 'ADMIN') return true;

  // Accountants can only manage inventory in their branch
  if (user.role === 'ACCOUNTANT') {
    // If no specific inventory branch, check if accountant has a branch
    if (!inventoryBranchId) return user.branchId !== null;

    // Check if inventory is in accountant's branch
    return user.branchId === inventoryBranchId;
  }

  return false;
}

/**
 * Check if user can view notifications
 * All authenticated users can view notifications
 *
 * @param user - User object
 * @returns true if user can view notifications
 */
export function canViewNotifications(user: User | null | undefined): boolean {
  return user !== null && user !== undefined;
}

/**
 * Check if user can manage notification settings
 * All authenticated users can manage their own notification settings
 *
 * @param user - User object
 * @returns true if user can manage notification settings
 */
export function canManageNotificationSettings(user: User | null | undefined): boolean {
  return user !== null && user !== undefined;
}

/**
 * Check if user can access dashboard
 * All authenticated users can access dashboard
 *
 * @param user - User object
 * @returns true if user can access dashboard
 */
export function canAccessDashboard(user: User | null | undefined): boolean {
  return user !== null && user !== undefined && user.isActive;
}

/**
 * Check if user account is active
 * @param user - User object
 * @returns true if user is active
 */
export function isUserActive(user: User | null | undefined): boolean {
  return user?.isActive === true;
}

/**
 * Get branches user can access
 * Rules:
 * - Admins can access all branches (returns null to indicate "all")
 * - Accountants can only access their own branch (returns array with single branchId)
 *
 * @param user - User object
 * @returns Array of accessible branch IDs, null for all branches, or empty array for none
 */
export function getAccessibleBranchIds(user: User | null | undefined): string[] | null {
  if (!user) return [];

  // Admins can access all branches
  if (user.role === 'ADMIN') return null;

  // Accountants can only access their own branch
  if (user.role === 'ACCOUNTANT' && user.branchId) {
    return [user.branchId];
  }

  return [];
}

/**
 * Check if user can perform action on resource
 * Generic permission check that combines resource ownership and role
 *
 * @param user - User object
 * @param action - Action to perform (e.g., 'create', 'update', 'delete', 'view')
 * @param resource - Resource type (e.g., 'user', 'branch', 'transaction')
 * @param resourceBranchId - Branch ID of the resource (optional)
 * @returns true if user can perform action
 */
export function canPerformAction(
  user: User | null | undefined,
  action: 'create' | 'update' | 'delete' | 'view',
  resource: 'user' | 'branch' | 'transaction' | 'debt' | 'inventory' | 'audit',
  resourceBranchId?: string | null
): boolean {
  if (!user) return false;

  // Admin-only resources
  if (resource === 'user' || resource === 'branch' || resource === 'audit') {
    return isAdmin(user);
  }

  // Branch-specific resources
  if (resource === 'transaction' || resource === 'debt' || resource === 'inventory') {
    // Admins can perform all actions
    if (user.role === 'ADMIN') return true;

    // Accountants can only manage resources in their branch
    if (user.role === 'ACCOUNTANT') {
      if (!resourceBranchId) return user.branchId !== null;
      return user.branchId === resourceBranchId;
    }
  }

  return false;
}
