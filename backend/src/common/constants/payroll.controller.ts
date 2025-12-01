import { Controller, Post, Body, UseGuards, Get, Param, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchAccessGuard } from '../common/guards/branch-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces';
import { PayrollService } from './payroll.service';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { PaySalaryDto } from './dto/pay-salary.dto';

@Controller('payroll')
@UseGuards(JwtAuthGuard, BranchAccessGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('adjustments')
  createAdjustment(@Body() createAdjustmentDto: CreateAdjustmentDto, @CurrentUser() user: RequestUser) {
    return this.payrollService.createAdjustment(createAdjustmentDto, user);
  }

  @Get('employee/:employeeId/salary-details')
  getEmployeeSalaryDetails(
    @Param('employeeId') employeeId: string,
    @Query('month') month: string, // YYYY-MM format
    @CurrentUser() user: RequestUser,
  ) {
    return this.payrollService.getEmployeeSalaryDetails(employeeId, month, user);
  }

  @Post('pay-salary')
  paySalary(@Body() paySalaryDto: PaySalaryDto, @CurrentUser() user: RequestUser) {
    return this.payrollService.paySalary(paySalaryDto, user);
  }
}