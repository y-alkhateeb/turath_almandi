import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DebtStatus } from '@prisma/client';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private readonly cronSchedule: string;
  private systemUserId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {
    // Get CRON schedule from environment variable, default to 9 AM daily
    this.cronSchedule = this.configService.get<string>(
      'OVERDUE_DEBT_CHECK_CRON',
      '0 9 * * *', // Default: Every day at 9:00 AM
    );
    this.logger.log(`Overdue debt check scheduled with CRON: ${this.cronSchedule}`);
  }

  /**
   * Initialize system user for creating notifications
   * This method should be called after the service is instantiated
   */
  async onModuleInit() {
    try {
      // Find or create a system user for automated tasks
      const systemUser = await this.prisma.user.findFirst({
        where: { username: 'system' },
      });

      if (systemUser) {
        this.systemUserId = systemUser.id;
        this.logger.log(`Using existing system user: ${this.systemUserId}`);
      } else {
        // If no system user exists, use the first admin user
        const adminUser = await this.prisma.user.findFirst({
          where: { role: 'ADMIN', isActive: true },
        });

        if (adminUser) {
          this.systemUserId = adminUser.id;
          this.logger.log(`Using first admin user as system user: ${this.systemUserId}`);
        } else {
          this.logger.warn(
            'No system user or admin user found. Notifications will use the first available user.',
          );
          const firstUser = await this.prisma.user.findFirst();
          if (firstUser) {
            this.systemUserId = firstUser.id;
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to initialize system user: ${error.message}`, error.stack);
    }
  }

  /**
   * CRON job to check for overdue debts and create notifications
   * Runs daily at 9 AM (or custom schedule from environment variable)
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM, {
    name: 'checkOverdueDebts',
    timeZone: 'UTC',
  })
  async checkOverdueDebts() {
    this.logger.log('Starting overdue debt check...');

    try {
      // Get today's date at midnight for comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find all active debts where due_date < today
      const overdueDebts = await this.prisma.debt.findMany({
        where: {
          status: DebtStatus.ACTIVE,
          dueDate: {
            lt: today,
          },
        },
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              location: true,
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

      this.logger.log(`Found ${overdueDebts.length} overdue debt(s)`);

      if (overdueDebts.length === 0) {
        this.logger.log('No overdue debts found. Task completed.');
        return;
      }

      // Get admin users to send notifications to
      const adminUsers = await this.notificationsService.getAdminUsers();

      if (adminUsers.length === 0) {
        this.logger.warn('No admin users found to receive overdue debt notifications');
        return;
      }

      this.logger.log(`Creating notifications for ${adminUsers.length} admin user(s)...`);

      // Create notifications for each overdue debt
      let notificationCount = 0;
      for (const debt of overdueDebts) {
        try {
          // Check if a notification for this debt was already created today
          const existingNotification = await this.prisma.notification.findFirst({
            where: {
              type: 'overdue_debt',
              relatedId: debt.id,
              createdAt: {
                gte: today,
              },
            },
          });

          if (existingNotification) {
            this.logger.debug(`Notification for debt ${debt.id} already exists today. Skipping.`);
            continue;
          }

          // Create notification for this overdue debt
          await this.notificationsService.createOverdueDebtNotification(
            debt.id,
            debt.creditorName,
            Number(debt.remainingAmount),
            debt.dueDate,
            debt.branchId,
            this.systemUserId,
          );

          notificationCount++;

          this.logger.debug(
            `Notification created for overdue debt: ${debt.creditorName}, amount: ${debt.remainingAmount}, due: ${debt.dueDate}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to create notification for debt ${debt.id}: ${error.message}`,
            error.stack,
          );
          // Continue with other debts even if one fails
        }
      }

      this.logger.log(
        `Overdue debt check completed. Created ${notificationCount} notification(s) for ${overdueDebts.length} overdue debt(s).`,
      );
    } catch (error) {
      this.logger.error(`Error during overdue debt check: ${error.message}`, error.stack);
    }
  }

  /**
   * Manual trigger for testing purposes
   * Can be called via API endpoint if needed
   */
  async manualCheckOverdueDebts() {
    this.logger.log('Manual overdue debt check triggered');
    return this.checkOverdueDebts();
  }
}
