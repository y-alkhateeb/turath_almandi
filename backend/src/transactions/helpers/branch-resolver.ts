import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../common/types/prisma-enums';
import { RequestUser } from '../../common/interfaces';

/**
 * Resolves the branchId based on user role.
 * - Admin: must provide branchId
 * - Accountant: uses their assigned branch
 */
export function resolveBranchId(user: RequestUser, providedBranchId?: string): string {
  if (user.role === UserRole.ADMIN) {
    if (!providedBranchId) {
      throw new BadRequestException('Admin must specify branchId for transaction');
    }
    return providedBranchId;
  }

  // Accountant uses their assigned branch
  if (!user.branchId) {
    throw new BadRequestException('Accountant must be assigned to branch');
  }
  return user.branchId;
}

/**
 * Validates the user has access to a specific branch.
 * - Admin: can access any branch
 * - Accountant: can only access their assigned branch
 */
export function validateBranchAccess(user: RequestUser, resourceBranchId: string): void {
  if (user.role === UserRole.ACCOUNTANT) {
    if (!user.branchId) {
      throw new BadRequestException('Accountant must be assigned to branch');
    }
    if (resourceBranchId !== user.branchId) {
      throw new ForbiddenException('Access denied: Resource belongs to another branch');
    }
  }
}

/**
 * Gets the effective branch filter for queries based on user role.
 * - Admin: uses provided branchId or undefined (all branches)
 * - Accountant: always filtered to their assigned branch
 */
export function getEffectiveBranchFilter(user: RequestUser, providedBranchId?: string): string | undefined {
  if (user.role === UserRole.ACCOUNTANT) {
    if (!user.branchId) {
      throw new ForbiddenException('Accountant must be assigned to branch');
    }
    return user.branchId;
  }

  // Admin can filter by any branch or see all
  return providedBranchId;
}
