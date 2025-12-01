import { Module } from '@nestjs/common';
import { ReceivablesService } from './receivables.service';
import { ReceivablesController } from './receivables.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogService } from '../common/audit-log/audit-log.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReceivablesController],
  providers: [ReceivablesService, AuditLogService],
  exports: [ReceivablesService],
})
export class ReceivablesModule {}
