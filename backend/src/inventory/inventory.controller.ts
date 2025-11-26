import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchAccessGuard } from '../common/guards/branch-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces';
import { parsePagination } from '../common/utils/pagination.util';
import { InventoryUnit } from '../common/types/prisma-enums';

@Controller('inventory')
@UseGuards(JwtAuthGuard, BranchAccessGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  create(@Body() createInventoryDto: CreateInventoryDto, @CurrentUser() user: RequestUser) {
    return this.inventoryService.create(createInventoryDto, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('branchId') branchId?: string,
    @Query('unit') unit?: InventoryUnit,
    @Query('search') search?: string,
  ) {
    const pagination = parsePagination(page, limit);

    const filters = {
      branchId,
      unit,
      search,
    };

    return this.inventoryService.findAll(user, pagination, filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.inventoryService.findOne(id, user);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.update(id, updateInventoryDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.inventoryService.remove(id, user);
  }
}
