import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ExcelExportService } from './excel-export.service';
import { PdfExportService } from './pdf-export.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReportsController],
  providers: [ExcelExportService, PdfExportService],
  exports: [ExcelExportService, PdfExportService],
})
export class ReportsModule {}
