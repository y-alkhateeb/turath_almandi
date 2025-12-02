import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecordConsumptionDto } from './dto/record-consumption.dto';
import { Prisma } from '@prisma/client';
import { UserRole } from '../common/types/prisma-enums';
import { AuditLogService, AuditEntityType } from '../common/audit-log/audit-log.service';
import { formatDateForDB, getStartOfDay, getEndOfDay } from '../common/utils/date.utils';
import { ERROR_MESSAGES } from '../common/constants/error-messages';
import { RequestUser } from '../common/interfaces';

export interface DailyConsumptionSummary {
  date: string;
  totalConsumptions: number;
  itemsConsumed: Array<{
    inventoryItemId: string;
    itemName: string;
    quantity: number;
    unit: string;
    reason?: string;
  }>;
}

@Injectable()
export class ConsumptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Record consumption of an inventory item
   * Automatically updates inventory quantity
   */
  async recordConsumption(
    recordConsumptionDto: RecordConsumptionDto,
    user: RequestUser,
  ) {
    // Fetch the inventory item to verify it exists and check quantity
    const inventoryItem = await this.prisma.inventoryItem.findUnique({
      where: { id: recordConsumptionDto.inventoryItemId },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!inventoryItem) {
      throw new NotFoundException(
        ERROR_MESSAGES.INVENTORY.NOT_FOUND(recordConsumptionDto.inventoryItemId),
      );
    }

    // Verify user has access to this inventory item's branch
    if (user.role === UserRole.ACCOUNTANT && inventoryItem.branchId !== user.branchId) {
      throw new ForbiddenException(ERROR_MESSAGES.INVENTORY.NO_ACCESS);
    }

    // Verify unit matches
    if (inventoryItem.unit !== recordConsumptionDto.unit) {
      throw new BadRequestException(
        `Unit mismatch: inventory item uses ${inventoryItem.unit}, but ${recordConsumptionDto.unit} was provided`,
      );
    }

    // Check if sufficient quantity is available
    const currentQuantity = Number(inventoryItem.quantity);
    const consumedQuantity = recordConsumptionDto.quantity;

    if (currentQuantity < consumedQuantity) {
      throw new BadRequestException(
        `Insufficient inventory: available ${currentQuantity} ${inventoryItem.unit}, requested ${consumedQuantity} ${inventoryItem.unit}`,
      );
    }

    // Record consumption and update inventory in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create consumption record
      const consumption = await tx.inventoryConsumption.create({
        data: {
          inventoryItemId: recordConsumptionDto.inventoryItemId,
          branchId: inventoryItem.branchId,
          quantity: recordConsumptionDto.quantity,
          unit: recordConsumptionDto.unit,
          reason: recordConsumptionDto.reason,
          consumedAt: formatDateForDB(recordConsumptionDto.consumedAt),
          recordedBy: user.id,
        },
        include: {
          inventoryItem: {
            select: {
              id: true,
              name: true,
              unit: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Update inventory quantity (decrease)
      const updatedInventory = await tx.inventoryItem.update({
        where: { id: recordConsumptionDto.inventoryItemId },
        data: {
          quantity: {
            decrement: recordConsumptionDto.quantity,
          },
          lastUpdated: new Date(),
        },
      });

      return { consumption, updatedInventory };
    });

    // Log audit trail
    await this.auditLogService.logCreate(
      user.id,
      AuditEntityType.INVENTORY_ITEM,
      result.consumption.id,
      {
        action: 'consumption_recorded',
        inventoryItemId: inventoryItem.id,
        itemName: inventoryItem.name,
        quantityConsumed: recordConsumptionDto.quantity,
        unit: recordConsumptionDto.unit,
        reason: recordConsumptionDto.reason,
        previousQuantity: currentQuantity,
        newQuantity: Number(result.updatedInventory.quantity),
      },
    );

    return result.consumption;
  }

  /**
   * Get daily consumption summary for a specific date
   * Shows all consumption records and totals for the day
   */
  async getDailyConsumption(
    date: string,
    user: RequestUser,
    branchId?: string,
  ): Promise<DailyConsumptionSummary> {
    // Build where clause with role-based filtering
    let where: Prisma.InventoryConsumptionWhereInput = {};

    // Apply branch filtering based on user role
    if (user.role === UserRole.ACCOUNTANT) {
      if (!user.branchId) {
        throw new ForbiddenException(ERROR_MESSAGES.BRANCH.ACCOUNTANT_NOT_ASSIGNED);
      }
      where.branchId = user.branchId;
    } else if (user.role === UserRole.ADMIN && branchId) {
      where.branchId = branchId;
    }

    // Apply date filter for the specific day
    const targetDate = formatDateForDB(date);
    const startOfDay = getStartOfDay(targetDate);
    const endOfDay = getEndOfDay(targetDate);

    where.consumedAt = {
      gte: startOfDay,
      lte: endOfDay,
    };

    // Fetch consumption records for the day
    const consumptions = await this.prisma.inventoryConsumption.findMany({
      where,
      include: {
        inventoryItem: {
          select: {
            id: true,
            name: true,
            unit: true,
          },
        },
      },
      orderBy: {
        consumedAt: 'desc',
      },
    });

    // Build summary
    const totalConsumptions = consumptions.length;
    const itemsConsumed = consumptions.map((consumption) => ({
      inventoryItemId: consumption.inventoryItemId,
      itemName: consumption.inventoryItem.name,
      quantity: Number(consumption.quantity),
      unit: consumption.unit,
      reason: consumption.reason || undefined,
    }));

    return {
      date,
      totalConsumptions,
      itemsConsumed,
    };
  }

  /**
   * Get consumption history for a specific inventory item
   */
  async getConsumptionHistory(
    inventoryItemId: string,
    user: RequestUser,
    startDate?: string,
    endDate?: string,
  ) {
    // Verify inventory item exists and user has access
    const inventoryItem = await this.prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId },
    });

    if (!inventoryItem) {
      throw new NotFoundException(ERROR_MESSAGES.INVENTORY.NOT_FOUND(inventoryItemId));
    }

    // Verify user has access to this inventory item's branch
    if (user.role === UserRole.ACCOUNTANT && inventoryItem.branchId !== user.branchId) {
      throw new ForbiddenException(ERROR_MESSAGES.INVENTORY.NO_ACCESS);
    }

    // Build where clause
    const where: Prisma.InventoryConsumptionWhereInput = {
      inventoryItemId,
    };

    // Apply date range filter if provided
    if (startDate || endDate) {
      where.consumedAt = {};
      if (startDate) {
        where.consumedAt.gte = formatDateForDB(startDate);
      }
      if (endDate) {
        where.consumedAt.lte = formatDateForDB(endDate);
      }
    }

    // Fetch consumption history
    const consumptions = await this.prisma.inventoryConsumption.findMany({
      where,
      include: {
        recorder: {
          select: {
            id: true,
            username: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        consumedAt: 'desc',
      },
    });

    return consumptions;
  }
}
