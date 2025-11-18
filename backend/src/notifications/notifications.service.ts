import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationSeverity, UserRole } from '@prisma/client';
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

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a notification in the database
   * @param dto - Notification data
   * @returns Created notification
   */
  async createNotification(dto: CreateNotificationDto) {
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
    } catch (error) {
      this.logger.error(`Failed to create notification: ${error.message}`, error.stack);
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
  ) {
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
  async getAdminUsers() {
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
  async getUnreadNotifications(userId: string) {
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
      },
    });
  }

  /**
   * Mark notification as read
   * @param notificationId - Notification ID
   * @returns Updated notification
   */
  async markAsRead(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: getCurrentTimestamp(),
      },
    });
  }
}
