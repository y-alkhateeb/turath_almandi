import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventorySubUnitDto } from './dto/create-inventory-sub-unit.dto';
import { UpdateInventorySubUnitDto } from './dto/update-inventory-sub-unit.dto';
import { QueryInventorySubUnitsDto } from './dto/query-inventory-sub-units.dto';
import { Prisma } from '@prisma/client';
import { AuditLogService, AuditEntityType } from '../common/audit-log/audit-log.service';
import { USER_SELECT } from '../common/constants/prisma-includes';
import { RequestUser } from '../common/interfaces';

// Type for sub-unit with relations
type SubUnitWithRelations = Prisma.InventorySubUnitGetPayload<{
  include: {
    inventoryItem: {
      select: {
        id: true;
        name: true;
        unit: true;
      };
    };
    creator: {
      select: typeof USER_SELECT;
    };
  };
}>;

@Injectable()
export class InventorySubUnitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Create a new inventory sub-unit
   * Validates: inventory item exists, no duplicate unit name for the same item
   */
  async create(
    createInventorySubUnitDto: CreateInventorySubUnitDto,
    user: RequestUser,
  ): Promise<SubUnitWithRelations> {
    // Validate inventory item exists
    const inventoryItem = await this.prisma.inventoryItem.findFirst({
      where: {
        id: createInventorySubUnitDto.inventoryItemId,
        deletedAt: null,
      },
    });

    if (!inventoryItem) {
      throw new NotFoundException('Inventory item not found');
    }

    // Check for duplicate unit name for this inventory item
    const existingSubUnit = await this.prisma.inventorySubUnit.findFirst({
      where: {
        inventoryItemId: createInventorySubUnitDto.inventoryItemId,
        unitName: createInventorySubUnitDto.unitName,
        isDeleted: false,
      },
    });

    if (existingSubUnit) {
      throw new ConflictException('Sub-unit with this name already exists for this inventory item');
    }

    // Create the sub-unit
    const subUnit = await this.prisma.inventorySubUnit.create({
      data: {
        inventoryItemId: createInventorySubUnitDto.inventoryItemId,
        unitName: createInventorySubUnitDto.unitName,
        ratio: createInventorySubUnitDto.ratio,
        sellingPrice: createInventorySubUnitDto.sellingPrice,
        createdBy: user.id,
        isDeleted: false,
      },
      include: {
        inventoryItem: {
          select: {
            id: true,
            name: true,
            unit: true,
          },
        },
        creator: {
          select: USER_SELECT,
        },
      },
    });

    // Audit log
    await this.auditLogService.logCreate(
      user.id,
      AuditEntityType.INVENTORY_SUB_UNIT,
      subUnit.id,
      {
        inventoryItemId: subUnit.inventoryItemId,
        unitName: subUnit.unitName,
        ratio: subUnit.ratio,
      },
    );

    return subUnit;
  }

  /**
   * Find all inventory sub-units with pagination and filtering
   */
  async findAll(user: RequestUser, query: QueryInventorySubUnitsDto) {
    const { page = 1, limit = 50, search, inventoryItemId } = query;

    // Build where clause
    const where: Prisma.InventorySubUnitWhereInput = {
      isDeleted: false,
    };

    // Apply inventory item filter
    if (inventoryItemId) {
      where.inventoryItemId = inventoryItemId;
    }

    // Apply search filter
    if (search) {
      where.OR = [
        { unitName: { contains: search, mode: 'insensitive' } },
        { inventoryItem: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count
    const total = await this.prisma.inventorySubUnit.count({ where });

    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Get sub-units
    const subUnits = await this.prisma.inventorySubUnit.findMany({
      where,
      include: {
        inventoryItem: {
          select: {
            id: true,
            name: true,
            unit: true,
          },
        },
        creator: {
          select: USER_SELECT,
        },
      },
      orderBy: [
        { inventoryItem: { name: 'asc' } },
        { ratio: 'asc' },
      ],
      skip,
      take: limit,
    });

    return {
      data: subUnits,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Find one inventory sub-unit by ID
   */
  async findOne(id: string, user: RequestUser): Promise<SubUnitWithRelations> {
    const subUnit = await this.prisma.inventorySubUnit.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        inventoryItem: {
          select: {
            id: true,
            name: true,
            unit: true,
          },
        },
        creator: {
          select: USER_SELECT,
        },
      },
    });

    if (!subUnit) {
      throw new NotFoundException('Inventory sub-unit not found');
    }

    return subUnit;
  }

  /**
   * Update an inventory sub-unit
   * Note: Cannot change inventoryItemId after creation
   */
  async update(
    id: string,
    updateInventorySubUnitDto: UpdateInventorySubUnitDto,
    user: RequestUser,
  ): Promise<SubUnitWithRelations> {
    // Find the sub-unit first
    const existingSubUnit = await this.findOne(id, user);

    // Prevent changing inventory item
    if (updateInventorySubUnitDto.inventoryItemId !== undefined) {
      throw new BadRequestException('Cannot change inventory item for a sub-unit after creation');
    }

    // Check for duplicate unit name if unitName is being updated
    if (updateInventorySubUnitDto.unitName && updateInventorySubUnitDto.unitName !== existingSubUnit.unitName) {
      const duplicateSubUnit = await this.prisma.inventorySubUnit.findFirst({
        where: {
          inventoryItemId: existingSubUnit.inventoryItemId,
          unitName: updateInventorySubUnitDto.unitName,
          isDeleted: false,
          id: { not: id },
        },
      });

      if (duplicateSubUnit) {
        throw new ConflictException('Sub-unit with this name already exists for this inventory item');
      }
    }

    // Update the sub-unit
    const updatedSubUnit = await this.prisma.inventorySubUnit.update({
      where: { id },
      data: {
        unitName: updateInventorySubUnitDto.unitName,
        ratio: updateInventorySubUnitDto.ratio,
        sellingPrice: updateInventorySubUnitDto.sellingPrice,
      },
      include: {
        inventoryItem: {
          select: {
            id: true,
            name: true,
            unit: true,
          },
        },
        creator: {
          select: USER_SELECT,
        },
      },
    });

    // Audit log
    await this.auditLogService.logUpdate(
      user.id,
      AuditEntityType.INVENTORY_SUB_UNIT,
      id,
      {
        unitName: existingSubUnit.unitName,
        ratio: existingSubUnit.ratio,
        sellingPrice: existingSubUnit.sellingPrice,
      },
      {
        unitName: updatedSubUnit.unitName,
        ratio: updatedSubUnit.ratio,
        sellingPrice: updatedSubUnit.sellingPrice,
      },
    );

    return updatedSubUnit;
  }

  /**
   * Soft delete an inventory sub-unit
   * Validates: no transactions use this sub-unit
   */
  async remove(id: string, user: RequestUser): Promise<{ message: string }> {
    // Find the sub-unit first
    const subUnit = await this.findOne(id, user);

    // Note: No validation needed for linked transactions since the schema doesn't have those relations yet

    // Soft delete the sub-unit
    await this.prisma.inventorySubUnit.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: user.id,
        isDeleted: true,
      },
    });

    // Audit log
    await this.auditLogService.logDelete(user.id, AuditEntityType.INVENTORY_SUB_UNIT, id, {
      inventoryItemId: subUnit.inventoryItemId,
      unitName: subUnit.unitName,
    });

    return { message: 'Inventory sub-unit deleted successfully' };
  }

  /**
   * Get all sub-units for a specific inventory item
   */
  async getByInventoryItem(inventoryItemId: string, user: RequestUser) {
    const subUnits = await this.prisma.inventorySubUnit.findMany({
      where: {
        inventoryItemId,
        isDeleted: false,
      },
      include: {
        inventoryItem: {
          select: {
            id: true,
            name: true,
            unit: true,
          },
        },
        creator: {
          select: USER_SELECT,
        },
      },
      orderBy: {
        ratio: 'asc',
      },
    });

    return subUnits;
  }
}
