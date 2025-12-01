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
import { InventorySubUnitsService } from './inventory-sub-units.service';
import { CreateInventorySubUnitDto } from './dto/create-inventory-sub-unit.dto';
import { UpdateInventorySubUnitDto } from './dto/update-inventory-sub-unit.dto';
import { QueryInventorySubUnitsDto } from './dto/query-inventory-sub-units.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchAccessGuard } from '../common/guards/branch-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces';

@Controller('inventory-sub-units')
@UseGuards(JwtAuthGuard, BranchAccessGuard)
export class InventorySubUnitsController {
  constructor(private readonly inventorySubUnitsService: InventorySubUnitsService) {}

  @Post()
  create(
    @Body() createInventorySubUnitDto: CreateInventorySubUnitDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventorySubUnitsService.create(createInventorySubUnitDto, user);
  }

  @Get()
  findAll(@CurrentUser() user: RequestUser, @Query() query: QueryInventorySubUnitsDto) {
    return this.inventorySubUnitsService.findAll(user, query);
  }

  @Get('by-item/:inventoryItemId')
  getByInventoryItem(
    @Param('inventoryItemId') inventoryItemId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventorySubUnitsService.getByInventoryItem(inventoryItemId, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.inventorySubUnitsService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInventorySubUnitDto: UpdateInventorySubUnitDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventorySubUnitsService.update(id, updateInventorySubUnitDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.inventorySubUnitsService.remove(id, user);
  }
}
