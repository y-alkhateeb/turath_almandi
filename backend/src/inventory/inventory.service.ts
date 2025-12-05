import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { Prisma } from '@prisma/client';
import { UserRole, InventoryUnit } from '../common/types/prisma-enums';
import { Decimal } from '@prisma/client/runtime/library';
import { AuditLogService, AuditEntityType } from '../common/audit-log/audit-log.service';
import { applyBranchFilter } from '../common/utils/query-builder';
import {
  BRANCH_SELECT,
  TRANSACTION_SELECT_FOR_INVENTORY,
  TRANSACTION_SELECT_MINIMAL,
} from '../common/constants/prisma-includes';
import { getCurrentTimestamp } from '../common/utils/date.utils';
import { ERROR_MESSAGES } from '../common/constants/error-messages';
import { RequestUser } from '../common/interfaces';

interface InventoryFilters {
  branchId?: string;
  search?: string;
  unit?: string;
}

// Type for inventory item with branch and minimal transactions
type InventoryItemWithMinimalTransactions = Prisma.InventoryItemGetPayload<{
  include: {
    branch: {
      select: typeof BRANCH_SELECT;
    };
    transactions: {
      select: typeof TRANSACTION_SELECT_MINIMAL;
    };
  };
}>;

// Type for inventory item with branch and full transactions
type InventoryItemWithTransactions = Prisma.InventoryItemGetPayload<{
  include: {
    branch: {
      select: typeof BRANCH_SELECT;
    };
    transactions: {
      select: typeof TRANSACTION_SELECT_FOR_INVENTORY;
    };
  };
}>;

// Type for transaction in inventory context
type TransactionForInventory = Prisma.TransactionGetPayload<{
  select: typeof TRANSACTION_SELECT_FOR_INVENTORY;
}>;

// Type for inventory item with metadata
export interface InventoryItemWithMetadata extends InventoryItemWithTransactions {
  isAutoAdded: boolean;
  relatedPurchases: TransactionForInventory[];
}

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Create a new inventory item (manual add)
   */
  async create(createInventoryDto: CreateInventoryDto, user: RequestUser): Promise<InventoryItemWithMinimalTransactions> {
    // Determine branch ID
    // - For accountants: Always use their assigned branch
    // - For admins: Use provided branchId or require it
    let branchId: string;

    if (user.role === UserRole.ACCOUNTANT) {
      // Accountants must have a branch assigned and can only create for their branch
      if (!user.branchId) {
        throw new BadRequestException('Accountant must be assigned to branch');
      }
      branchId = user.branchId;
    } else {
      // Admins must provide a branch ID
      if (!createInventoryDto.branchId) {
        throw new BadRequestException(ERROR_MESSAGES.BRANCH.REQUIRED);
      }
      branchId = createInventoryDto.branchId;
    }

    // Validate quantity is non-negative
    if (createInventoryDto.quantity < 0) {
      throw new BadRequestException(ERROR_MESSAGES.VALIDATION.QUANTITY_NON_NEGATIVE);
    }

    // Validate cost per unit is non-negative
    if (createInventoryDto.costPerUnit < 0) {
      throw new BadRequestException(ERROR_MESSAGES.VALIDATION.COST_NON_NEGATIVE);
    }

    // Check if item with same name and unit already exists in this branch (only active items)
    const existingItem = await this.prisma.inventoryItem.findFirst({
      where: {
        branchId: branchId,
        name: createInventoryDto.name,
        unit: createInventoryDto.unit,
        deletedAt: null, // Only check active (non-deleted) items
      },
    });

    if (existingItem) {
      throw new BadRequestException(ERROR_MESSAGES.INVENTORY.DUPLICATE_ITEM);
    }

    // Create the inventory item
    const inventoryItem = await this.prisma.inventoryItem.create({
      data: {
        branchId: branchId,
        name: createInventoryDto.name,
        quantity: createInventoryDto.quantity,
        unit: createInventoryDto.unit,
        costPerUnit: createInventoryDto.costPerUnit,
        sellingPrice: createInventoryDto.sellingPrice ?? null,
        lastUpdated: getCurrentTimestamp(),
      },
      include: {
        branch: {
          select: BRANCH_SELECT,
        },
        transactions: {
          select: TRANSACTION_SELECT_MINIMAL,
          orderBy: {
            date: 'desc',
          },
          take: 5,
        },
      },
    });

    return inventoryItem;
  }

  /**
   * Find all inventory items with filters
   * Returns all items matching the filters (no pagination)
   *
   * @param user - Current user (for role-based access)
   * @param filters - Filter parameters (branchId, unit, search)
   * @returns Array of inventory items with metadata
   */
  async findAll(
    user: RequestUser,
    filters: InventoryFilters = {},
  ): Promise<InventoryItemWithMetadata[]> {
    // Build where clause based on filters and user role
    let where: Prisma.InventoryItemWhereInput = {
      deletedAt: null, // Exclude soft-deleted inventory items
    };

    // Apply role-based branch filtering
    where = applyBranchFilter(user, where, filters.branchId);

    // Apply filters
    if (filters.unit) {
      where.unit = filters.unit as InventoryUnit;
    }

    // Search filter (searches in name)
    if (filters.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }

    // Get inventory items without pagination
    const items = await this.prisma.inventoryItem.findMany({
      where,
      orderBy: { lastUpdated: 'desc' },
      include: {
        branch: {
          select: BRANCH_SELECT,
        },
        transactions: {
          where: { isDeleted: false }, // Only include non-deleted transactions
          select: TRANSACTION_SELECT_FOR_INVENTORY,
          orderBy: {
            date: 'desc',
          },
          take: 5,
        },
      },
    });

    // Add a flag to indicate if item was auto-added from purchase
    const itemsWithMetadata = items.map((item) => ({
      ...item,
      isAutoAdded: item.transactions.some((t) => t.category === 'Purchase'),
      relatedPurchases: item.transactions.filter((t) => t.category === 'Purchase'),
    }));

    return itemsWithMetadata;
  }

  /**
   * Find one inventory item by ID
   */
  async findOne(id: string, user?: RequestUser): Promise<InventoryItemWithMetadata> {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        branch: {
          select: BRANCH_SELECT,
        },
        transactions: {
          select: {
            ...TRANSACTION_SELECT_FOR_INVENTORY,
            notes: true,
          },
          orderBy: {
            date: 'desc',
          },
        },
      },
    });

    if (!item || item.deletedAt) {
      throw new NotFoundException(ERROR_MESSAGES.INVENTORY.NOT_FOUND(id));
    }

    // Role-based access control
    if (user && user.role === UserRole.ACCOUNTANT) {
      if (!user.branchId) {
        throw new BadRequestException('Accountant must be assigned to branch');
      }
      if (item.branchId !== user.branchId) {
        throw new ForbiddenException(ERROR_MESSAGES.INVENTORY.NO_ACCESS);
      }
    }

    // Add metadata
    return {
      ...item,
      isAutoAdded: item.transactions.some((t) => t.category === 'Purchase'),
      relatedPurchases: item.transactions.filter((t) => t.category === 'Purchase'),
    };
  }

  /**
   * Update an inventory item
   */
  async update(id: string, updateInventoryDto: UpdateInventoryDto, user: RequestUser): Promise<InventoryItemWithMetadata> {
    // First, find the existing item
    const existingItem = await this.findOne(id, user);

    // Validate quantity if provided
    if (updateInventoryDto.quantity !== undefined && updateInventoryDto.quantity < 0) {
      throw new BadRequestException(ERROR_MESSAGES.VALIDATION.QUANTITY_NON_NEGATIVE);
    }

    // Validate cost per unit if provided
    if (updateInventoryDto.costPerUnit !== undefined && updateInventoryDto.costPerUnit < 0) {
      throw new BadRequestException(ERROR_MESSAGES.VALIDATION.COST_NON_NEGATIVE);
    }

    // Build update data
    const updateData: Prisma.InventoryItemUpdateInput = {
      lastUpdated: getCurrentTimestamp(),
    };

    if (updateInventoryDto.name !== undefined) updateData.name = updateInventoryDto.name;
    if (updateInventoryDto.quantity !== undefined)
      updateData.quantity = updateInventoryDto.quantity;
    if (updateInventoryDto.unit !== undefined) updateData.unit = updateInventoryDto.unit;
    if (updateInventoryDto.costPerUnit !== undefined)
      updateData.costPerUnit = updateInventoryDto.costPerUnit;
    if (updateInventoryDto.sellingPrice !== undefined)
      updateData.sellingPrice = updateInventoryDto.sellingPrice;

    // Update the item
    const updatedItem = await this.prisma.inventoryItem.update({
      where: { id },
      data: updateData,
      include: {
        branch: {
          select: BRANCH_SELECT,
        },
        transactions: {
          select: TRANSACTION_SELECT_FOR_INVENTORY,
          orderBy: {
            date: 'desc',
          },
          take: 5,
        },
      },
    });

    // Log the update in audit log
    await this.auditLogService.logUpdate(
      user.id,
      AuditEntityType.INVENTORY_ITEM,
      id,
      existingItem,
      updatedItem,
    );

    // Add metadata
    return {
      ...updatedItem,
      isAutoAdded: updatedItem.transactions.some((t) => t.category === 'Purchase'),
      relatedPurchases: updatedItem.transactions.filter((t) => t.category === 'Purchase'),
    };
  }

  /**
   * Delete an inventory item (soft delete by setting deletedAt timestamp)
   * Soft delete preserves data for audit trail and potential recovery
   */
  async remove(id: string, user: RequestUser): Promise<{ message: string; id: string }> {
    // First, find the existing item to ensure it exists and user has access
    const item = await this.findOne(id, user);

    // Check if there are any transactions linked to this item
    const linkedTransactions = await this.prisma.transaction.count({
      where: { inventoryItemId: id, deletedAt: null },
    });

    if (linkedTransactions > 0) {
      throw new BadRequestException(ERROR_MESSAGES.INVENTORY.LINKED_TRANSACTIONS);
    }

    // Soft delete: Set deletedAt timestamp
    await this.prisma.inventoryItem.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    // Log the deletion in audit log
    // Serialize the item to JSON-compatible format (handles Decimal and Date types)
    await this.auditLogService.logDelete(
      user.id,
      AuditEntityType.INVENTORY_ITEM,
      id,
      JSON.parse(JSON.stringify(item)) as Prisma.InputJsonValue,
    );

    return { message: 'Inventory item deleted successfully', id };
  }

  /**
   * Update inventory from a purchase transaction
   * Creates or updates an inventory item based on purchase details
   * Uses weighted average cost calculation
   *
   * @param branchId - Branch ID where purchase was made
   * @param itemName - Name of the inventory item
   * @param quantity - Quantity purchased
   * @param unit - Unit of measurement
   * @param totalAmount - Total purchase amount
   * @param prismaClient - Optional Prisma client for transaction support
   * @returns ID of created or updated inventory item
   */
  async updateFromPurchase(
    branchId: string,
    itemName: string,
    quantity: number,
    unit: InventoryUnit,
    totalAmount: number,
    prismaClient?: Prisma.TransactionClient,
  ): Promise<string> {
    const prisma = prismaClient || this.prisma;

    // Calculate cost per unit
    const costPerUnit = totalAmount / quantity;

    // Try to find existing active inventory item with same name and unit
    const existingItem = await prisma.inventoryItem.findFirst({
      where: {
        branchId,
        name: itemName,
        unit,
        deletedAt: null, // Only check active (non-deleted) items
      },
    });

    if (existingItem) {
      // Update existing item: add quantity and recalculate weighted average cost
      const currentValue = new Decimal(existingItem.costPerUnit).mul(existingItem.quantity);
      const newValue = new Decimal(costPerUnit).mul(quantity);
      const totalQuantity = new Decimal(existingItem.quantity).add(quantity);
      const newCostPerUnit = currentValue.add(newValue).div(totalQuantity);

      const updatedItem = await prisma.inventoryItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: totalQuantity,
          costPerUnit: newCostPerUnit,
          lastUpdated: getCurrentTimestamp(),
        },
      });

      return updatedItem.id;
    } else {
      // Create new inventory item
      const newItem = await prisma.inventoryItem.create({
        data: {
          branchId,
          name: itemName,
          quantity,
          unit,
          costPerUnit,
          lastUpdated: getCurrentTimestamp(),
        },
      });

      return newItem.id;
    }
  }

  /**
   * Update inventory from a transaction
   * Automatically updates inventory based on transaction details if applicable
   *
   * @param transaction - Transaction object with inventory-related fields
   * @param prismaClient - Optional Prisma client for transaction support
   * @returns ID of updated/created inventory item, or null if not applicable
   */
  async updateFromTransaction(
    transaction: {
      id: string;
      type: string;
      amount: number | Prisma.Decimal;
      branchId: string;
      category?: string;
      inventoryItemId?: string | null;
      // Purchase-specific fields (optional)
      itemName?: string;
      quantity?: number | Prisma.Decimal;
      unit?: InventoryUnit;
    },
    prismaClient?: Prisma.TransactionClient,
  ): Promise<string | null> {
    // Only process EXPENSE transactions with inventory fields
    if (transaction.type !== 'EXPENSE') {
      return null;
    }

    // Check if this is a purchase transaction with inventory details
    const isPurchase =
      transaction.category === 'Purchase' ||
      (transaction.itemName && transaction.quantity && transaction.unit);

    if (!isPurchase) {
      return null;
    }

    // Extract inventory fields
    const itemName = transaction.itemName;
    const quantity = transaction.quantity;
    const unit = transaction.unit;
    const amount = typeof transaction.amount === 'object'
      ? Number(transaction.amount)
      : transaction.amount;

    // Validate required fields
    if (!itemName || !quantity || !unit) {
      return null;
    }

    const qty = typeof quantity === 'object' ? Number(quantity) : quantity;

    // Update inventory using existing method
    return this.updateFromPurchase(
      transaction.branchId,
      itemName,
      qty,
      unit,
      amount,
      prismaClient,
    );
  }

  /**
   * Get total inventory value across all items
   * Calculates sum of (quantity * costPerUnit) for all inventory items
   * Supports branch filtering and role-based access control
   */
  async getTotalInventoryValue(
    user: RequestUser,
    branchId?: string,
  ): Promise<number> {
    // Build where clause with role-based filtering
    let where: Prisma.InventoryItemWhereInput = {
      deletedAt: null, // Exclude soft-deleted inventory items
    };

    // Apply branch filtering based on user role
    if (user.role === UserRole.ACCOUNTANT) {
      if (!user.branchId) {
        throw new ForbiddenException(ERROR_MESSAGES.BRANCH.ACCOUNTANT_NOT_ASSIGNED);
      }
      where.branchId = user.branchId;
    } else if (user.role === UserRole.ADMIN && branchId) {
      where.branchId = branchId;
    }

    // Fetch all inventory items with quantity and costPerUnit
    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where,
      select: {
        quantity: true,
        costPerUnit: true,
      },
    });

    // Calculate total value: sum of (quantity * costPerUnit)
    const totalValue = inventoryItems.reduce((sum, item) => {
      const quantity = Number(item.quantity);
      const costPerUnit = Number(item.costPerUnit);
      return sum + (quantity * costPerUnit);
    }, 0);

    // Round to 2 decimal places
    return Math.round(totalValue * 100) / 100;
  }
}
