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
import { Prisma } from '@prisma/client';
import { TransactionType, UserRole, PaymentMethod } from '../common/types/prisma-enums';
import { AuditLogService, AuditEntityType } from '../common/audit-log/audit-log.service';
import { InventoryService } from '../inventory/inventory.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WebSocketGatewayService } from '../websocket/websocket.gateway';
import { SettingsService } from '../settings/settings.service';
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
// Currency constants removed - currency is now frontend-only
import { normalizeCategory } from '../common/constants/transaction-categories';

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

interface SalaryExpensesSummary {
  total: number;
  count: number;
  transactions: Array<{
    id: string;
    amount: number;
    date: string;
    description: string;
    paymentMethod: PaymentMethod;
    branchId: string;
    branchName: string;
  }>;
}

interface PurchaseExpensesSummary {
  total: number;
  count: number;
  transactions: Array<{
    id: string;
    amount: number;
    date: string;
    description: string;
    paymentMethod: PaymentMethod;
    branchId: string;
    branchName: string;
    inventoryItem: {
      id: string;
      name: string;
      quantity: number;
      unit: string;
    } | null;
  }>;
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
    private readonly websocketGateway: WebSocketGatewayService,
    private readonly settingsService: SettingsService,
  ) {}

  async create(createTransactionDto: CreateTransactionDto, user: RequestUser): Promise<TransactionWithBranchAndCreator> {
    // Determine branchId based on user role
    let branchId: string;

    if (user.role === UserRole.ADMIN) {
      // Admin must provide branchId in request
      if (!createTransactionDto.branchId) {
        throw new BadRequestException('Admin must specify branchId for transaction');
      }
      branchId = createTransactionDto.branchId;
    } else {
      // Accountant uses their assigned branch
      if (!user.branchId) {
        throw new BadRequestException('Accountant must be assigned to branch');
      }
      branchId = user.branchId;
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

    // Get default currency from settings
    const defaultCurrency = await this.settingsService.getDefaultCurrency();

    // Build transaction data
    const transactionData = {
      type: createTransactionDto.type,
      amount: createTransactionDto.amount,
      date: formatDateForDB(createTransactionDto.date),
      paymentMethod: createTransactionDto.paymentMethod || null,
      category: normalizeCategory(createTransactionDto.category) || 'General',
      employeeVendorName: createTransactionDto.employeeVendorName || 'N/A',
      notes: createTransactionDto.notes || null,
      // Currency removed - now frontend-only display
      branchId: branchId, // Use determined branchId
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

    // Emit WebSocket event for real-time updates
    this.websocketGateway.emitNewTransaction(transaction);

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
    let where: Prisma.TransactionWhereInput = {
      deletedAt: null, // Exclude soft-deleted transactions
    };

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
      where.paymentMethod = filters.paymentMethod as PaymentMethod;
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

    if (!transaction || transaction.deletedAt) {
      throw new NotFoundException(ERROR_MESSAGES.TRANSACTION.NOT_FOUND(id));
    }

    // Role-based access control
    if (user && user.role === UserRole.ACCOUNTANT) {
      if (!user.branchId) {
        throw new BadRequestException('Accountant must be assigned to branch');
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
      updateData.category = normalizeCategory(updateTransactionDto.category);
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
   * Delete a transaction (soft delete by setting deletedAt timestamp)
   * Soft delete preserves data for audit trail and potential recovery
   */
  async remove(id: string, user: RequestUser): Promise<{ message: string; id: string }> {
    // First, find the existing transaction to ensure it exists and user has access
    const transaction = await this.findOne(id, user);

    // Soft delete: Set deletedAt timestamp
    await this.prisma.transaction.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
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
          throw new BadRequestException('Accountant must be assigned to branch');
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
      deletedAt: null, // Exclude soft-deleted transactions
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
    // Validate accountant has a branch assigned
    if (user.role === UserRole.ACCOUNTANT && !user.branchId) {
      throw new BadRequestException('Accountant must be assigned to branch');
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

    // Get default currency from settings
    const defaultCurrency = await this.settingsService.getDefaultCurrency();

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
          // Currency is now frontend-only, not stored in database
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

  /**
   * Get salary expenses with filtering support
   * Filters transactions where category='salaries'
   * Supports optional branch and date range filtering
   * Returns total amount and list of salary transactions
   */
  async getSalaryExpenses(
    user: RequestUser,
    branchId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<SalaryExpensesSummary> {
    // Build where clause with role-based filtering
    let where: Prisma.TransactionWhereInput = {
      deletedAt: null, // Exclude soft-deleted transactions
      type: TransactionType.EXPENSE,
      category: 'salaries',
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

    // Apply date range filter if provided
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = formatDateForDB(startDate);
      }
      if (endDate) {
        where.date.lte = formatDateForDB(endDate);
      }
    }

    // Execute queries in parallel for best performance
    const [totalResult, transactions] = await Promise.all([
      // Get total sum of salary expenses
      this.prisma.transaction.aggregate({
        where,
        _sum: {
          amount: true,
        },
        _count: true,
      }),

      // Get list of salary transactions
      this.prisma.transaction.findMany({
        where,
        include: {
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      }),
    ]);

    const total = Number(totalResult._sum.amount || 0);
    const count = totalResult._count;

    // Format transactions for response
    const formattedTransactions = transactions.map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      date: formatToISODate(t.date),
      description: t.employeeVendorName,
      paymentMethod: t.paymentMethod,
      branchId: t.branchId,
      branchName: t.branch.name,
    }));

    return {
      total,
      count,
      transactions: formattedTransactions,
    };
  }

  /**
   * Get purchase expenses with filtering support
   * Filters transactions where category='purchases'
   * Supports optional branch and date range filtering
   * Returns total amount and list of purchase transactions with inventory item details
   */
  async getPurchaseExpenses(
    user: RequestUser,
    branchId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<PurchaseExpensesSummary> {
    // Build where clause with role-based filtering
    let where: Prisma.TransactionWhereInput = {
      deletedAt: null, // Exclude soft-deleted transactions
      type: TransactionType.EXPENSE,
      category: 'purchases',
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

    // Apply date range filter if provided
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = formatDateForDB(startDate);
      }
      if (endDate) {
        where.date.lte = formatDateForDB(endDate);
      }
    }

    // Execute queries in parallel for best performance
    const [totalResult, transactions] = await Promise.all([
      // Get total sum of purchase expenses
      this.prisma.transaction.aggregate({
        where,
        _sum: {
          amount: true,
        },
        _count: true,
      }),

      // Get list of purchase transactions with inventory item details
      this.prisma.transaction.findMany({
        where,
        include: {
          branch: {
            select: {
              id: true,
              name: true,
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
        orderBy: {
          date: 'desc',
        },
      }),
    ]);

    const total = Number(totalResult._sum.amount || 0);
    const count = totalResult._count;

    // Format transactions for response
    const formattedTransactions = transactions.map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      date: formatToISODate(t.date),
      description: t.employeeVendorName,
      paymentMethod: t.paymentMethod,
      branchId: t.branchId,
      branchName: t.branch.name,
      inventoryItem: t.inventoryItem
        ? {
            id: t.inventoryItem.id,
            name: t.inventoryItem.name,
            quantity: Number(t.inventoryItem.quantity),
            unit: t.inventoryItem.unit,
          }
        : null,
    }));

    return {
      total,
      count,
      transactions: formattedTransactions,
    };
  }

  /**
   * Create transaction with inventory operations and partial payment support
   * Supports:
   * - Purchase (add to inventory) or Consumption (deduct from inventory)
   * - Single inventory item per transaction
   * - Partial payment with automatic debt creation
   */
  async createTransactionWithInventory(
    dto: any, // Will use CreateTransactionWithInventoryDto
    user: RequestUser,
  ): Promise<any> {
    // Determine branchId based on user role
    let branchId: string;

    if (user.role === UserRole.ADMIN) {
      if (!dto.branchId) {
        throw new BadRequestException('Admin must specify branchId for transaction');
      }
      branchId = dto.branchId;
    } else {
      if (!user.branchId) {
        throw new BadRequestException('Accountant must be assigned to branch');
      }
      branchId = user.branchId;
    }

    // Validate amounts
    if (dto.totalAmount <= 0) {
      throw new BadRequestException(ERROR_MESSAGES.VALIDATION.AMOUNT_POSITIVE);
    }

    const paidAmount = dto.paidAmount ?? dto.totalAmount;

    if (paidAmount < 0) {
      throw new BadRequestException('Paid amount cannot be negative');
    }

    if (paidAmount > dto.totalAmount) {
      throw new BadRequestException('Paid amount cannot exceed total amount');
    }

    const remainingAmount = dto.totalAmount - paidAmount;

    // If creating debt, validate debt fields
    if (dto.createDebtForRemaining && remainingAmount > 0) {
      if (!dto.debtCreditorName) {
        throw new BadRequestException('Creditor name is required when creating debt');
      }
    }

    // Use Prisma transaction for atomicity
    return this.prisma.$transaction(async (prisma) => {
      let linkedDebtId: string | null = null;

      // Create debt if partial payment
      if (dto.createDebtForRemaining && remainingAmount > 0) {
        const debt = await prisma.debt.create({
          data: {
            branchId,
            creditorName: dto.debtCreditorName,
            originalAmount: remainingAmount,
            remainingAmount: remainingAmount,
            date: formatDateForDB(dto.date),
            dueDate: dto.debtDueDate ? formatDateForDB(dto.debtDueDate) : null,
            status: 'ACTIVE',
            notes: dto.debtNotes || null,
            createdBy: user.id,
          },
        });

        linkedDebtId = debt.id;

        // Log debt creation
        await this.auditLogService.logCreate(
          user.id,
          AuditEntityType.DEBT,
          debt.id,
          debt,
        );
      }

      // Create the main transaction
      const transaction = await prisma.transaction.create({
        data: {
          type: dto.type,
          amount: paidAmount, // Store paid amount as the transaction amount
          totalAmount: dto.totalAmount,
          paidAmount: paidAmount,
          date: formatDateForDB(dto.date),
          paymentMethod: dto.paymentMethod,
          category: normalizeCategory(dto.category) || 'General',
          employeeVendorName: 'N/A',
          notes: dto.notes || null,
          branchId: branchId,
          createdBy: user.id,
          linkedDebtId: linkedDebtId,
        },
        include: {
          branch: true,
          creator: {
            select: USER_SELECT,
          },
          linkedDebt: true,
        },
      });

      // Process inventory item if present
      if (dto.inventoryItem) {
        const item = dto.inventoryItem;

        // Get inventory item to validate and check availability
        const inventoryItem = await prisma.inventoryItem.findFirst({
          where: {
            id: item.itemId,
            branchId: branchId,
            deletedAt: null,
          },
        });

        if (!inventoryItem) {
          throw new NotFoundException(`Inventory item ${item.itemId} not found in this branch`);
        }

        // For CONSUMPTION, validate sufficient quantity
        if (item.operationType === 'CONSUMPTION') {
          if (Number(inventoryItem.quantity) < item.quantity) {
            throw new BadRequestException(
              `Insufficient quantity for ${inventoryItem.name}. Available: ${inventoryItem.quantity}, Requested: ${item.quantity}`,
            );
          }

          // Deduct from inventory
          await prisma.inventoryItem.update({
            where: { id: item.itemId },
            data: {
              quantity: {
                decrement: item.quantity,
              },
              lastUpdated: getCurrentTimestamp(),
            },
          });

          // Record consumption
          await prisma.inventoryConsumption.create({
            data: {
              inventoryItemId: item.itemId,
              branchId: branchId,
              quantity: item.quantity,
              unit: inventoryItem.unit,
              reason: `Transaction: ${transaction.id}`,
              consumedAt: getCurrentTimestamp(),
              recordedBy: user.id,
            },
          });
        } else if (item.operationType === 'PURCHASE') {
          // Add to inventory using weighted average cost
          if (!item.unitPrice) {
            throw new BadRequestException('Unit price is required for purchase operations');
          }

          const currentQuantity = Number(inventoryItem.quantity);
          const currentCost = Number(inventoryItem.costPerUnit);
          const newQuantity = currentQuantity + item.quantity;

          // Calculate weighted average cost
          const totalValue = currentQuantity * currentCost + item.quantity * item.unitPrice;
          const newCost = newQuantity > 0 ? totalValue / newQuantity : item.unitPrice;

          await prisma.inventoryItem.update({
            where: { id: item.itemId },
            data: {
              quantity: {
                increment: item.quantity,
              },
              costPerUnit: newCost,
              lastUpdated: getCurrentTimestamp(),
            },
          });
        }

        // Create transaction-inventory link
        await prisma.transactionInventoryItem.create({
          data: {
            transactionId: transaction.id,
            inventoryItemId: item.itemId,
            quantity: item.quantity,
            operationType: item.operationType,
            unitPrice: item.unitPrice || null,
          },
        });
      }

      // Log transaction creation
      await this.auditLogService.logCreate(
        user.id,
        AuditEntityType.TRANSACTION,
        transaction.id,
        transaction,
      );

      // Notify about transaction
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
          console.error('Failed to create transaction notification:', error);
        });

      // Emit WebSocket event
      this.websocketGateway.emitNewTransaction(transaction);

      // Fetch full transaction with all relations
      const fullTransaction = await prisma.transaction.findUnique({
        where: { id: transaction.id },
        include: {
          branch: true,
          creator: {
            select: USER_SELECT,
          },
          linkedDebt: {
            include: {
              payments: true,
            },
          },
          transactionInventoryItems: {
            include: {
              inventoryItem: true,
            },
          },
        },
      });

      return fullTransaction;
    });
  }
}
