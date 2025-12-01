import { Module } from '@nestjs/common';
import { InventorySubUnitsService } from './inventory-sub-units.service';
import { InventorySubUnitsController } from './inventory-sub-units.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogService } from '../common/audit-log/audit-log.service';

@Module({
  imports: [PrismaModule],
  controllers: [InventorySubUnitsController],
  providers: [InventorySubUnitsService, AuditLogService],
  exports: [InventorySubUnitsService],
})
export class InventorySubUnitsModule {}
