import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CreatePurchaseExpenseDto } from './dto/create-purchase-expense.dto';
import { TransactionType, Currency, UserRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { AuditLogService, AuditEntityType } from '../common/audit-log/audit-log.service';

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

interface TransactionFilters {
  type?: TransactionType;
  branchId?: string;
  category?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

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
      if (
        createTransactionDto.paymentMethod &&
        !['CASH', 'MASTER'].includes(createTransactionDto.paymentMethod)
      ) {
        throw new BadRequestException(
          'Payment method must be either CASH or MASTER for income transactions',
        );
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

    const transaction = await this.prisma.transaction.create({
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

    // Log the creation in audit log
    await this.auditLogService.logCreate(
      user.id,
      AuditEntityType.TRANSACTION,
      transaction.id,
      transaction,
    );

    return transaction;
  }

  /**
   * Find all transactions with pagination and filters
   */
  async findAll(
    user: RequestUser,
    pagination: PaginationParams = {},
    filters: TransactionFilters = {},
  ) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    // Build where clause based on filters and user role
    const where: any = {};

    // Role-based access control
    if (user.role === UserRole.ACCOUNTANT) {
      // Accountants can only see transactions from their branch
      if (!user.branchId) {
        throw new ForbiddenException('Accountant must be assigned to a branch');
      }
      where.branchId = user.branchId;
    } else if (user.role === UserRole.ADMIN && filters.branchId) {
      // Admins can filter by specific branch
      where.branchId = filters.branchId;
    }

    // Apply filters
    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }

    // Date range filter
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate);
      }
    }

    // Search filter (searches in employeeVendorName, category, and notes)
    if (filters.search) {
      where.OR = [
        { employeeVendorName: { contains: filters.search, mode: 'insensitive' } },
        { category: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const total = await this.prisma.transaction.count({ where });

    // Get transactions
    const transactions = await this.prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
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
        creator: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        inventoryItem: {
          select: {
            id: true,
            name: true,
            quantity: true,
            unit: true,
          },
        },
      },
    });

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user?: RequestUser) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        inventoryItem: {
          select: {
            id: true,
            name: true,
            quantity: true,
            unit: true,
            costPerUnit: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    // Role-based access control
    if (user && user.role === UserRole.ACCOUNTANT) {
      if (!user.branchId) {
        throw new ForbiddenException('Accountant must be assigned to a branch');
      }
      if (transaction.branchId !== user.branchId) {
        throw new ForbiddenException('You do not have access to this transaction');
      }
    }

    return transaction;
  }

  /**
   * Update a transaction
   */
  async update(id: string, updateTransactionDto: UpdateTransactionDto, user: RequestUser) {
    // First, find the existing transaction
    const existingTransaction = await this.findOne(id, user);

    // Validate amount if provided
    if (updateTransactionDto.amount !== undefined && updateTransactionDto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Validate payment method for income transactions
    if (
      (updateTransactionDto.type === TransactionType.INCOME ||
        existingTransaction.type === TransactionType.INCOME) &&
      updateTransactionDto.paymentMethod &&
      !['CASH', 'MASTER'].includes(updateTransactionDto.paymentMethod)
    ) {
      throw new BadRequestException(
        'Payment method must be either CASH or MASTER for income transactions',
      );
    }

    // Build update data
    const updateData: any = {};
    if (updateTransactionDto.type !== undefined) updateData.type = updateTransactionDto.type;
    if (updateTransactionDto.amount !== undefined) updateData.amount = updateTransactionDto.amount;
    if (updateTransactionDto.paymentMethod !== undefined)
      updateData.paymentMethod = updateTransactionDto.paymentMethod;
    if (updateTransactionDto.category !== undefined)
      updateData.category = updateTransactionDto.category;
    if (updateTransactionDto.date !== undefined)
      updateData.date = new Date(updateTransactionDto.date);
    if (updateTransactionDto.employeeVendorName !== undefined)
      updateData.employeeVendorName = updateTransactionDto.employeeVendorName;
    if (updateTransactionDto.notes !== undefined) updateData.notes = updateTransactionDto.notes;

    // Update the transaction
    const updatedTransaction = await this.prisma.transaction.update({
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
        creator: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        inventoryItem: {
          select: {
            id: true,
            name: true,
            quantity: true,
            unit: true,
          },
        },
      },
    });

    // Log the update in audit log
    await this.auditLogService.logUpdate(
      user.id,
      AuditEntityType.TRANSACTION,
      id,
      existingTransaction,
      updatedTransaction,
    );

    return updatedTransaction;
  }

  /**
   * Delete a transaction (soft delete by setting a flag or hard delete)
   * Using hard delete for now
   */
  async remove(id: string, user: RequestUser) {
    // First, find the existing transaction to ensure it exists and user has access
    const transaction = await this.findOne(id, user);

    // Delete the transaction
    await this.prisma.transaction.delete({
      where: { id },
    });

    // Log the deletion in audit log
    await this.auditLogService.logDelete(user.id, AuditEntityType.TRANSACTION, id, transaction);

    return { message: 'Transaction deleted successfully', id };
  }

  /**
   * Get financial summary for a specific date and branch
   * @param date - Date to get summary for (ISO string, defaults to today)
   * @param branchId - Branch ID to filter by (optional for admin, ignored for accountant)
   * @param user - Current user (used to enforce branch access for accountants)
   * @returns Financial summary with income breakdown, expenses, and net profit
   */
  async getSummary(date?: string, branchId?: string, user?: RequestUser) {
    // Determine the target date (default to today)
    const targetDate = date ? new Date(date) : new Date();

    // Set to start and end of day for the query
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Determine which branch to filter by
    let filterBranchId: string | undefined = undefined;

    if (user) {
      if (user.role === UserRole.ACCOUNTANT) {
        // Accountants can only see their assigned branch
        if (!user.branchId) {
          throw new ForbiddenException('Accountant must be assigned to a branch');
        }
        filterBranchId = user.branchId;
      } else if (user.role === UserRole.ADMIN) {
        // Admins can filter by any branch, or see all branches if not specified
        filterBranchId = branchId;
      }
    } else {
      // If no user provided (shouldn't happen with auth guard), use branchId param
      filterBranchId = branchId;
    }

    // Build where clause for date and branch filtering
    const where: any = {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    if (filterBranchId) {
      where.branchId = filterBranchId;
    }

    // Get all income transactions (CASH and MASTER)
    const incomeTransactions = await this.prisma.transaction.findMany({
      where: {
        ...where,
        type: TransactionType.INCOME,
      },
    });

    // Calculate income by payment method
    const income_cash = incomeTransactions
      .filter((t) => t.paymentMethod === 'CASH')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const income_master = incomeTransactions
      .filter((t) => t.paymentMethod === 'MASTER')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const total_income = income_cash + income_master;

    // Get all expense transactions
    const expenseTransactions = await this.prisma.transaction.findMany({
      where: {
        ...where,
        type: TransactionType.EXPENSE,
      },
    });

    const total_expense = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculate net profit
    const net = total_income - total_expense;

    return {
      date: targetDate.toISOString().split('T')[0],
      branchId: filterBranchId || null,
      income_cash,
      income_master,
      total_income,
      total_expense,
      net,
    };
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

      // Log the creation in audit log (within the transaction context)
      await this.auditLogService.logCreate(
        user.id,
        AuditEntityType.TRANSACTION,
        transaction.id,
        transaction,
      );

      return transaction;
    });
  }
}
