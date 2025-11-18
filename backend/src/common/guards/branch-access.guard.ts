import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ERROR_MESSAGES } from '../constants/error-messages';

/**
 * BranchAccessGuard
 *
 * Ensures that accountants have a branch assigned before accessing branch-scoped resources.
 * - Admins can access without a branch (they manage all branches)
 * - Accountants MUST have a branchId assigned
 *
 * @throws {ForbiddenException} If accountant has no branch assigned
 */
@Injectable()
export class BranchAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // User should be authenticated (enforced by JwtAuthGuard)
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user is an accountant
    const isAccountant = user.role === 'ACCOUNTANT';

    // If accountant, they must have a branch assigned
    if (isAccountant && !user.branch_id) {
      throw new ForbiddenException(ERROR_MESSAGES.BRANCH.ACCOUNTANT_NO_ACCESS);
    }

    // Admins and accountants with branches can proceed
    return true;
  }
}
