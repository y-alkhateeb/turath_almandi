import { UserRole } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';
import { ERROR_MESSAGES } from '../constants/error-messages';

interface RequestUser {
  id: string;
  username: string;
  role: UserRole;
  branchId: string | null;
}

/**
 * Apply branch filtering to a Prisma where clause based on user role
 * - ACCOUNTANT: Can only access their assigned branch
 * - ADMIN: Can access all branches or filter by specific branchId
 *
 * @param user - The authenticated user
 * @param where - The existing Prisma where clause
 * @param filterBranchId - Optional branch ID to filter by (for admin use)
 * @returns Updated where clause with branch filtering applied
 * @throws ForbiddenException if accountant has no assigned branch
 */
export function applyBranchFilter<T extends Record<string, unknown>>(
  user: RequestUser,
  where: T = {} as T,
  filterBranchId?: string,
): T {
  // Role-based access control
  if (user.role === UserRole.ACCOUNTANT) {
    // Accountants can only see records from their branch
    if (!user.branchId) {
      throw new ForbiddenException(ERROR_MESSAGES.BRANCH.ACCOUNTANT_NOT_ASSIGNED);
    }
    where.branchId = user.branchId;
  } else if (user.role === UserRole.ADMIN && filterBranchId) {
    // Admins can filter by specific branch
    where.branchId = filterBranchId;
  }

  return where;
}
