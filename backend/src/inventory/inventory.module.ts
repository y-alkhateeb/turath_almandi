import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { ConsumptionService } from './consumption.service';
import { InventoryController } from './inventory.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogModule } from '../common/audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [InventoryController],
  providers: [InventoryService, ConsumptionService],
  exports: [InventoryService, ConsumptionService],
})
export class InventoryModule {}
