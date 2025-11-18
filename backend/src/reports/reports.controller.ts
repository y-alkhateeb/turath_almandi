import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ExcelExportService } from './excel-export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

interface RequestUser {
  id: string;
  username: string;
  role: UserRole;
  branchId: string | null;
}

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly excelExportService: ExcelExportService) {}

  /**
   * Export transactions to Excel
   * GET /reports/transactions/excel?branchId=xxx&startDate=2024-01-01&endDate=2024-12-31
   */
  @Get('transactions/excel')
  async exportTransactions(
    @CurrentUser() user: RequestUser,
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ): Promise<void> {
    const buffer = await this.excelExportService.exportTransactions(user, {
      branchId,
      startDate,
      endDate,
    });

    // Generate filename with current date
    const filename = `transactions_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    // Send buffer
    res.send(buffer);
  }

  /**
   * Export debts to Excel
   * GET /reports/debts/excel?branchId=xxx&startDate=2024-01-01&endDate=2024-12-31
   */
  @Get('debts/excel')
  async exportDebts(
    @CurrentUser() user: RequestUser,
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ): Promise<void> {
    const buffer = await this.excelExportService.exportDebts(user, {
      branchId,
      startDate,
      endDate,
    });

    // Generate filename with current date
    const filename = `debts_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    // Send buffer
    res.send(buffer);
  }

  /**
   * Export inventory to Excel
   * GET /reports/inventory/excel?branchId=xxx
   */
  @Get('inventory/excel')
  async exportInventory(
    @CurrentUser() user: RequestUser,
    @Query('branchId') branchId?: string,
    @Res() res?: Response,
  ): Promise<void> {
    const buffer = await this.excelExportService.exportInventory(user, {
      branchId,
    });

    // Generate filename with current date
    const filename = `inventory_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    // Send buffer
    res.send(buffer);
  }
}
