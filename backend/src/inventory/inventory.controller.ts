import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { InventoryService, InventoryItemWithMetadata } from './inventory.service';
import { ConsumptionService, DailyConsumptionSummary } from './consumption.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { RecordConsumptionDto } from './dto/record-consumption.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchAccessGuard } from '../common/guards/branch-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces';
import { InventoryUnit } from '../common/types/prisma-enums';

@Controller('inventory')
@UseGuards(JwtAuthGuard, BranchAccessGuard)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly consumptionService: ConsumptionService,
  ) {}

  @Post()
  create(@Body() createInventoryDto: CreateInventoryDto, @CurrentUser() user: RequestUser) {
    return this.inventoryService.create(createInventoryDto, user);
  }

  /**
   * Get all inventory items
   * Returns all items matching the filters (no pagination)
   *
   * Query Parameters:
   * - branchId: Filter by branch UUID
   * - unit: Filter by inventory unit (KG | PIECE | LITER | OTHER)
   * - search: Search by item name
   * - excludeInternalConsumption: Exclude items marked for internal consumption only
   */
  @Get()
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('branchId') branchId?: string,
    @Query('unit') unit?: InventoryUnit,
    @Query('search') search?: string,
    @Query('excludeInternalConsumption') excludeInternalConsumption?: string,
  ): Promise<InventoryItemWithMetadata[]> {
    const filters = {
      branchId,
      unit,
      search,
      excludeInternalConsumption: excludeInternalConsumption === 'true' || excludeInternalConsumption === '1',
    };

    return this.inventoryService.findAll(user, filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<InventoryItemWithMetadata> {
    return this.inventoryService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
    @CurrentUser() user: RequestUser,
  ): Promise<InventoryItemWithMetadata> {
    return this.inventoryService.update(id, updateInventoryDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.inventoryService.remove(id, user);
  }

  // ============================================
  // CONSUMPTION ENDPOINTS
  // ============================================

  /**
   * Record consumption/damage of an inventory item
   * POST /inventory/:id/consume
   * Decreases inventory without creating transaction
   */
  @Post(':id/consume')
  recordConsumption(
    @Param('id') id: string,
    @Body() recordConsumptionDto: RecordConsumptionDto,
    @CurrentUser() user: RequestUser,
  ) {
    // Ensure the inventoryItemId matches the route param
    return this.consumptionService.recordConsumption(
      { ...recordConsumptionDto, inventoryItemId: id },
      user,
    );
  }

  /**
   * Get consumption history for a specific inventory item
   * GET /inventory/:id/consumption-history
   */
  @Get(':id/consumption-history')
  getConsumptionHistory(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.consumptionService.getConsumptionHistory(id, user, startDate, endDate);
  }

  /**
   * Get daily consumption summary
   * GET /inventory/consumption/daily
   */
  @Get('consumption/daily')
  getDailyConsumption(
    @CurrentUser() user: RequestUser,
    @Query('date') date: string,
    @Query('branchId') branchId?: string,
  ): Promise<DailyConsumptionSummary> {
    return this.consumptionService.getDailyConsumption(date, user, branchId);
  }
}
