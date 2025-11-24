import { Module } from '@nestjs/common';
import { SmartReportsController } from './smart-reports.controller';
import { QueryBuilderService } from './services/query-builder.service';
import { ReportConfigService } from './services/report-config.service';
import { ExportService } from './services/export.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SmartReportsController],
  providers: [
    QueryBuilderService,
    ReportConfigService,
    ExportService,
  ],
  exports: [
    QueryBuilderService,
    ReportConfigService,
  ],
})
export class SmartReportsModule {}
