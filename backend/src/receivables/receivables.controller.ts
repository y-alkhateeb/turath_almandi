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
import { ReceivablesService } from './receivables.service';
import { CreateReceivableDto } from './dto/create-receivable.dto';
import { UpdateReceivableDto } from './dto/update-receivable.dto';
import { QueryReceivablesDto } from './dto/query-receivables.dto';
import { CollectReceivableDto } from './dto/collect-receivable.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchAccessGuard } from '../common/guards/branch-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces';

@Controller('receivables')
@UseGuards(JwtAuthGuard, BranchAccessGuard)
export class ReceivablesController {
  constructor(private readonly receivablesService: ReceivablesService) {}

  @Post()
  create(@Body() createReceivableDto: CreateReceivableDto, @CurrentUser() user: RequestUser) {
    return this.receivablesService.create(createReceivableDto, user);
  }

  @Get()
  findAll(@CurrentUser() user: RequestUser, @Query() query: QueryReceivablesDto) {
    return this.receivablesService.findAll(user, query);
  }

  @Get('summary')
  getSummary(@CurrentUser() user: RequestUser, @Query('branchId') branchId?: string) {
    return this.receivablesService.getSummary(user, branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.receivablesService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateReceivableDto: UpdateReceivableDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.receivablesService.update(id, updateReceivableDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.receivablesService.remove(id, user);
  }

  @Post(':id/collect')
  collectReceivable(
    @Param('id') id: string,
    @Body() collectReceivableDto: CollectReceivableDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.receivablesService.collectReceivable(id, collectReceivableDto, user);
  }
}
