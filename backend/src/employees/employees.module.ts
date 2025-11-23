import { Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { SalaryPaymentsService } from './salary-payments.service';
import { SalaryIncreasesService } from './salary-increases.service';
import { BonusesService } from './bonuses.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogModule } from '../common/audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [EmployeesController],
  providers: [EmployeesService, SalaryPaymentsService, SalaryIncreasesService, BonusesService],
  exports: [EmployeesService, SalaryPaymentsService, SalaryIncreasesService, BonusesService],
})
export class EmployeesModule {}
