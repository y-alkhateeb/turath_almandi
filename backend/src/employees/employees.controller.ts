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
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ResignEmployeeDto } from './dto/resign-employee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchAccessGuard } from '../common/guards/branch-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces';
import { parsePagination } from '../common/utils/pagination.util';
import { EmployeeStatus } from '../common/types/prisma-enums';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@Controller('employees')
@UseGuards(JwtAuthGuard, BranchAccessGuard)
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService) {}

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
}
