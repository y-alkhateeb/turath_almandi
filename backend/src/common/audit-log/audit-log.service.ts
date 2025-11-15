import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
}

interface AuditLogData {
  userId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  changes: any;
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
  async logCreate(
    userId: string,
    entityType: AuditEntityType,
    entityId: string,
    newData: any,
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
  async logUpdate(
    userId: string,
    entityType: AuditEntityType,
    entityId: string,
    oldData: any,
    newData: any,
    ipAddress?: string,
  ): Promise<void> {
    // Calculate the changes
    const changes = this.calculateChanges(oldData, newData);

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
  async logDelete(
    userId: string,
    entityType: AuditEntityType,
    entityId: string,
    deletedData: any,
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
   */
  private calculateChanges(oldData: any, newData: any): Record<string, any> {
    const changes: Record<string, any> = {};

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
  async getLogsForEntity(
    entityType: AuditEntityType,
    entityId: string,
    limit: number = 50,
  ) {
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
}
