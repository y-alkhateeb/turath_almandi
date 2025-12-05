import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CreateIncomeDto } from './dto/create-income.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchAccessGuard } from '../common/guards/branch-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces';
import { parsePagination } from '../common/utils/pagination.util';
import { TransactionType, PaymentMethod } from '../common/types/prisma-enums';

@Controller('transactions')
@UseGuards(JwtAuthGuard, BranchAccessGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // ============================================
  // TRANSACTION CREATION ENDPOINTS
  // ============================================

  /**
   * Create a new INCOME transaction
   * POST /transactions/income
   */
  @Post('income')
  createIncome(@Body() dto: CreateIncomeDto, @CurrentUser() user: RequestUser) {
    return this.transactionsService.createIncome(dto, user);
  }

  /**
   * Create a new EXPENSE transaction
   * POST /transactions/expense
   */
  @Post('expense')
  createExpense(@Body() dto: CreateExpenseDto, @CurrentUser() user: RequestUser) {
    return this.transactionsService.createExpense(dto, user);
  }

  // ============================================
  // QUERY ENDPOINTS
  // ============================================

  @Get()
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: TransactionType,
    @Query('branchId') branchId?: string,
    @Query('category') category?: string,
    @Query('paymentMethod') paymentMethod?: PaymentMethod,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    const pagination = parsePagination(page, limit);

    const filters = {
      type,
      branchId,
      category,
      paymentMethod,
      startDate,
      endDate,
      search,
    };

    return this.transactionsService.findAll(user, pagination, filters);
  }

  @Get('summary')
  getSummary(
    @Query('date') date?: string,
    @Query('branchId') branchId?: string,
    @CurrentUser() user?: RequestUser,
  ) {
    return this.transactionsService.getSummary(date, branchId, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.transactionsService.findOne(id, user);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.transactionsService.update(id, updateTransactionDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.transactionsService.remove(id, user);
  }
}
