import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { DebtsService } from './debts.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { PayDebtDto } from './dto/pay-debt.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

interface RequestUser {
  id: string;
  username: string;
  role: UserRole;
  branchId: string | null;
}

@Controller('debts')
@UseGuards(JwtAuthGuard)
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Post()
  create(@Body() createDebtDto: CreateDebtDto, @CurrentUser() user: RequestUser) {
    return this.debtsService.create(createDebtDto, user);
  }

  @Get()
  findAll(@CurrentUser() user: RequestUser) {
    return this.debtsService.findAll(user);
  }

  @Post(':id/payments')
  payDebt(
    @Param('id') id: string,
    @Body() payDebtDto: PayDebtDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.debtsService.payDebt(id, payDebtDto, user);
  }
}
