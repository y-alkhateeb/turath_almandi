import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { RequestUser } from '../interfaces';

@Injectable()
export class BranchGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: RequestUser = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Admin can access all branches
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Accountant must have assigned branch
    if (user.role === UserRole.ACCOUNTANT) {
      if (!user.branchId) {
        throw new ForbiddenException('Accountant not assigned to any branch');
      }

      const method = request.method;

      // For GET requests: inject branchId filter into query
      if (method === 'GET') {
        request.query = {
          ...request.query,
          branchId: user.branchId,
        };
        return true;
      }

      // For POST/PUT/PATCH: validate branchId in body
      if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        const bodyBranchId = request.body?.branchId;

        if (!bodyBranchId) {
          throw new BadRequestException('branchId required in request body');
        }

        if (bodyBranchId !== user.branchId) {
          throw new ForbiddenException('Cannot access other branches');
        }

        return true;
      }

      // For DELETE: validate branchId in params or query
      if (method === 'DELETE') {
        const paramBranchId = request.params?.branchId || request.query?.branchId;

        if (!paramBranchId) {
          throw new BadRequestException('branchId required');
        }

        if (paramBranchId !== user.branchId) {
          throw new ForbiddenException('Cannot delete from other branches');
        }

        return true;
      }
    }

    return true;
  }
}
