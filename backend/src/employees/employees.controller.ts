import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { SalaryPaymentsService } from './salary-payments.service';
import { SalaryIncreasesService } from './salary-increases.service';
import { BonusesService } from './bonuses.service';
import { AdvancesService } from './advances.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreateSalaryPaymentDto } from './dto/create-salary-payment.dto';
import { RecordSalaryIncreaseDto } from './dto/record-salary-increase.dto';
import { CreateBonusDto } from './dto/create-bonus.dto';
import { ResignEmployeeDto } from './dto/resign-employee.dto';
import { CreateAdvanceDto } from './dto/create-advance.dto';
import { RecordDeductionDto } from './dto/record-deduction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchAccessGuard } from '../common/guards/branch-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces';
import { parsePagination } from '../common/utils/pagination.util';
import { EmployeeStatus } from '../common/types/prisma-enums';

@Controller('employees')
@UseGuards(JwtAuthGuard, BranchAccessGuard)
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly salaryPaymentsService: SalaryPaymentsService,
    private readonly salaryIncreasesService: SalaryIncreasesService,
    private readonly bonusesService: BonusesService,
    private readonly advancesService: AdvancesService,
  ) {}

  // Employee endpoints
  @Post()
  create(@Body() createEmployeeDto: CreateEmployeeDto, @CurrentUser() user: RequestUser) {
    return this.employeesService.create(createEmployeeDto, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: EmployeeStatus,
    @Query('branchId') branchId?: string,
    @Query('search') search?: string,
  ) {
    const pagination = parsePagination(page, limit);

    const filters = {
      status,
      branchId,
      search,
    };

    return this.employeesService.findAll(user, pagination, filters);
  }

  @Get('active/:branchId')
  getActive(@Param('branchId') branchId: string, @CurrentUser() user: RequestUser) {
    return this.employeesService.getActive(branchId, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.employeesService.findOne(id, user);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.employeesService.update(id, updateEmployeeDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.employeesService.remove(id, user);
  }

  @Post(':id/resign')
  resign(
    @Param('id') id: string,
    @Body() resignEmployeeDto: ResignEmployeeDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.employeesService.resign(id, resignEmployeeDto, user);
  }

  // Salary payment endpoints
  @Post(':id/salary-payments')
  createSalaryPayment(
    @Param('id') employeeId: string,
    @Body() createSalaryPaymentDto: CreateSalaryPaymentDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.salaryPaymentsService.create(employeeId, createSalaryPaymentDto, user);
  }

  @Get(':id/salary-payments')
  getSalaryPayments(
    @Param('id') employeeId: string,
    @CurrentUser() user: RequestUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters = {
      startDate,
      endDate,
    };

    return this.salaryPaymentsService.findByEmployee(employeeId, filters, user);
  }

  @Delete('salary-payments/:id')
  deleteSalaryPayment(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.salaryPaymentsService.remove(id, user);
  }

  // Salary increase endpoints
  @Post(':id/salary-increases')
  recordSalaryIncrease(
    @Param('id') employeeId: string,
    @Body() recordSalaryIncreaseDto: RecordSalaryIncreaseDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.salaryIncreasesService.record(employeeId, recordSalaryIncreaseDto, user);
  }

  @Get(':id/salary-increases')
  getSalaryIncreases(@Param('id') employeeId: string, @CurrentUser() user: RequestUser) {
    return this.salaryIncreasesService.findByEmployee(employeeId, user);
  }

  // Bonus endpoints
  @Post(':id/bonuses')
  createBonus(
    @Param('id') employeeId: string,
    @Body() createBonusDto: CreateBonusDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.bonusesService.create(employeeId, createBonusDto, user);
  }

  @Get(':id/bonuses')
  getBonuses(
    @Param('id') employeeId: string,
    @CurrentUser() user: RequestUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters = {
      startDate,
      endDate,
    };

    return this.bonusesService.findByEmployee(employeeId, filters, user);
  }

  @Delete('bonuses/:id')
  deleteBonus(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.bonusesService.remove(id, user);
  }

  // Branch payroll summary
  @Get('branch/:branchId/payroll-summary')
  getPayrollSummary(
    @Param('branchId') branchId: string,
    @CurrentUser() user: RequestUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const dateRange = {
      startDate,
      endDate,
    };

    return this.salaryPaymentsService.getSummary(branchId, dateRange, user);
  }

  @Get('branch/:branchId/recent-increases')
  getRecentIncreases(
    @Param('branchId') branchId: string,
    @CurrentUser() user: RequestUser,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.salaryIncreasesService.getRecentIncreases(branchId, limitNum, user);
  }

  // ============================================
  // Advance (سلفة) endpoints
  // ============================================

  @Post('advances')
  createAdvance(@Body() createAdvanceDto: CreateAdvanceDto, @CurrentUser() user: RequestUser) {
    return this.advancesService.createAdvance(createAdvanceDto, user);
  }

  @Get(':id/advances')
  getEmployeeAdvances(@Param('id') employeeId: string, @CurrentUser() user: RequestUser) {
    return this.advancesService.getEmployeeAdvances(employeeId, user);
  }

  @Post('advances/deductions')
  recordDeduction(
    @Body() recordDeductionDto: RecordDeductionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.advancesService.recordDeduction(recordDeductionDto, user);
  }

  @Post('advances/:id/cancel')
  cancelAdvance(@Param('id') advanceId: string, @CurrentUser() user: RequestUser) {
    return this.advancesService.cancelAdvance(advanceId, user);
  }

  @Get('branch/:branchId/advances-summary')
  getBranchAdvancesSummary(
    @Param('branchId') branchId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.advancesService.getBranchAdvancesSummary(branchId, user);
  }
}
