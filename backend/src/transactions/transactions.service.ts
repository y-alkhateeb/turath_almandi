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
import { TransactionType, Currency, UserRole, Prisma, PaymentMethod } from '@prisma/client';
import { AuditLogService, AuditEntityType } from '../common/audit-log/audit-log.service';
import { InventoryService } from '../inventory/inventory.service';
import { NotificationsService } from '../notifications/notifications.service';
import { applyBranchFilter } from '../common/utils/query-builder';
import {
  BRANCH_SELECT,
  USER_SELECT,
  INVENTORY_ITEM_SELECT,
  INVENTORY_ITEM_EXTENDED_SELECT,
} from '../common/constants/prisma-includes';
import {
  formatDateForDB,
  getCurrentTimestamp,
  getStartOfDay,
  getEndOfDay,
  formatToISODate,
} from '../common/utils/date.utils';
import { ERROR_MESSAGES } from '../common/constants/error-messages';

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

// Type for transaction with branch (true) and creator select
type TransactionWithBranchAndCreator = Prisma.TransactionGetPayload<{
  include: {
    branch: true;
    creator: {
      select: typeof USER_SELECT;
    };
  };
}>;

// Type for transaction with branch, creator, and inventory item selects
type TransactionWithAllRelations = Prisma.TransactionGetPayload<{
  include: {
    branch: {
      select: typeof BRANCH_SELECT;
    };
    creator: {
      select: typeof USER_SELECT;
    };
    inventoryItem: {
      select: typeof INVENTORY_ITEM_SELECT;
    };
  };
}>;

// Type for transaction with extended inventory item
type TransactionWithExtendedInventory = Prisma.TransactionGetPayload<{
  include: {
    branch: {
      select: typeof BRANCH_SELECT;
    };
    creator: {
      select: typeof USER_SELECT;
    };
    inventoryItem: {
      select: typeof INVENTORY_ITEM_EXTENDED_SELECT;
    };
  };
}>;

// Type for transaction with full inventory item
type TransactionWithFullInventory = Prisma.TransactionGetPayload<{
  include: {
    branch: true;
    creator: {
      select: typeof USER_SELECT;
    };
    inventoryItem: true;
  };
}>;

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly inventoryService: InventoryService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createTransactionDto: CreateTransactionDto, user: RequestUser): Promise<TransactionWithBranchAndCreator> {
    // Validate user has a branch assigned
    if (!user.branchId) {
      throw new ForbiddenException(ERROR_MESSAGES.TRANSACTION.BRANCH_REQUIRED);
    }

    // Validate amount is positive
    if (createTransactionDto.amount <= 0) {
      throw new BadRequestException(ERROR_MESSAGES.VALIDATION.AMOUNT_POSITIVE);
    }

    // Validate payment method for income transactions
    if (createTransactionDto.type === TransactionType.INCOME) {
      if (
        createTransactionDto.paymentMethod &&
        createTransactionDto.paymentMethod !== PaymentMethod.CASH &&
        createTransactionDto.paymentMethod !== PaymentMethod.MASTER
      ) {
        throw new BadRequestException(ERROR_MESSAGES.TRANSACTION.PAYMENT_METHOD_INVALID);
      }
    }

    // Build transaction data
    const transactionData = {
      type: createTransactionDto.type,
      amount: createTransactionDto.amount,
      date: formatDateForDB(createTransactionDto.date),
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
          select: USER_SELECT,
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

    // Notify about the transaction (async, don't wait)
    this.notificationsService
      .notifyNewTransaction(
        transaction.id,
        transaction.type,
        Number(transaction.amount),
        transaction.category,
        transaction.branchId,
        user.id,
      )
      .catch((error) => {
        // Log error but don't fail the transaction
        console.error('Failed to create transaction notification:', error);
      });

    return transaction;
  }

  /**
   * Find all transactions with pagination and filters
   */
  async findAll(
    user: RequestUser,
    pagination: PaginationParams = {},
    filters: TransactionFilters = {},
  ): Promise<{ data: TransactionWithAllRelations[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    // Build where clause based on filters and user role
    let where: Prisma.TransactionWhereInput = {};

    // Apply role-based branch filtering
    where = applyBranchFilter(user, where, filters.branchId);

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
        where.date.gte = formatDateForDB(filters.startDate);
      }
      if (filters.endDate) {
        where.date.lte = formatDateForDB(filters.endDate);
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
          select: BRANCH_SELECT,
        },
        creator: {
          select: USER_SELECT,
        },
        inventoryItem: {
          select: INVENTORY_ITEM_SELECT,
        },
      },
    });

    return {
      data: transactions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user?: RequestUser): Promise<TransactionWithExtendedInventory> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        branch: {
          select: BRANCH_SELECT,
        },
        creator: {
          select: USER_SELECT,
        },
        inventoryItem: {
          select: INVENTORY_ITEM_EXTENDED_SELECT,
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(ERROR_MESSAGES.TRANSACTION.NOT_FOUND(id));
    }

    // Role-based access control
    if (user && user.role === UserRole.ACCOUNTANT) {
      if (!user.branchId) {
        throw new ForbiddenException(ERROR_MESSAGES.BRANCH.ACCOUNTANT_NOT_ASSIGNED);
      }
      if (transaction.branchId !== user.branchId) {
        throw new ForbiddenException(ERROR_MESSAGES.TRANSACTION.NO_ACCESS);
      }
    }

    return transaction;
  }

  /**
   * Update a transaction
   */
  async update(id: string, updateTransactionDto: UpdateTransactionDto, user: RequestUser): Promise<TransactionWithAllRelations> {
    // First, find the existing transaction
    const existingTransaction = await this.findOne(id, user);

    // Validate amount if provided
    if (updateTransactionDto.amount !== undefined && updateTransactionDto.amount <= 0) {
      throw new BadRequestException(ERROR_MESSAGES.VALIDATION.AMOUNT_POSITIVE);
    }

    // Validate payment method for income transactions
    if (
      (updateTransactionDto.type === TransactionType.INCOME ||
        existingTransaction.type === TransactionType.INCOME) &&
      updateTransactionDto.paymentMethod &&
      updateTransactionDto.paymentMethod !== PaymentMethod.CASH &&
      updateTransactionDto.paymentMethod !== PaymentMethod.MASTER
    ) {
      throw new BadRequestException(ERROR_MESSAGES.TRANSACTION.PAYMENT_METHOD_INVALID);
    }

    // Build update data
    const updateData: Prisma.TransactionUpdateInput = {};
    if (updateTransactionDto.type !== undefined) updateData.type = updateTransactionDto.type;
    if (updateTransactionDto.amount !== undefined) updateData.amount = updateTransactionDto.amount;
    if (updateTransactionDto.paymentMethod !== undefined)
      updateData.paymentMethod = updateTransactionDto.paymentMethod;
    if (updateTransactionDto.category !== undefined)
      updateData.category = updateTransactionDto.category;
    if (updateTransactionDto.date !== undefined)
      updateData.date = formatDateForDB(updateTransactionDto.date);
    if (updateTransactionDto.employeeVendorName !== undefined)
      updateData.employeeVendorName = updateTransactionDto.employeeVendorName;
    if (updateTransactionDto.notes !== undefined) updateData.notes = updateTransactionDto.notes;

    // Update the transaction
    const updatedTransaction = await this.prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        branch: {
          select: BRANCH_SELECT,
        },
        creator: {
          select: USER_SELECT,
        },
        inventoryItem: {
          select: INVENTORY_ITEM_SELECT,
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
  async remove(id: string, user: RequestUser): Promise<{ message: string; id: string }> {
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
  async getSummary(date?: string, branchId?: string, user?: RequestUser): Promise<{
    date: string;
    branchId: string | null;
    income_cash: number;
    income_master: number;
    total_income: number;
    total_expense: number;
    net: number;
  }> {
    // Determine the target date (default to today)
    const targetDate = date ? formatDateForDB(date) : getCurrentTimestamp();

    // Set to start and end of day for the query
    const startOfDay = getStartOfDay(targetDate);
    const endOfDay = getEndOfDay(targetDate);

    // Determine which branch to filter by
    let filterBranchId: string | undefined = undefined;

    if (user) {
      if (user.role === UserRole.ACCOUNTANT) {
        // Accountants can only see their assigned branch
        if (!user.branchId) {
          throw new ForbiddenException(ERROR_MESSAGES.BRANCH.ACCOUNTANT_NOT_ASSIGNED);
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

    // Build base where clause for date and branch filtering
    const baseWhere: Prisma.TransactionWhereInput = {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    if (filterBranchId) {
      baseWhere.branchId = filterBranchId;
    }

    // Execute all aggregate queries in parallel for best performance
    const [incomeCashAggregate, incomeMasterAggregate, expenseAggregate] = await Promise.all([
      // Aggregate CASH income
      this.prisma.transaction.aggregate({
        where: {
          ...baseWhere,
          type: TransactionType.INCOME,
          paymentMethod: PaymentMethod.CASH,
        },
        _sum: {
          amount: true,
        },
      }),
      // Aggregate MASTER income
      this.prisma.transaction.aggregate({
        where: {
          ...baseWhere,
          type: TransactionType.INCOME,
          paymentMethod: PaymentMethod.MASTER,
        },
        _sum: {
          amount: true,
        },
      }),
      // Aggregate expenses
      this.prisma.transaction.aggregate({
        where: {
          ...baseWhere,
          type: TransactionType.EXPENSE,
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    // Extract aggregated values (handle null for zero transactions)
    const income_cash = Number(incomeCashAggregate._sum.amount || 0);
    const income_master = Number(incomeMasterAggregate._sum.amount || 0);
    const total_expense = Number(expenseAggregate._sum.amount || 0);

    const total_income = income_cash + income_master;
    const net = total_income - total_expense;

    return {
      date: formatToISODate(targetDate),
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
  ): Promise<TransactionWithFullInventory> {
    // Validate user has a branch assigned
    if (!user.branchId) {
      throw new ForbiddenException(ERROR_MESSAGES.TRANSACTION.BRANCH_REQUIRED);
    }

    // Validate amount is positive
    if (createPurchaseDto.amount <= 0) {
      throw new BadRequestException(ERROR_MESSAGES.VALIDATION.AMOUNT_POSITIVE);
    }

    // Validate inventory fields if addToInventory is true
    if (createPurchaseDto.addToInventory) {
      if (!createPurchaseDto.itemName) {
        throw new BadRequestException(ERROR_MESSAGES.INVENTORY.ITEM_NAME_REQUIRED);
      }
      if (!createPurchaseDto.quantity || createPurchaseDto.quantity <= 0) {
        throw new BadRequestException(ERROR_MESSAGES.VALIDATION.QUANTITY_POSITIVE);
      }
      if (!createPurchaseDto.unit) {
        throw new BadRequestException(ERROR_MESSAGES.INVENTORY.UNIT_REQUIRED);
      }
    }

    // Use Prisma transaction to ensure both operations succeed or fail together
    return this.prisma.$transaction(async (prisma) => {
      let inventoryItemId: string | null = null;

      // If addToInventory is true, update inventory using InventoryService
      if (createPurchaseDto.addToInventory && createPurchaseDto.itemName) {
        inventoryItemId = await this.inventoryService.updateFromPurchase(
          user.branchId!,
          createPurchaseDto.itemName,
          createPurchaseDto.quantity!,
          createPurchaseDto.unit!,
          createPurchaseDto.amount,
          prisma,
        );
      }

      // Create the expense transaction
      const transaction = await prisma.transaction.create({
        data: {
          type: TransactionType.EXPENSE,
          amount: createPurchaseDto.amount,
          date: formatDateForDB(createPurchaseDto.date),
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
            select: USER_SELECT,
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

      // Notify about the transaction (async, don't wait)
      this.notificationsService
        .notifyNewTransaction(
          transaction.id,
          transaction.type,
          Number(transaction.amount),
          transaction.category,
          transaction.branchId,
          user.id,
        )
        .catch((error) => {
          // Log error but don't fail the transaction
          console.error('Failed to create transaction notification:', error);
        });

      return transaction;
    });
  }
}
