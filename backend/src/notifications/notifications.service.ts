import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Notification } from '@prisma/client';
import { NotificationSeverity, UserRole, TransactionType } from '../common/types/prisma-enums';
import { WebSocketGatewayService } from '../websocket/websocket.gateway';
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
    // Get today's date at midnight for duplicate check
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if a notification for this debt was already created today
    // This prevents duplicate notifications when called multiple times
    const existingNotification = await this.prisma.notification.findFirst({
      where: {
        type: 'overdue_debt',
        relatedId: debtId,
        createdAt: {
          gte: today,
        },
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // If notification already exists today, return it instead of creating duplicate
    if (existingNotification) {
      this.logger.debug(
        `Notification for debt ${debtId} already exists today (created at ${existingNotification.createdAt}). Skipping creation.`,
      );
      return existingNotification as NotificationWithRelations;
    }

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
   * Get count of unread notifications for a user
   * @param userId - User ID
   * @returns Count of unread notifications
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        isRead: false,
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

  /**
   * Notify about a new debt creation
   * Creates notifications for large debts or approaching due dates
   *
   * @param debtId - Debt ID
   * @param creditorName - Name of the creditor
   * @param amount - Debt amount
   * @param dueDate - Due date for the debt
   * @param branchId - Branch ID where debt was created
   * @param createdBy - User ID who created the debt
   * @param threshold - Optional amount threshold for notifications (default: 5000)
   * @returns Created notification or null if no notification needed
   */
  async notifyNewDebt(
    debtId: string,
    creditorName: string,
    amount: number,
    dueDate: Date,
    branchId: string,
    createdBy: string,
    threshold: number = 5000,
  ): Promise<NotificationWithRelations | null> {
    // Calculate days until due
    const daysUntilDue = Math.floor((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    // Only notify for large debts or debts with approaching due dates
    const shouldNotify = amount >= threshold || daysUntilDue <= 7;

    if (!shouldNotify) {
      this.logger.debug(`Debt ${debtId} does not meet notification criteria`);
      return null;
    }

    // Determine notification severity
    let severity: NotificationSeverity = NotificationSeverity.INFO;
    if (amount >= threshold * 2 || daysUntilDue <= 3) {
      severity = NotificationSeverity.WARNING;
    } else if (amount >= threshold * 5 || daysUntilDue <= 1) {
      severity = NotificationSeverity.CRITICAL;
    }

    // Create notification
    const notification = await this.createNotification({
      type: 'new_debt',
      title: `دين جديد: ${creditorName}`,
      message: `تم إنشاء دين جديد إلى ${creditorName} بقيمة ${amount.toFixed(2)} دولار. تاريخ الاستحقاق: ${dueDate.toISOString().split('T')[0]} (بعد ${daysUntilDue} يوم)`,
      severity,
      relatedId: debtId,
      relatedType: 'DEBT',
      branchId,
      createdBy,
    });

    this.logger.debug(`Created notification for debt ${debtId} with severity ${severity}`);

    return notification;
  }

  /**
   * Notify about a debt payment
   * Creates notifications for significant payments or fully paid debts
   *
   * @param debtId - Debt ID
   * @param paymentId - Payment ID
   * @param creditorName - Name of the creditor
   * @param amountPaid - Amount paid
   * @param remainingAmount - Remaining amount after payment
   * @param branchId - Branch ID where payment was made
   * @param createdBy - User ID who made the payment
   * @param threshold - Optional amount threshold for notifications (default: 3000)
   * @returns Created notification or null if no notification needed
   */
  async notifyDebtPayment(
    debtId: string,
    paymentId: string,
    creditorName: string,
    amountPaid: number,
    remainingAmount: number,
    branchId: string,
    createdBy: string,
    threshold: number = 3000,
  ): Promise<NotificationWithRelations | null> {
    // Only notify for large payments or when debt is fully paid
    const isFullyPaid = remainingAmount === 0;
    const shouldNotify = amountPaid >= threshold || isFullyPaid;

    if (!shouldNotify) {
      this.logger.debug(`Debt payment ${paymentId} does not meet notification criteria`);
      return null;
    }

    // Determine notification severity
    let severity: NotificationSeverity = NotificationSeverity.INFO;
    if (isFullyPaid) {
      severity = NotificationSeverity.INFO;
    } else if (amountPaid >= threshold * 2) {
      severity = NotificationSeverity.WARNING;
    }

    // Create message based on payment status
    let message: string;
    if (isFullyPaid) {
      message = `تم سداد الدين لـ ${creditorName} بالكامل. المبلغ المدفوع: ${amountPaid.toFixed(2)} دولار`;
    } else {
      message = `تم دفع ${amountPaid.toFixed(2)} دولار لـ ${creditorName}. المبلغ المتبقي: ${remainingAmount.toFixed(2)} دولار`;
    }

    // Create notification
    const notification = await this.createNotification({
      type: isFullyPaid ? 'debt_paid' : 'debt_payment',
      title: `دفعة دين: ${creditorName}`,
      message,
      severity,
      relatedId: debtId,
      relatedType: 'DEBT',
      branchId,
      createdBy,
    });

    this.logger.debug(
      `Created notification for debt payment ${paymentId} with severity ${severity}`,
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
   * Mark all unread notifications as read
   * @param userId - User ID (optional, currently notifications are global)
   * @returns Count of updated notifications
   */
  async markAllAsRead(userId?: string): Promise<{ count: number }> {
    const where: Prisma.NotificationWhereInput = {
      isRead: false,
    };

    const result = await this.prisma.notification.updateMany({
      where,
      data: {
        isRead: true,
        readAt: getCurrentTimestamp(),
      },
    });

    this.logger.log(`Marked ${result.count} notifications as read`);

    return { count: result.count };
  }
}
