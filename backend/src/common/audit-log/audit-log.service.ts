import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
}

export enum AuditEntityType {
  TRANSACTION = 'TRANSACTION',
  BRANCH = 'BRANCH',
  USER = 'USER',
  INVENTORY = 'INVENTORY',
  DEBT = 'DEBT',
  DEBT_PAYMENT = 'DEBT_PAYMENT',
  INVENTORY_ITEM = 'INVENTORY_ITEM',
}

interface AuditLogData {
  userId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  changes: Prisma.InputJsonValue;
  ipAddress?: string;
}

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create an audit log entry
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          changes: data.changes,
          ipAddress: data.ipAddress,
        },
      });
    } catch (error) {
      // Log the error but don't throw - audit logging should not break the main operation
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Log a create operation
   */
  async logCreate<T extends Prisma.InputJsonValue>(
    userId: string,
    entityType: AuditEntityType,
    entityId: string,
    newData: T,
    ipAddress?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.CREATE,
      entityType,
      entityId,
      changes: {
        new: newData,
      },
      ipAddress,
    });
  }

  /**
   * Log an update operation
   */
  async logUpdate<T extends Prisma.InputJsonValue>(
    userId: string,
    entityType: AuditEntityType,
    entityId: string,
    oldData: T,
    newData: T,
    ipAddress?: string,
  ): Promise<void> {
    // Calculate the changes (only works with objects)
    const changes =
      typeof oldData === 'object' &&
      oldData !== null &&
      typeof newData === 'object' &&
      newData !== null &&
      !Array.isArray(oldData) &&
      !Array.isArray(newData)
        ? this.calculateChanges(
            oldData as Prisma.JsonObject,
            newData as Prisma.JsonObject,
          )
        : null;

    await this.log({
      userId,
      action: AuditAction.UPDATE,
      entityType,
      entityId,
      changes: {
        old: oldData,
        new: newData,
        diff: changes,
      },
      ipAddress,
    });
  }

  /**
   * Log a delete operation
   */
  async logDelete<T extends Prisma.InputJsonValue>(
    userId: string,
    entityType: AuditEntityType,
    entityId: string,
    deletedData: T,
    ipAddress?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.DELETE,
      entityType,
      entityId,
      changes: {
        deleted: deletedData,
      },
      ipAddress,
    });
  }

  /**
   * Calculate changes between old and new data
   * Only works with JSON objects (not arrays or primitives)
   */
  private calculateChanges(
    oldData: Prisma.JsonObject,
    newData: Prisma.JsonObject,
  ): Prisma.JsonObject {
    const changes: Prisma.JsonObject = {};

    // Get all unique keys from both objects
    const allKeys = new Set([
      ...Object.keys(oldData || {}),
      ...Object.keys(newData || {}),
    ]);

    for (const key of allKeys) {
      const oldValue = oldData?.[key];
      const newValue = newData?.[key];

      // Skip if values are the same
      if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
        continue;
      }

      changes[key] = {
        from: oldValue,
        to: newValue,
      };
    }

    return changes;
  }

  /**
   * Get audit logs for a specific entity
   */
  async getLogsForEntity(entityType: AuditEntityType, entityId: string, limit: number = 50) {
    return this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get audit logs for a specific user
   */
  async getLogsForUser(userId: string, limit: number = 50) {
    return this.prisma.auditLog.findMany({
      where: {
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Query audit logs with filters and pagination
   */
  async queryLogs(params: {
    entityType?: string;
    entityId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: any[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { entityType, entityId, userId, startDate, endDate, page = 1, limit = 50 } = params;

    // Build where clause
    const where: Prisma.AuditLogWhereInput = {};

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Set time to end of day for endDate
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Get total count
    const total = await this.prisma.auditLog.count({ where });

    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Get audit logs
    const data = await this.prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}
