import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreatePurchaseExpenseDto } from './dto/create-purchase-expense.dto';
import { TransactionType, Currency, UserRole, Decimal } from '@prisma/client';

interface RequestUser {
  id: string;
  username: string;
  role: UserRole;
  branchId: string | null;
}

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTransactionDto: CreateTransactionDto, user: RequestUser) {
    // Validate user has a branch assigned
    if (!user.branchId) {
      throw new ForbiddenException('User must be assigned to a branch to create transactions');
    }

    // Validate amount is positive
    if (createTransactionDto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Validate payment method for income transactions
    if (createTransactionDto.type === TransactionType.INCOME) {
      if (createTransactionDto.paymentMethod &&
          !['CASH', 'MASTER'].includes(createTransactionDto.paymentMethod)) {
        throw new BadRequestException('Payment method must be either CASH or MASTER for income transactions');
      }
    }

    // Build transaction data
    const transactionData = {
      type: createTransactionDto.type,
      amount: createTransactionDto.amount,
      date: new Date(createTransactionDto.date),
      paymentMethod: createTransactionDto.paymentMethod || null,
      category: createTransactionDto.category || 'General',
      employeeVendorName: createTransactionDto.employeeVendorName || 'N/A',
      notes: createTransactionDto.notes || null,
      currency: Currency.USD, // Default currency
      branchId: user.branchId, // Auto-fill from logged user
      createdBy: user.id,
    };

    return this.prisma.transaction.create({
      data: transactionData,
      include: {
        branch: true,
        creator: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });
  }

  async findAll(branchId?: string) {
    const where = branchId ? { branchId } : {};

    return this.prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        branch: true,
        creator: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        branch: true,
        creator: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  /**
   * Create a purchase expense transaction with optional inventory update
   * Uses Prisma transaction to ensure atomicity
   */
  async createPurchaseWithInventory(
    createPurchaseDto: CreatePurchaseExpenseDto,
    user: RequestUser,
  ) {
    // Validate user has a branch assigned
    if (!user.branchId) {
      throw new ForbiddenException('User must be assigned to a branch to create transactions');
    }

    // Validate amount is positive
    if (createPurchaseDto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Validate inventory fields if addToInventory is true
    if (createPurchaseDto.addToInventory) {
      if (!createPurchaseDto.itemName) {
        throw new BadRequestException('Item name is required when adding to inventory');
      }
      if (!createPurchaseDto.quantity || createPurchaseDto.quantity <= 0) {
        throw new BadRequestException('Quantity must be greater than 0 when adding to inventory');
      }
      if (!createPurchaseDto.unit) {
        throw new BadRequestException('Unit is required when adding to inventory');
      }
    }

    // Use Prisma transaction to ensure both operations succeed or fail together
    return this.prisma.$transaction(async (prisma) => {
      let inventoryItemId: string | null = null;

      // If addToInventory is true, create or update inventory item
      if (createPurchaseDto.addToInventory && createPurchaseDto.itemName) {
        // Calculate cost per unit
        const costPerUnit = createPurchaseDto.amount / createPurchaseDto.quantity!;

        // Try to find existing inventory item with same name and unit
        const existingItem = await prisma.inventoryItem.findFirst({
          where: {
            branchId: user.branchId!,
            name: createPurchaseDto.itemName,
            unit: createPurchaseDto.unit!,
          },
        });

        if (existingItem) {
          // Update existing item: add quantity and recalculate weighted average cost
          const currentValue = new Decimal(existingItem.costPerUnit).mul(existingItem.quantity);
          const newValue = new Decimal(costPerUnit).mul(createPurchaseDto.quantity!);
          const totalQuantity = new Decimal(existingItem.quantity).add(createPurchaseDto.quantity!);
          const newCostPerUnit = currentValue.add(newValue).div(totalQuantity);

          const updatedItem = await prisma.inventoryItem.update({
            where: { id: existingItem.id },
            data: {
              quantity: totalQuantity,
              costPerUnit: newCostPerUnit,
              lastUpdated: new Date(),
            },
          });

          inventoryItemId = updatedItem.id;
        } else {
          // Create new inventory item
          const newItem = await prisma.inventoryItem.create({
            data: {
              branchId: user.branchId!,
              name: createPurchaseDto.itemName,
              quantity: createPurchaseDto.quantity!,
              unit: createPurchaseDto.unit!,
              costPerUnit: costPerUnit,
              lastUpdated: new Date(),
            },
          });

          inventoryItemId = newItem.id;
        }
      }

      // Create the expense transaction
      const transaction = await prisma.transaction.create({
        data: {
          type: TransactionType.EXPENSE,
          amount: createPurchaseDto.amount,
          date: new Date(createPurchaseDto.date),
          employeeVendorName: createPurchaseDto.vendorName,
          category: 'Purchase', // Category for purchase expenses
          notes: createPurchaseDto.notes || null,
          currency: Currency.USD,
          branchId: user.branchId!,
          createdBy: user.id,
          inventoryItemId: inventoryItemId,
        },
        include: {
          branch: true,
          creator: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
          inventoryItem: true,
        },
      });

      return transaction;
    });
  }
}
