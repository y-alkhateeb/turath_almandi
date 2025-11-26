import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationSettingsService } from './notification-settings.service';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces';
import { parsePagination } from '../common/utils/pagination.util';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationSettingsService: NotificationSettingsService,
  ) {}

  /**
   * Get all notifications with pagination and filters
   * Query parameters: branchId, isRead, type, startDate, endDate, page, limit
   */
  @Get()
  getAll(
    @CurrentUser() user: RequestUser,
    @Query('branchId') branchId?: string,
    @Query('isRead') isRead?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Convert string query params to correct types
    const filters = {
      branchId,
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      type,
      startDate,
      endDate,
    };

    const pagination = parsePagination(page, limit, { page: 1, limit: 50, maxLimit: 100 });

    return this.notificationsService.getAll(filters, pagination.page, pagination.limit);
  }

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
   * Mark all unread notifications as read
   */
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  markAllAsRead(@CurrentUser() user: RequestUser) {
    return this.notificationsService.markAllAsRead(user.id);
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
