import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../types/prisma-enums';

/**
 * Audit Log Controller
 *
 * Provides endpoints for querying audit logs.
 * All endpoints require ADMIN role.
 *
 * Security:
 * - JWT authentication required
 * - Admin role required for all endpoints
 * - Read-only access (no create/update/delete)
 */
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * Query audit logs with filters and pagination
   *
   * GET /audit?entityType=TRANSACTION&entityId=xxx&userId=yyy&startDate=2024-01-01&endDate=2024-12-31&page=1&limit=50
   *
   * Query Parameters:
   * - entityType (optional): Filter by entity type (TRANSACTION, USER, BRANCH, etc.)
   * - entityId (optional): Filter by specific entity ID
   * - userId (optional): Filter by user who performed the action
   * - startDate (optional): Filter logs from this date (ISO 8601 format)
   * - endDate (optional): Filter logs until this date (ISO 8601 format)
   * - page (optional): Page number (default: 1)
   * - limit (optional): Items per page (default: 50, max: 100)
   *
   * Response:
   * {
   *   "data": [
   *     {
   *       "id": "uuid",
   *       "action": "CREATE|UPDATE|DELETE|VIEW",
   *       "entityType": "TRANSACTION",
   *       "entityId": "uuid",
   *       "changes": { ... },
   *       "ipAddress": "127.0.0.1",
   *       "createdAt": "2024-01-01T00:00:00Z",
   *       "user": {
   *         "id": "uuid",
   *         "username": "admin",
   *         "role": "ADMIN"
   *       }
   *     }
   *   ],
   *   "meta": {
   *     "page": 1,
   *     "limit": 50,
   *     "total": 100,
   *     "totalPages": 2
   *   }
   * }
   */
  @Get()
  @Roles([UserRole.ADMIN])
  async queryAuditLogs(@Query() query: QueryAuditLogsDto) {
    return this.auditLogService.queryLogs({
      entityType: query.entityType,
      entityId: query.entityId,
      userId: query.userId,
      startDate: query.startDate,
      endDate: query.endDate,
      page: query.page,
      limit: query.limit,
    });
  }
}
