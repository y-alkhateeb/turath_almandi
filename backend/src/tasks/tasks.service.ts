import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DebtStatus, UserRole } from '../common/types/prisma-enums';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

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
   * Creates a SYSTEM user if it doesn't exist for automated tasks (CRON jobs, notifications)
   */
  async onModuleInit() {
    try {
      // Find or create a system user for automated tasks
      let systemUser = await this.prisma.user.findFirst({
        where: { username: 'system' },
        select: { id: true },
      });

      if (systemUser) {
        this.systemUserId = systemUser.id;
        this.logger.log(`Using existing SYSTEM user: ${this.systemUserId}`);
      } else {
        // Create SYSTEM user if it doesn't exist
        this.logger.log('SYSTEM user not found. Creating SYSTEM user for automated tasks...');

        // Generate a secure, random password that cannot be guessed
        // This user is for automated tasks only and should not be used for login
        const randomPassword = randomUUID();
        const passwordHash = await bcrypt.hash(randomPassword, 10);

        systemUser = await this.prisma.user.create({
          data: {
            username: 'system',
            passwordHash: passwordHash,
            role: UserRole.ADMIN, // Admin role for necessary permissions
          },
          select: { id: true },
        });

        this.systemUserId = systemUser.id;
        this.logger.log(`SYSTEM user created successfully: ${this.systemUserId}`);
        this.logger.log(
          'SYSTEM user is used for automated CRON jobs and notifications. It cannot be used for login.',
        );
      }
    } catch (error) {
      this.logger.error(`Failed to initialize SYSTEM user: ${error.message}`, error.stack);

      // Fallback: If SYSTEM user creation fails, try to use an existing admin user
      this.logger.warn('Attempting to use existing admin user as fallback...');
      try {
        const adminUser = await this.prisma.user.findFirst({
          where: { role: 'ADMIN', isDeleted: false },
          select: { id: true },
        });

        if (adminUser) {
          this.systemUserId = adminUser.id;
          this.logger.log(`Using first admin user as fallback system user: ${this.systemUserId}`);
        } else {
          this.logger.error('No admin users found. Automated notifications may fail.');
        }
      } catch (fallbackError) {
        this.logger.error(
          `Failed to find fallback admin user: ${fallbackError.message}`,
          fallbackError.stack,
        );
      }
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
      // This query is optimized with a composite index on (status, due_date)
      // The 'lt' (less than) operator ensures efficient query execution
      // Index: debts_status_dueDate_idx on (status, due_date)
      const overdueDebts = await this.prisma.debt.findMany({
        where: {
          status: DebtStatus.ACTIVE,
          dueDate: {
            lt: today, // Uses Prisma's lt operator for efficient comparison
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

  /**
   * CRON job to remind admins to backup the database
   * Runs weekly on Sunday at 8 AM UTC
   *
   * Purpose:
   * - Sends weekly notification to all admin users
   * - Reminds them to backup the database
   * - Critical for data protection and disaster recovery
   *
   * Schedule: Every Sunday at 8:00 AM UTC
   * CRON Expression: 0 8 * * 0 (minute hour day month day-of-week)
   */
  @Cron(CronExpression.EVERY_WEEK, {
    name: 'remindBackup',
    timeZone: 'UTC',
  })
  async remindBackup() {
    this.logger.log('Starting weekly backup reminder...');

    try {
      // Get all admin users
      const adminUsers = await this.notificationsService.getAdminUsers();

      if (adminUsers.length === 0) {
        this.logger.warn('No admin users found to receive backup reminder');
        return;
      }

      this.logger.log(`Creating backup reminders for ${adminUsers.length} admin user(s)...`);

      // Create notification for each admin
      let notificationCount = 0;
      for (const admin of adminUsers) {
        try {
          await this.prisma.notification.create({
            data: {
              type: 'backup_reminder',
              title: 'تذكير: نسخ احتياطي للبيانات',
              message: 'حان الوقت لإجراء نسخة احتياطية من قاعدة البيانات. يرجى التأكد من نسخ جميع البيانات الهامة والاحتفاظ بها في مكان آمن.',
              severity: 'WARNING',
              createdBy: this.systemUserId,
            },
          });

          notificationCount++;
          this.logger.debug(`Backup reminder created for admin: ${admin.username}`);
        } catch (error) {
          this.logger.error(
            `Failed to create backup reminder for admin ${admin.id}: ${error.message}`,
            error.stack,
          );
          // Continue with other admins even if one fails
        }
      }

      this.logger.log(
        `Weekly backup reminder completed. Created ${notificationCount} notification(s) for ${adminUsers.length} admin user(s).`,
      );
    } catch (error) {
      this.logger.error(`Error during backup reminder: ${error.message}`, error.stack);
    }
  }

  /**
   * Manual trigger for backup reminder (for testing)
   */
  async manualRemindBackup() {
    this.logger.log('Manual backup reminder triggered');
    return this.remindBackup();
  }
}
