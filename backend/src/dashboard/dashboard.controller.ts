import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchAccessGuard } from '../common/guards/branch-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/types/prisma-enums';

interface RequestUser {
  id: string;
  username: string;
  role: UserRole;
  branchId: string | null;
}

@Controller('dashboard')
@UseGuards(JwtAuthGuard, BranchAccessGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Get comprehensive dashboard statistics
   * Combines multiple data sources into a single response for optimal performance
   *
   * Query Parameters:
   * - date: Optional date (YYYY-MM-DD), defaults to today
   * - startDate: Optional start date for range filtering (YYYY-MM-DD)
   * - endDate: Optional end date for range filtering (YYYY-MM-DD)
   * - branchId: Optional branch filter (admin only)
   *
   * Note: If startDate/endDate are provided, they override the 'date' parameter
   *
   * Returns:
   * - Financial summary (revenue, expenses, net)
   * - Recent transactions
   * - Monthly revenue trends (last 6 months)
   * - Category breakdown
   * - Transaction count
   */
  @Get('stats')
  async getStats(
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('branchId') branchId?: string,
    @CurrentUser() user?: RequestUser,
  ) {
    return this.dashboardService.getDashboardStats(date, startDate, endDate, branchId, user);
  }
}
