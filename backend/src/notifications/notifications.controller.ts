import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationSettingsService } from './notification-settings.service';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

interface RequestUser {
  id: string;
  username: string;
  role: UserRole;
  branchId: string | null;
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationSettingsService: NotificationSettingsService,
  ) {}

  /**
   * Get count of unread notifications for the current user
   * Must be before @Get('unread') to avoid route conflicts
   */
  @Get('unread/count')
  async getUnreadCount(@CurrentUser() user: RequestUser) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  /**
   * Get all unread notifications for the current user
   */
  @Get('unread')
  getUnreadNotifications(@CurrentUser() user: RequestUser) {
    return this.notificationsService.getUnreadNotifications(user.id);
  }

  /**
   * Mark a notification as read
   */
  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  /**
   * Get notification settings for the current user
   */
  @Get('settings')
  getUserSettings(@CurrentUser() user: RequestUser) {
    return this.notificationSettingsService.getUserSettings(user.id);
  }

  /**
   * Get a specific notification setting for the current user
   */
  @Get('settings/:notificationType')
  getSetting(@CurrentUser() user: RequestUser, @Param('notificationType') notificationType: string) {
    return this.notificationSettingsService.getSetting(user.id, notificationType);
  }

  /**
   * Update notification settings for the current user
   * Uses POST for upsert (create or update), returns 200 not 201
   */
  @Post('settings')
  @HttpCode(HttpStatus.OK)
  updateSettings(@CurrentUser() user: RequestUser, @Body() updateDto: UpdateNotificationSettingsDto) {
    return this.notificationSettingsService.updateSettings(user.id, updateDto);
  }

  /**
   * Delete a notification setting
   */
  @Delete('settings/:notificationType')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSetting(@CurrentUser() user: RequestUser, @Param('notificationType') notificationType: string) {
    return this.notificationSettingsService.deleteSetting(user.id, notificationType);
  }

  /**
   * Get enabled notification types for the current user
   */
  @Get('settings/enabled/types')
  getEnabledTypes(@CurrentUser() user: RequestUser) {
    return this.notificationSettingsService.getEnabledNotificationTypes(user.id);
  }
}
