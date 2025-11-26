/**
 * RequestUser Interface
 *
 * Represents the authenticated user attached to request by JWT auth guard.
 * Used across all controllers and services that need user context.
 *
 * @property id - User UUID from database
 * @property username - User's login username
 * @property role - User role (ADMIN or ACCOUNTANT)
 * @property branchId - Assigned branch UUID, null for admins without specific branch
 */

import { UserRole } from '@prisma/client';

export interface RequestUser {
  id: string;
  username: string;
  role: UserRole;
  branchId: string | null;
}
