import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { UserRole } from '@prisma/client';

interface RequestUser {
  id: string;
  username: string;
  role: UserRole;
  branchId: string | null;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

interface InventoryFilters {
  branchId?: string;
  search?: string;
  unit?: string;
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new inventory item (manual add)
   */
  async create(createInventoryDto: CreateInventoryDto, user: RequestUser) {
    // Determine branch ID
    // - For accountants: Always use their assigned branch
    // - For admins: Use provided branchId or require it
    let branchId: string;

    if (user.role === 'ACCOUNTANT') {
      // Accountants must have a branch assigned and can only create for their branch
      if (!user.branchId) {
        throw new ForbiddenException('يجب تعيين فرع للمستخدم لإنشاء عناصر المخزون');
      }
      branchId = user.branchId;
    } else {
      // Admins must provide a branch ID
      if (!createInventoryDto.branchId) {
        throw new BadRequestException('يجب تحديد الفرع');
      }
      branchId = createInventoryDto.branchId;
    }

    // Validate quantity is non-negative
    if (createInventoryDto.quantity < 0) {
      throw new BadRequestException('Quantity must be greater than or equal to 0');
    }

    // Validate cost per unit is non-negative
    if (createInventoryDto.costPerUnit < 0) {
      throw new BadRequestException('Cost per unit must be greater than or equal to 0');
    }

    // Check if item with same name and unit already exists in this branch
    const existingItem = await this.prisma.inventoryItem.findFirst({
      where: {
        branchId: branchId,
        name: createInventoryDto.name,
        unit: createInventoryDto.unit,
      },
    });

    if (existingItem) {
      throw new BadRequestException(
        'An inventory item with the same name and unit already exists in this branch',
      );
    }

    // Create the inventory item
    const inventoryItem = await this.prisma.inventoryItem.create({
      data: {
        branchId: branchId,
        name: createInventoryDto.name,
        quantity: createInventoryDto.quantity,
        unit: createInventoryDto.unit,
        costPerUnit: createInventoryDto.costPerUnit,
        lastUpdated: new Date(),
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        transactions: {
          select: {
            id: true,
            amount: true,
            date: true,
            employeeVendorName: true,
          },
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
   * Find all inventory items with pagination and filters
   */
  async findAll(
    user: RequestUser,
    pagination: PaginationParams = {},
    filters: InventoryFilters = {},
  ) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    // Build where clause based on filters and user role
    const where: any = {};

    // Role-based access control
    if (user.role === UserRole.ACCOUNTANT) {
      // Accountants can only see inventory from their branch
      if (!user.branchId) {
        throw new ForbiddenException('Accountant must be assigned to a branch');
      }
      where.branchId = user.branchId;
    } else if (user.role === UserRole.ADMIN && filters.branchId) {
      // Admins can filter by specific branch
      where.branchId = filters.branchId;
    }

    // Apply filters
    if (filters.unit) {
      where.unit = filters.unit;
    }

    // Search filter (searches in name)
    if (filters.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }

    // Get total count for pagination
    const total = await this.prisma.inventoryItem.count({ where });

    // Get inventory items
    const items = await this.prisma.inventoryItem.findMany({
      where,
      orderBy: { lastUpdated: 'desc' },
      skip,
      take: limit,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        transactions: {
          select: {
            id: true,
            amount: true,
            date: true,
            employeeVendorName: true,
            category: true,
          },
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

    return {
      data: itemsWithMetadata,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find one inventory item by ID
   */
  async findOne(id: string, user?: RequestUser) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        transactions: {
          select: {
            id: true,
            amount: true,
            date: true,
            employeeVendorName: true,
            category: true,
            notes: true,
          },
          orderBy: {
            date: 'desc',
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }

    // Role-based access control
    if (user && user.role === UserRole.ACCOUNTANT) {
      if (!user.branchId) {
        throw new ForbiddenException('Accountant must be assigned to a branch');
      }
      if (item.branchId !== user.branchId) {
        throw new ForbiddenException('You do not have access to this inventory item');
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
  async update(id: string, updateInventoryDto: UpdateInventoryDto, user: RequestUser) {
    // First, find the existing item
    const existingItem = await this.findOne(id, user);

    // Validate quantity if provided
    if (updateInventoryDto.quantity !== undefined && updateInventoryDto.quantity < 0) {
      throw new BadRequestException('Quantity must be greater than or equal to 0');
    }

    // Validate cost per unit if provided
    if (updateInventoryDto.costPerUnit !== undefined && updateInventoryDto.costPerUnit < 0) {
      throw new BadRequestException('Cost per unit must be greater than or equal to 0');
    }

    // Build update data
    const updateData: any = {
      lastUpdated: new Date(),
    };

    if (updateInventoryDto.name !== undefined) updateData.name = updateInventoryDto.name;
    if (updateInventoryDto.quantity !== undefined)
      updateData.quantity = updateInventoryDto.quantity;
    if (updateInventoryDto.unit !== undefined) updateData.unit = updateInventoryDto.unit;
    if (updateInventoryDto.costPerUnit !== undefined)
      updateData.costPerUnit = updateInventoryDto.costPerUnit;

    // Update the item
    const updatedItem = await this.prisma.inventoryItem.update({
      where: { id },
      data: updateData,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        transactions: {
          select: {
            id: true,
            amount: true,
            date: true,
            employeeVendorName: true,
            category: true,
          },
          orderBy: {
            date: 'desc',
          },
          take: 5,
        },
      },
    });

    // Add metadata
    return {
      ...updatedItem,
      isAutoAdded: updatedItem.transactions.some((t) => t.category === 'Purchase'),
      relatedPurchases: updatedItem.transactions.filter((t) => t.category === 'Purchase'),
    };
  }

  /**
   * Delete an inventory item
   */
  async remove(id: string, user: RequestUser) {
    // First, find the existing item to ensure it exists and user has access
    const item = await this.findOne(id, user);

    // Check if there are any transactions linked to this item
    const linkedTransactions = await this.prisma.transaction.count({
      where: { inventoryItemId: id },
    });

    if (linkedTransactions > 0) {
      throw new BadRequestException(
        'Cannot delete inventory item with linked transactions. Unlink transactions first or set quantity to 0.',
      );
    }

    // Delete the item
    await this.prisma.inventoryItem.delete({
      where: { id },
    });

    return { message: 'Inventory item deleted successfully', id };
  }
}
