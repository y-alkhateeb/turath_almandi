# Overdue Debt Notifications Implementation

## Overview

This document describes the automated overdue debt checking and notifications system implemented for the Turath Almandi restaurant accounting application.

## Features

- **Automated Daily Checks**: CRON job runs daily at 9 AM UTC (configurable)
- **Overdue Detection**: Finds debts where `due_date < today` AND `status = 'active'`
- **Automatic Notifications**: Creates notifications for each overdue debt
- **Admin Alerts**: Sends notifications to all active admin users
- **Duplicate Prevention**: Prevents duplicate notifications for the same debt on the same day
- **Comprehensive Logging**: Detailed logging for debugging and monitoring

## Architecture

### Modules Created

1. **NotificationsModule** (`src/notifications/`)
   - Service for creating and managing notifications
   - Handles overdue debt notifications
   - Manages admin user retrieval

2. **TasksModule** (`src/tasks/`)
   - CRON job service for scheduled tasks
   - Automated overdue debt checking
   - Configurable schedule via environment variables

### Files Created

```
backend/src/
├── notifications/
│   ├── notifications.module.ts
│   └── notifications.service.ts
├── tasks/
│   ├── tasks.module.ts
│   └── tasks.service.ts
└── app.module.ts (updated)
```

## Implementation Details

### 1. NotificationsService

**Location**: `src/notifications/notifications.service.ts`

**Key Methods**:

- `createNotification(dto)`: Generic method for creating notifications
- `createOverdueDebtNotification(...)`: Specialized method for overdue debt notifications
- `getAdminUsers()`: Retrieves all active admin users
- `getUnreadNotifications(userId)`: Gets unread notifications for a user
- `markAsRead(notificationId)`: Marks a notification as read

**Features**:
- Comprehensive logging for debugging
- Error handling with stack traces
- Calculates days past due automatically
- Links notifications to debt records via `relatedId` and `relatedType`

### 2. TasksService

**Location**: `src/tasks/tasks.service.ts`

**Key Methods**:

- `checkOverdueDebts()`: Main CRON job method (runs daily at 9 AM UTC)
- `manualCheckOverdueDebts()`: Manual trigger for testing
- `onModuleInit()`: Initializes system user for automated tasks

**CRON Configuration**:
```typescript
@Cron(CronExpression.EVERY_DAY_AT_9AM, {
  name: 'checkOverdueDebts',
  timeZone: 'UTC',
})
```

**Process Flow**:
1. Calculate today's date at midnight
2. Query database for overdue debts (`due_date < today` AND `status = 'ACTIVE'`)
3. Get list of admin users
4. For each overdue debt:
   - Check if notification already exists today (prevent duplicates)
   - Create notification with severity='WARNING'
   - Log the operation
5. Return summary of notifications created

### 3. Database Schema

The implementation uses existing Prisma schema tables:

**Notifications Table**:
```prisma
model Notification {
  id          String                 @id @default(uuid())
  type        String                 // 'overdue_debt'
  title       String
  message     String
  relatedId   String?                // Links to Debt.id
  relatedType String?                // 'debt'
  branchId    String?
  createdBy   String
  isRead      Boolean                @default(false)
  severity    NotificationSeverity   // WARNING
  createdAt   DateTime               @default(now())
  ...
}
```

**Debts Table** (existing):
```prisma
model Debt {
  id              String      @id
  creditorName    String
  remainingAmount Decimal
  dueDate         DateTime?
  status          DebtStatus  // ACTIVE, PAID, PARTIAL
  branchId        String
  ...
}
```

## Configuration

### Environment Variables

Add to `.env` file:

```bash
# Scheduled Tasks
# CRON expression for checking overdue debts
# Default: "0 9 * * *" (Every day at 9:00 AM UTC)
# Format: minute hour day-of-month month day-of-week
OVERDUE_DEBT_CHECK_CRON=0 9 * * *
```

### CRON Expression Examples

```bash
# Daily at 9:00 AM UTC (default)
OVERDUE_DEBT_CHECK_CRON=0 9 * * *

# Every 6 hours
OVERDUE_DEBT_CHECK_CRON=0 */6 * * *

# Every hour from 8 AM to 5 PM, Monday to Friday
OVERDUE_DEBT_CHECK_CRON=0 8-17 * * 1-5

# Every day at midnight
OVERDUE_DEBT_CHECK_CRON=0 0 * * *

# Twice daily (9 AM and 5 PM)
OVERDUE_DEBT_CHECK_CRON=0 9,17 * * *
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

The following packages have been added to `package.json`:
- `@nestjs/schedule` - For CRON job scheduling

### 2. Generate Prisma Client

```bash
npx prisma generate
```

**Important**: This step is required before building or running the application. It generates TypeScript types for the database schema.

### 3. Update Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Optionally customize the CRON schedule:
```bash
OVERDUE_DEBT_CHECK_CRON=0 9 * * *
```

### 4. Build and Run

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Usage

### Automatic Execution

The CRON job runs automatically based on the configured schedule. Logs will show:

```
[TasksService] Overdue debt check scheduled with CRON: 0 9 * * *
[TasksService] Starting overdue debt check...
[TasksService] Found 3 overdue debt(s)
[TasksService] Creating notifications for 2 admin user(s)...
[NotificationsService] Notification created successfully: id=xxx, type=overdue_debt
[TasksService] Overdue debt check completed. Created 3 notification(s) for 3 overdue debt(s).
```

### Manual Testing

For testing purposes, you can manually trigger the check by adding an endpoint:

```typescript
// In tasks.controller.ts (create if needed)
@Get('check-overdue-debts')
async manualCheck() {
  return this.tasksService.manualCheckOverdueDebts();
}
```

Then call:
```bash
curl http://localhost:3000/tasks/check-overdue-debts
```

## Notification Format

When a debt is overdue, notifications are created with:

- **Type**: `overdue_debt`
- **Title**: `Overdue Debt: {creditorName}`
- **Message**:
  ```
  Debt to {creditorName} is overdue by {days} day(s).
  Remaining amount: ${remainingAmount}.
  Due date was: {dueDate}
  ```
- **Severity**: `WARNING`
- **Related ID**: Links to the debt record
- **Related Type**: `debt`
- **Branch ID**: The branch where the debt belongs

## Logging

The implementation includes comprehensive logging:

- **Info Level**: Task start/completion, summary statistics
- **Debug Level**: Individual debt processing, admin user count
- **Error Level**: Failures with full stack traces
- **Warn Level**: Configuration issues, missing admin users

## Error Handling

- Individual debt notification failures don't stop processing
- Errors are logged with stack traces
- Task continues even if some notifications fail
- Duplicate prevention ensures notifications aren't created multiple times

## Testing Checklist

- [ ] Verify `@nestjs/schedule` is installed
- [ ] Run `npx prisma generate` to generate types
- [ ] Configure `OVERDUE_DEBT_CHECK_CRON` in `.env`
- [ ] Start application and verify CRON schedule in logs
- [ ] Create test debt with past due date and `ACTIVE` status
- [ ] Wait for CRON or trigger manually
- [ ] Verify notification created in database
- [ ] Verify notification appears for admin users
- [ ] Verify no duplicate notifications on subsequent runs

## Database Queries

Check overdue debts:
```sql
SELECT * FROM debts
WHERE due_date < CURRENT_DATE
AND status = 'ACTIVE';
```

Check notifications:
```sql
SELECT * FROM notifications
WHERE type = 'overdue_debt'
ORDER BY created_at DESC;
```

## Future Enhancements

Potential improvements:
1. Email/SMS notification delivery
2. Configurable notification frequency (daily, weekly)
3. Escalation rules (increase severity after X days)
4. Customizable notification templates
5. Dashboard widget for overdue debts
6. Notification preferences per user
7. Batch notification summary instead of individual notifications

## Troubleshooting

### CRON Job Not Running

1. Check logs for schedule configuration message
2. Verify `ScheduleModule.forRoot()` is imported
3. Check TasksModule is imported in AppModule
4. Verify application is running continuously

### No Notifications Created

1. Check if debts exist with `due_date < today` AND `status = 'ACTIVE'`
2. Verify admin users exist (`role = 'ADMIN'` AND `is_active = true`)
3. Check logs for error messages
4. Verify system user is initialized

### Build Errors

If you see TypeScript errors about missing Prisma types:
```bash
# Regenerate Prisma client
npx prisma generate

# Clean build
rm -rf dist
npm run build
```

## Support

For issues or questions, please refer to:
- NestJS Schedule documentation: https://docs.nestjs.com/techniques/task-scheduling
- Prisma documentation: https://www.prisma.io/docs
- CRON expression guide: https://crontab.guru/
