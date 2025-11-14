import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchGuard } from '../common/guards/branch.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface RequestUser {
  id: string;
  username: string;
  role: string;
  branchId: string | null;
}

@Controller('transactions')
@UseGuards(JwtAuthGuard, BranchGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.transactionsService.create(createTransactionDto, user.id);
  }

  @Get()
  findAll(@Query('branchId') branchId?: string) {
    return this.transactionsService.findAll(branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }
}
