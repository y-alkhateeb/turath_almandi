import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { DebtsService } from './debts.service';
import { CreateDebtDto } from './dto/create-debt.dto';
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
  create(
    @Body() createDebtDto: CreateDebtDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.debtsService.create(createDebtDto, user);
  }

  @Get()
  findAll(@CurrentUser() user: RequestUser) {
    return this.debtsService.findAll(user);
  }
}
