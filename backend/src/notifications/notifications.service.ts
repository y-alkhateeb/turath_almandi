import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Notification } from '@prisma/client';
import { NotificationSeverity, UserRole, TransactionType } from '../common/types/prisma-enums';
import { WebSocketGatewayService } from '../websocket/websocket.gateway';
import { BRANCH_SELECT, USER_SELECT } from '../common/constants/prisma-includes';
import { getCurrentTimestamp } from '../common/utils/date.utils';
import { RequestUser } from '../common/interfaces';

export interface CreateNotificationDto {
  type: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  relatedId?: string;
  relatedType?: string;
  branchId?: string;
  createdBy: string;
}

// Type for notification with branch and creator relations
type NotificationWithRelations = Prisma.NotificationGetPayload<{
  include: {
    branch: {
      select: typeof BRANCH_SELECT;
    };
    creator: {
      select: typeof USER_SELECT;
    };
  };
}>;

// Type for notification with only branch relation
type NotificationWithBranch = Prisma.NotificationGetPayload<{
  include: {
    branch: {
      select: typeof BRANCH_SELECT;
    };
  };
}>;

// Type for admin user select
interface AdminUserSelect {
  id: string;
  username: string;
  role: UserRole;
  branchId: string | null;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly websocketGateway: WebSocketGatewayService,
  ) {}

  /**
   * Create a notification in the database
   * @param dto - Notification data
   * @returns Created notification
   */
  async createNotification(dto: CreateNotificationDto): Promise<NotificationWithRelations> {
    try {
      this.logger.debug(
        `Creating notification: type=${dto.type}, severity=${dto.severity}, relatedId=${dto.relatedId}`,
      );

      const notification = await this.prisma.notification.create({
        data: {
          type: dto.type,
          title: dto.title,
          message: dto.message,
          severity: dto.severity,
          relatedId: dto.relatedId,
          relatedType: dto.relatedType,
          branchId: dto.branchId,
          createdBy: dto.createdBy,
          isRead: false,
        },
        include: {
          branch: {
            select: BRANCH_SELECT,
          },
          creator: {
            select: USER_SELECT,
          },
        },
      });

      this.logger.log(
        `Notification created successfully: id=${notification.id}, type=${notification.type}`,
      );

      // Emit WebSocket event for real-time updates
      this.websocketGateway.emitNewNotification(notification);

      return notification;
    } catch (error: unknown) {
      // Type guard: check if error is an Error instance
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create notification: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Get all admin users who should receive notifications
   * @returns Array of admin users
   */
  async getAdminUsers(): Promise<AdminUserSelect[]> {
    const adminUsers = await this.prisma.user.findMany({
      where: {
        role: UserRole.ADMIN,
        isDeleted: false,
      },
      select: {
        id: true,
        username: true,
        role: true,
        branchId: true,
      },
    });

    this.logger.debug(`Found ${adminUsers.length} active admin users`);
    return adminUsers;
  }

  /**
   * Build where clause for notifications based on user role and branch
   * Admins see all notifications, accountants only see their branch's notifications
   */
  private buildUserNotificationFilter(user: RequestUser): Prisma.NotificationWhereInput {
    const filter: Prisma.NotificationWhereInput = {
      isRead: false,
    };

    // Accountants only see notifications for their branch
    if (user.role === UserRole.ACCOUNTANT && user.branchId) {
      filter.branchId = user.branchId;
    }
    // Admins see all notifications (no branch filter)

    return filter;
  }

  /**
   * Find all unread notifications for a user
   * Admins see all notifications, accountants only see their branch's notifications
   * @param user - Current user
   * @returns Array of unread notifications
   */
  async getUnreadNotifications(user: RequestUser): Promise<NotificationWithRelations[]> {
    const where = this.buildUserNotificationFilter(user);

    return this.prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        branch: {
          select: BRANCH_SELECT,
        },
        creator: {
          select: USER_SELECT,
        },
      },
    });
  }

  /**
   * Get count of unread notifications for a user
   * Admins see all notifications count, accountants only see their branch's count
   * @param user - Current user
   * @returns Count of unread notifications
   */
  async getUnreadCount(user: RequestUser): Promise<number> {
    const where = this.buildUserNotificationFilter(user);

    return this.prisma.notification.count({
      where,
    });
  }

  /**
   * Mark notification as read
   * @param notificationId - Notification ID
   * @returns Updated notification
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: getCurrentTimestamp(),
      },
    });
  }

  /**
   * Notify about a new transaction
   * Creates notifications for large transactions or specific transaction types
   *
   * @param transactionId - Transaction ID
   * @param transactionType - Type of transaction (INCOME/EXPENSE)
   * @param amount - Transaction amount
   * @param category - Transaction category
   * @param branchId - Branch ID where transaction occurred
   * @param createdBy - User ID who created the transaction
   * @param threshold - Optional amount threshold for notifications (default: 10000)
   * @returns Created notification or null if no notification needed
   */
  async notifyNewTransaction(
    transactionId: string,
    transactionType: TransactionType,
    amount: number,
    category: string,
    branchId: string,
    createdBy: string,
    threshold: number = 10000,
  ): Promise<NotificationWithRelations | null> {
    // Only notify for large transactions or specific categories
    const shouldNotify =
      amount >= threshold ||
      category === 'Purchase' ||
      (transactionType === TransactionType.EXPENSE && amount >= 5000);

    if (!shouldNotify) {
      this.logger.debug(`Transaction ${transactionId} does not meet notification criteria`);
      return null;
    }

    // Determine notification severity
    let severity: NotificationSeverity = NotificationSeverity.INFO;
    if (amount >= threshold * 2) {
      severity = NotificationSeverity.WARNING;
    } else if (amount >= threshold * 5) {
      severity = NotificationSeverity.CRITICAL;
    }

    // Create notification
    const notification = await this.createNotification({
      type: 'large_transaction',
      title: `معاملة ${transactionType === TransactionType.INCOME ? 'دخل' : 'مصروف'} كبيرة`,
      message: `تم إنشاء معاملة ${category} بقيمة ${amount.toFixed(2)} دولار`,
      severity,
      relatedId: transactionId,
      relatedType: 'TRANSACTION',
      branchId,
      createdBy,
    });

    this.logger.debug(
      `Created notification for transaction ${transactionId} with severity ${severity}`,
    );

    return notification;
  }

  /**
   * Get all notifications with pagination and filters
   * @param filters - Query filters (branchId, isRead, type, startDate, endDate)
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 50)
   * @returns Paginated notifications
   */
  async getAll(
    filters: {
      branchId?: string;
      isRead?: boolean;
      type?: string;
      startDate?: string;
      endDate?: string;
    } = {},
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    data: NotificationWithRelations[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.NotificationWhereInput = {};

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    // Get total count
    const total = await this.prisma.notification.count({ where });

    // Get notifications
    const notifications = await this.prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        branch: {
          select: BRANCH_SELECT,
        },
        creator: {
          select: USER_SELECT,
        },
      },
    });

    return {
      data: notifications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mark all unread notifications as read for a user
   * Admins mark all as read, accountants only mark their branch's notifications
   * @param user - Current user
   * @returns Count of updated notifications
   */
  async markAllAsRead(user: RequestUser): Promise<{ count: number }> {
    const where = this.buildUserNotificationFilter(user);

    const result = await this.prisma.notification.updateMany({
      where,
      data: {
        isRead: true,
        readAt: getCurrentTimestamp(),
      },
    });

    this.logger.log(`Marked ${result.count} notifications as read for user ${user.username}`);

    return { count: result.count };
  }
}
