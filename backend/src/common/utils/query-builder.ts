import { UserRole } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';

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
export function applyBranchFilter(
  user: RequestUser,
  where: any = {},
  filterBranchId?: string,
): any {
  // Role-based access control
  if (user.role === UserRole.ACCOUNTANT) {
    // Accountants can only see records from their branch
    if (!user.branchId) {
      throw new ForbiddenException('Accountant must be assigned to a branch');
    }
    where.branchId = user.branchId;
  } else if (user.role === UserRole.ADMIN && filterBranchId) {
    // Admins can filter by specific branch
    where.branchId = filterBranchId;
  }

  return where;
}
