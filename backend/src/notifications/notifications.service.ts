import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationSeverity, UserRole, Prisma, Notification, TransactionType } from '@prisma/client';
import { BRANCH_SELECT, USER_SELECT } from '../common/constants/prisma-includes';
import { getCurrentTimestamp } from '../common/utils/date.utils';

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

  constructor(private readonly prisma: PrismaService) {}

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
   * Create overdue debt notification
   * @param debtId - The ID of the overdue debt
   * @param creditorName - Name of the creditor
   * @param remainingAmount - Remaining amount to pay
   * @param dueDate - Due date that was missed
   * @param branchId - Branch ID where the debt belongs
   * @param systemUserId - System user ID for creating notifications
   * @returns Created notification
   */
  async createOverdueDebtNotification(
    debtId: string,
    creditorName: string,
    remainingAmount: number,
    dueDate: Date,
    branchId: string,
    systemUserId: string,
  ): Promise<NotificationWithRelations> {
    const daysPastDue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    const notification = await this.createNotification({
      type: 'overdue_debt',
      title: `Overdue Debt: ${creditorName}`,
      message: `Debt to ${creditorName} is overdue by ${daysPastDue} day(s). Remaining amount: $${remainingAmount.toFixed(2)}. Due date was: ${dueDate.toISOString().split('T')[0]}`,
      severity: NotificationSeverity.WARNING,
      relatedId: debtId,
      relatedType: 'debt',
      branchId: branchId,
      createdBy: systemUserId,
    });

    this.logger.log(
      `Overdue debt notification created for debt ${debtId}, creditor: ${creditorName}`,
    );

    return notification;
  }

  /**
   * Get all admin users who should receive notifications
   * @returns Array of admin users
   */
  async getAdminUsers(): Promise<AdminUserSelect[]> {
    const adminUsers = await this.prisma.user.findMany({
      where: {
        role: UserRole.ADMIN,
        isActive: true,
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
   * Find all unread notifications for a user
   * @param userId - User ID
   * @returns Array of unread notifications
   */
  async getUnreadNotifications(userId: string): Promise<NotificationWithRelations[]> {
    return this.prisma.notification.findMany({
      where: {
        isRead: false,
      },
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
}
