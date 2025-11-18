import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { DisplayMethod, Prisma } from '@prisma/client';

// Type for notification setting with user relation
type NotificationSettingWithUser = Prisma.NotificationSettingGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        username: true;
        role: true;
      };
    };
  };
}>;

@Injectable()
export class NotificationSettingsService {
  private readonly logger = new Logger(NotificationSettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all notification settings for a user
   * Returns default settings if none exist
   *
   * @param userId - User ID
   * @returns Array of notification settings
   */
  async getUserSettings(userId: string): Promise<NotificationSettingWithUser[]> {
    const settings = await this.prisma.notificationSetting.findMany({
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
        notificationType: 'asc',
      },
    });

    this.logger.debug(`Retrieved ${settings.length} notification settings for user ${userId}`);

    // If no settings exist, return default settings
    if (settings.length === 0) {
      this.logger.debug(`No settings found for user ${userId}, returning empty array`);
      return [];
    }

    return settings;
  }

  /**
   * Update notification settings for a user
   * Creates new setting if it doesn't exist, updates if it does
   *
   * @param userId - User ID
   * @param updateDto - Settings to update
   * @returns Updated notification setting
   */
  async updateSettings(
    userId: string,
    updateDto: UpdateNotificationSettingsDto,
  ): Promise<NotificationSettingWithUser> {
    this.logger.debug(
      `Updating notification settings for user ${userId}, type ${updateDto.notificationType}`,
    );

    // Prepare data for upsert
    const data: Prisma.NotificationSettingUpdateInput = {};

    if (updateDto.isEnabled !== undefined) {
      data.isEnabled = updateDto.isEnabled;
    }

    if (updateDto.minAmount !== undefined) {
      data.minAmount = updateDto.minAmount;
    }

    if (updateDto.selectedBranches !== undefined) {
      data.selectedBranches = updateDto.selectedBranches as Prisma.InputJsonValue;
    }

    if (updateDto.displayMethod !== undefined) {
      data.displayMethod = updateDto.displayMethod;
    }

    // Use upsert to create or update
    const setting = await this.prisma.notificationSetting.upsert({
      where: {
        userId_notificationType: {
          userId,
          notificationType: updateDto.notificationType,
        },
      },
      update: data,
      create: {
        userId,
        notificationType: updateDto.notificationType,
        isEnabled: updateDto.isEnabled ?? true,
        minAmount: updateDto.minAmount,
        selectedBranches: updateDto.selectedBranches as Prisma.InputJsonValue,
        displayMethod: updateDto.displayMethod ?? DisplayMethod.POPUP,
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
    });

    this.logger.log(
      `Notification settings updated for user ${userId}, type ${updateDto.notificationType}`,
    );

    return setting;
  }

  /**
   * Get a specific notification setting for a user
   *
   * @param userId - User ID
   * @param notificationType - Type of notification
   * @returns Notification setting or null if not found
   */
  async getSetting(
    userId: string,
    notificationType: string,
  ): Promise<NotificationSettingWithUser | null> {
    const setting = await this.prisma.notificationSetting.findUnique({
      where: {
        userId_notificationType: {
          userId,
          notificationType,
        },
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
    });

    return setting;
  }

  /**
   * Delete a notification setting
   *
   * @param userId - User ID
   * @param notificationType - Type of notification
   * @returns Deleted notification setting
   */
  async deleteSetting(userId: string, notificationType: string): Promise<void> {
    await this.prisma.notificationSetting.delete({
      where: {
        userId_notificationType: {
          userId,
          notificationType,
        },
      },
    });

    this.logger.log(
      `Notification setting deleted for user ${userId}, type ${notificationType}`,
    );
  }

  /**
   * Get all enabled notification types for a user
   * Used to determine what notifications to send
   *
   * @param userId - User ID
   * @returns Array of enabled notification types
   */
  async getEnabledNotificationTypes(userId: string): Promise<string[]> {
    const settings = await this.prisma.notificationSetting.findMany({
      where: {
        userId,
        isEnabled: true,
      },
      select: {
        notificationType: true,
      },
    });

    return settings.map((s) => s.notificationType);
  }
}
