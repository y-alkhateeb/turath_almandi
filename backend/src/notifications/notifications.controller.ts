import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationSettingsService } from './notification-settings.service';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationSettingsService: NotificationSettingsService,
  ) {}

  /**
   * Get all unread notifications for the current user
   */
  @Get('unread')
  getUnreadNotifications(@Request() req: any) {
    return this.notificationsService.getUnreadNotifications(req.user.id);
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
  getUserSettings(@Request() req: any) {
    return this.notificationSettingsService.getUserSettings(req.user.id);
  }

  /**
   * Get a specific notification setting for the current user
   */
  @Get('settings/:notificationType')
  getSetting(@Request() req: any, @Param('notificationType') notificationType: string) {
    return this.notificationSettingsService.getSetting(req.user.id, notificationType);
  }

  /**
   * Update notification settings for the current user
   */
  @Post('settings')
  updateSettings(@Request() req: any, @Body() updateDto: UpdateNotificationSettingsDto) {
    return this.notificationSettingsService.updateSettings(req.user.id, updateDto);
  }

  /**
   * Delete a notification setting
   */
  @Delete('settings/:notificationType')
  deleteSetting(@Request() req: any, @Param('notificationType') notificationType: string) {
    return this.notificationSettingsService.deleteSetting(req.user.id, notificationType);
  }

  /**
   * Get enabled notification types for the current user
   */
  @Get('settings/enabled/types')
  getEnabledTypes(@Request() req: any) {
    return this.notificationSettingsService.getEnabledNotificationTypes(req.user.id);
  }
}
