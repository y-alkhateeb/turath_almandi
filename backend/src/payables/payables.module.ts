import { Module } from '@nestjs/common';
import { PayablesService } from './payables.service';
import { PayablesController } from './payables.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogService } from '../common/audit-log/audit-log.service';

@Module({
  imports: [PrismaModule],
  controllers: [PayablesController],
  providers: [PayablesService, AuditLogService],
  exports: [PayablesService],
})
export class PayablesModule {}
