import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

interface RequestUser {
  id: string;
  username: string;
  role: UserRole;
  branchId: string | null;
}

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Get comprehensive dashboard statistics
   * Combines multiple data sources into a single response for optimal performance
   *
   * Query Parameters:
   * - date: Optional date (YYYY-MM-DD), defaults to today
   * - branchId: Optional branch filter (admin only)
   *
   * Returns:
   * - Today's financial summary (revenue, expenses, net)
   * - Recent transactions
   * - Monthly revenue trends (last 6 months)
   * - Category breakdown
   * - Transaction count
   */
  @Get('stats')
  async getStats(
    @Query('date') date?: string,
    @Query('branchId') branchId?: string,
    @CurrentUser() user?: RequestUser,
  ) {
    return this.dashboardService.getDashboardStats(date, branchId, user);
  }
}
