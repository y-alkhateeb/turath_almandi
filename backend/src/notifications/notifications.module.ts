import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationSettingsService } from './notification-settings.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [PrismaModule, WebSocketModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationSettingsService],
  exports: [NotificationsService, NotificationSettingsService],
})
export class NotificationsModule {}
