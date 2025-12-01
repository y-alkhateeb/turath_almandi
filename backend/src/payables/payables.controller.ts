import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PayablesService } from './payables.service';
import { CreatePayableDto } from './dto/create-payable.dto';
import { UpdatePayableDto } from './dto/update-payable.dto';
import { QueryPayablesDto } from './dto/query-payables.dto';
import { PayPayableDto } from './dto/pay-payable.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchAccessGuard } from '../common/guards/branch-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces';

@Controller('payables')
@UseGuards(JwtAuthGuard, BranchAccessGuard)
export class PayablesController {
  constructor(private readonly payablesService: PayablesService) {}

  @Post()
  create(@Body() createPayableDto: CreatePayableDto, @CurrentUser() user: RequestUser) {
    return this.payablesService.create(createPayableDto, user);
  }

  @Get()
  findAll(@CurrentUser() user: RequestUser, @Query() query: QueryPayablesDto) {
    return this.payablesService.findAll(user, query);
  }

  @Get('summary')
  getSummary(@CurrentUser() user: RequestUser, @Query('branchId') branchId?: string) {
    return this.payablesService.getSummary(user, branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.payablesService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePayableDto: UpdatePayableDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.payablesService.update(id, updatePayableDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.payablesService.remove(id, user);
  }

  @Post(':id/pay')
  payPayable(
    @Param('id') id: string,
    @Body() payPayableDto: PayPayableDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.payablesService.payPayable(id, payPayableDto, user);
  }
}
