import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CreatePurchaseExpenseDto } from './dto/create-purchase-expense.dto';
import { CreateTransactionWithInventoryDto } from './dto/create-transaction-with-inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchAccessGuard } from '../common/guards/branch-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, TransactionType, PaymentMethod } from '@prisma/client';

interface RequestUser {
  id: string;
  username: string;
  role: UserRole;
  branchId: string | null;
}

@Controller('transactions')
@UseGuards(JwtAuthGuard, BranchAccessGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(@Body() createTransactionDto: CreateTransactionDto, @CurrentUser() user: RequestUser) {
    return this.transactionsService.create(createTransactionDto, user);
  }

  @Post('purchase')
  createPurchase(
    @Body() createPurchaseDto: CreatePurchaseExpenseDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.transactionsService.createPurchaseWithInventory(createPurchaseDto, user);
  }

  @Post('with-inventory')
  createWithInventory(
    @Body() dto: CreateTransactionWithInventoryDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.transactionsService.createTransactionWithInventory(dto, user);
  }

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
    const pagination = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };

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
