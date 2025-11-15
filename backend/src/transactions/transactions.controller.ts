import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreatePurchaseExpenseDto } from './dto/create-purchase-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

interface RequestUser {
  id: string;
  username: string;
  role: UserRole;
  branchId: string | null;
}

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.transactionsService.create(createTransactionDto, user);
  }

  @Post('purchase')
  createPurchase(
    @Body() createPurchaseDto: CreatePurchaseExpenseDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.transactionsService.createPurchaseWithInventory(createPurchaseDto, user);
  }

  @Get()
  findAll(@Query('branchId') branchId?: string) {
    return this.transactionsService.findAll(branchId);
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
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }
}
