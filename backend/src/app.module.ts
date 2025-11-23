import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BranchesModule } from './branches/branches.module';
import { TransactionsModule } from './transactions/transactions.module';
import { UsersModule } from './users/users.module';
import { DebtsModule } from './debts/debts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TasksModule } from './tasks/tasks.module';
import { InventoryModule } from './inventory/inventory.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { WebSocketModule } from './websocket/websocket.module';
import { ReportsModule } from './reports/reports.module';
import { SettingsModule } from './settings/settings.module';
import { EmployeesModule } from './employees/employees.module';
import { UploadModule } from './upload/upload.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { ResponseTimeMiddleware } from './common/middleware/response-time.middleware';
import { envValidationSchema } from './common/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false, // Show all validation errors at once
        allowUnknown: true, // Allow other env vars not in schema
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per 60 seconds
      },
    ]),
    PrismaModule,
    AuthModule,
    BranchesModule,
    TransactionsModule,
    UsersModule,
    DebtsModule,
    NotificationsModule,
    TasksModule,
    InventoryModule,
    DashboardModule,
    WebSocketModule,
    ReportsModule,
    SettingsModule,
    EmployeesModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Apply RequestIdMiddleware first to generate request ID
    consumer.apply(RequestIdMiddleware).forRoutes('*');

    // Apply ResponseTimeMiddleware to track request duration
    consumer.apply(ResponseTimeMiddleware).forRoutes('*');

    // Apply LoggerMiddleware after RequestIdMiddleware and ResponseTimeMiddleware
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
