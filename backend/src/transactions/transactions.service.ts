import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionItemDto } from './dto/transaction-item.dto';
import { Prisma, EmployeeStatus, DiscountType } from '@prisma/client';
import { TransactionType, UserRole, PaymentMethod, DebtStatus } from '../common/types/prisma-enums';
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
import { ARABIC_ERRORS, TransactionErrors } from '../common/constants/arabic-errors';
import { 
  normalizeCategory, 
  supportsMultiItem, 
  supportsDiscount,
  Category,
  DEFAULT_CATEGORY,
  type TransactionCategory,
} from '../common/constants/transaction-categories';
import { RequestUser } from '../common/interfaces';
// Import helpers
import {
  resolveBranchId,
  getEffectiveBranchFilter,
  calculateDiscount,
  calculateItemTotal,
  processPartialPayment,
  processInventoryOperation,
} from './helpers';

interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Parameters for the core transaction creation method
 */
interface CreateTransactionCoreParams {
  type: TransactionType;
  category: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  date: string;
  branchId: string;
  creatorId: string;

  notes?: string;
  items?: TransactionItemDto[];
  discount?: { type: DiscountType; value: number; reason?: string };
  partialPayment?: { paidAmount: number; contactId: string; dueDate?: string };
  employeeId?: string;
}

interface TransactionFilters {
  type?: TransactionType;
  branchId?: string;
  category?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  employeeId?: string; // Filter salary transactions by employee
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

  // ============================================
  // PUBLIC METHODS - Transaction Creation
  // ============================================

  /**
   * Create a new INCOME transaction
   * POST /transactions/income
   */
  async createIncome(dto: CreateIncomeDto, user: RequestUser): Promise<TransactionWithBranchAndCreator> {
    // Resolve branch ID based on user role
    const branchId = resolveBranchId(user, dto.branchId);
    const category = normalizeCategory(dto.category) || DEFAULT_CATEGORY;
    const hasItems = dto.items && dto.items.length > 0;

    // Validate multi-item support
    if (hasItems && !supportsMultiItem(category)) {
      throw new BadRequestException(TransactionErrors.categoryNotSupportMultiItem(category));
    }

    // Validate discount rules
    if (dto.discountType || dto.discountValue) {
      if (!supportsDiscount(category)) {
        throw new BadRequestException(TransactionErrors.categoryNotSupportDiscount(category));
      }
    }

    // Validate that either amount OR items is provided
    if (!hasItems && (!dto.amount || dto.amount <= 0)) {
      throw new BadRequestException(ERROR_MESSAGES.VALIDATION.AMOUNT_POSITIVE);
    }

    // Validate payment method for income transactions
    if (
      dto.paymentMethod &&
      dto.paymentMethod !== PaymentMethod.CASH &&
      dto.paymentMethod !== PaymentMethod.MASTER
    ) {
      throw new BadRequestException(ERROR_MESSAGES.TRANSACTION.PAYMENT_METHOD_INVALID);
    }

    // Calculate amounts
    let subtotal = 0;
    let finalAmount = 0;

    if (hasItems) {
      for (const item of dto.items!) {
        const itemCalc = calculateItemTotal(
          item.quantity,
          item.unitPrice,
          item.discountType,
          item.discountValue,
        );
        subtotal += Number(itemCalc.subtotal);
      }

      const discountCalc = calculateDiscount(
        subtotal,
        dto.discountType,
        dto.discountValue,
      );
      finalAmount = Number(discountCalc.total);
    } else {
      subtotal = dto.amount!;
      if (dto.discountType && dto.discountValue) {
        const discountCalc = calculateDiscount(
          subtotal,
          dto.discountType,
          dto.discountValue,
        );
        finalAmount = Number(discountCalc.total);
      } else {
        finalAmount = subtotal;
      }
    }

    return this._createTransactionCore({
      type: TransactionType.INCOME,
      category,
      amount: finalAmount,
      paymentMethod: dto.paymentMethod,
      date: dto.date,
      branchId,
      creatorId: user.id,

      notes: dto.notes,
      items: dto.items,
      discount: dto.discountType && dto.discountValue
        ? { type: dto.discountType, value: dto.discountValue, reason: dto.discountReason }
        : undefined,
    });
  }

  /**
   * Create a new EXPENSE transaction
   * POST /transactions/expense
   */
  async createExpense(dto: CreateExpenseDto, user: RequestUser): Promise<TransactionWithBranchAndCreator> {
    // Resolve branch ID based on user role
    const branchId = resolveBranchId(user, dto.branchId);
    const category = normalizeCategory(dto.category) || DEFAULT_CATEGORY;
    const hasItems = dto.items && dto.items.length > 0;

    // Validate multi-item support for expenses
    if (hasItems && !supportsMultiItem(category)) {
      throw new BadRequestException(TransactionErrors.categoryNotSupportMultiItem(category));
    }

    // Validate that either amount OR items is provided
    if (!hasItems && (!dto.amount || dto.amount <= 0)) {
      throw new BadRequestException(ERROR_MESSAGES.VALIDATION.AMOUNT_POSITIVE);
    }

    // Validate employee for salary transactions
    if (category === Category.EMPLOYEE_SALARIES && dto.employeeId) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: dto.employeeId },
      });

      if (!employee) {
        throw new NotFoundException(ARABIC_ERRORS.employeeNotFound);
      }

      if (employee.status === EmployeeStatus.RESIGNED) {
        throw new BadRequestException(ARABIC_ERRORS.cannotCreateSalaryForResignedEmployee);
      }
    }

    // Calculate amounts
    let subtotal = 0;
    let finalAmount = 0;

    if (hasItems) {
      for (const item of dto.items!) {
        const itemCalc = calculateItemTotal(
          item.quantity,
          item.unitPrice,
          item.discountType,
          item.discountValue,
        );
        subtotal += Number(itemCalc.subtotal);
      }
      finalAmount = subtotal; // No transaction-level discount for expenses
    } else {
      subtotal = dto.amount!;
      finalAmount = subtotal;
    }

    // Handle partial payment
    const totalAmount = finalAmount;
    const paidAmount = dto.paidAmount !== undefined ? dto.paidAmount : totalAmount;
    const remainingAmount = totalAmount - paidAmount;

    // Validate partial payment
    if (paidAmount < 0) {
      throw new BadRequestException(ARABIC_ERRORS.paidAmountNegative);
    }

    if (paidAmount > totalAmount) {
      throw new BadRequestException(ARABIC_ERRORS.paidAmountExceedsTotal);
    }

    // If partial payment, require contactId
    if (remainingAmount > 0 && dto.createDebtForRemaining !== false) {
      if (!dto.contactId) {
        throw new BadRequestException(ARABIC_ERRORS.contactIdRequiredForPartialPayment);
      }
    }

    return this._createTransactionCore({
      type: TransactionType.EXPENSE,
      category,
      amount: paidAmount,
      paymentMethod: dto.paymentMethod,
      date: dto.date,
      branchId,
      creatorId: user.id,

      notes: dto.notes,
      items: dto.items,
      partialPayment: remainingAmount > 0 && dto.contactId
        ? { paidAmount, contactId: dto.contactId, dueDate: dto.payableDueDate }
        : undefined,
      employeeId: dto.employeeId,
    });
  }

  // ============================================
  // PRIVATE METHODS - Core Transaction Logic
  // ============================================

  /**
   * Core transaction creation logic shared by createIncome and createExpense
   * All validation is done in the public methods before calling this
   */
  private async _createTransactionCore(params: CreateTransactionCoreParams): Promise<TransactionWithBranchAndCreator> {
    const {
      type,
      category,
      amount,
      paymentMethod,
      date,
      branchId,
      creatorId,

      notes,
      items,
      discount,
      partialPayment,
      employeeId,
    } = params;

    const hasItems = items && items.length > 0;

    // Use Prisma transaction for atomicity
    return this.prisma.$transaction(async (prisma) => {
      // Calculate subtotal from items if present
      let subtotal = amount;
      if (hasItems) {
        subtotal = 0;
        for (const item of items!) {
          const itemCalc = calculateItemTotal(
            item.quantity,
            item.unitPrice,
            item.discountType,
            item.discountValue,
          );
          subtotal += Number(itemCalc.subtotal);
        }
      }

      // Handle partial payment and create AccountPayable if needed
      let linkedPayableId: string | null = null;
      const totalAmount = amount;
      const paidAmount = partialPayment ? partialPayment.paidAmount : amount;
      const remainingAmount = totalAmount - paidAmount;

      if (partialPayment && remainingAmount > 0) {
        const payable = await prisma.accountPayable.create({
          data: {
            branchId,
            contactId: partialPayment.contactId,
            originalAmount: remainingAmount,
            remainingAmount: remainingAmount,
            date: formatDateForDB(date),
            dueDate: partialPayment.dueDate ? formatDateForDB(partialPayment.dueDate) : null,
            status: DebtStatus.ACTIVE,
            description: TransactionErrors.autoDebtDescription(category),
            notes: notes || ARABIC_ERRORS.remainingAmountNote,
            createdBy: creatorId,
          },
        });

        linkedPayableId = payable.id;

        // Log payable creation
        await this.auditLogService.logCreate(
          creatorId,
          AuditEntityType.ACCOUNT_PAYABLE,
          payable.id,
          payable,
        );
      }

      // Build transaction data
      const transactionData = {
        type,
        amount: paidAmount,
        totalAmount: remainingAmount > 0 ? totalAmount : null,
        paidAmount: remainingAmount > 0 ? paidAmount : null,
        subtotal: hasItems || discount ? subtotal : null,
        date: formatDateForDB(date),
        paymentMethod: paymentMethod || null,
        category,

        notes: notes || null,
        discountType: discount?.type || null,
        discountValue: discount?.value || null,
        discountReason: discount?.reason || null,
        branchId,
        createdBy: creatorId,
        employeeId: employeeId || null,
        contactId: partialPayment?.contactId || null,
        linkedPayableId,
      };

      const transaction = await prisma.transaction.create({
        data: transactionData,
        include: {
          branch: true,
          creator: {
            select: USER_SELECT,
          },
        },
      });

      // Process multi-item transactions
      if (hasItems) {
        for (const item of items!) {
          // Validate inventory item exists
          const inventoryItem = await prisma.inventoryItem.findFirst({
            where: {
              id: item.inventoryItemId,
              branchId,
              deletedAt: null,
            },
          });

          if (!inventoryItem) {
            throw new NotFoundException(TransactionErrors.inventoryItemNotFoundInBranch(item.inventoryItemId));
          }

          // For CONSUMPTION, validate sufficient quantity and deduct
          if (item.operationType === 'CONSUMPTION') {
            if (Number(inventoryItem.quantity) < item.quantity) {
              throw new BadRequestException(
                TransactionErrors.insufficientQuantity(
                  inventoryItem.name,
                  Number(inventoryItem.quantity),
                  item.quantity,
                ),
              );
            }

            await prisma.inventoryItem.update({
              where: { id: item.inventoryItemId },
              data: {
                quantity: { decrement: item.quantity },
                lastUpdated: getCurrentTimestamp(),
              },
            });

            await prisma.inventoryConsumption.create({
              data: {
                inventoryItemId: item.inventoryItemId,
                branchId,
                quantity: item.quantity,
                unit: inventoryItem.unit,
                reason: `معاملة: ${transaction.id}`,
                consumedAt: getCurrentTimestamp(),
                recordedBy: creatorId,
              },
            });
          } else if (item.operationType === 'PURCHASE') {
            // Add to inventory using weighted average cost
            const currentQuantity = Number(inventoryItem.quantity);
            const currentCost = Number(inventoryItem.costPerUnit);
            const newQuantity = currentQuantity + item.quantity;
            const totalValue = currentQuantity * currentCost + item.quantity * item.unitPrice;
            const newCost = newQuantity > 0 ? totalValue / newQuantity : item.unitPrice;

            await prisma.inventoryItem.update({
              where: { id: item.inventoryItemId },
              data: {
                quantity: { increment: item.quantity },
                costPerUnit: newCost,
                lastUpdated: getCurrentTimestamp(),
              },
            });
          }

          // Calculate item totals and create link
          const itemCalc = calculateItemTotal(
            item.quantity,
            item.unitPrice,
            item.discountType,
            item.discountValue,
          );

          await prisma.transactionInventoryItem.create({
            data: {
              transactionId: transaction.id,
              inventoryItemId: item.inventoryItemId,
              quantity: item.quantity,
              operationType: item.operationType,
              unitPrice: item.unitPrice,
              subtotal: Number(itemCalc.subtotal),
              discountType: item.discountType || null,
              discountValue: item.discountValue || null,
              total: Number(itemCalc.total),
            },
          });
        }
      }

      // Log the creation in audit log
      await this.auditLogService.logCreate(
        creatorId,
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
          creatorId,
        )
        .catch((error) => {
          console.error('Failed to create transaction notification:', error);
        });

      // Emit WebSocket event for real-time updates
      this.websocketGateway.emitNewTransaction(transaction);

      return transaction;
    });
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

    // Search filter (searches in category, and notes)
    if (filters.search) {
      where.OR = [
        { category: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Employee filter (for salary transactions)
    if (filters.employeeId) {
      where.employeeId = filters.employeeId;
    }

    // Get total count for pagination
    const total = await this.prisma.transaction.count({ where });

    // Get transactions - sort by date first, then by createdAt for same-day transactions
    const transactions = await this.prisma.transaction.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
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
        transactionInventoryItems: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            subtotal: true,
            discountType: true,
            discountValue: true,
            total: true,
            operationType: true,
            notes: true,
            inventoryItem: {
              select: {
                id: true,
                name: true,
                unit: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
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
        transactionInventoryItems: {
          include: {
            inventoryItem: {
              select: INVENTORY_ITEM_EXTENDED_SELECT,
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
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

  if (updateTransactionDto.notes !== undefined) updateData.notes = updateTransactionDto.notes;

  // Handle discount fields
  if (updateTransactionDto.discountType !== undefined)
    updateData.discountType = updateTransactionDto.discountType;
  if (updateTransactionDto.discountValue !== undefined)
    updateData.discountValue = updateTransactionDto.discountValue;
  if (updateTransactionDto.discountReason !== undefined)
    updateData.discountReason = updateTransactionDto.discountReason;

  // Use transaction for atomicity when updating inventory items
  return this.prisma.$transaction(async (prisma) => {
    // Update transaction inventory items if provided
    if (updateTransactionDto.transactionInventoryItems && updateTransactionDto.transactionInventoryItems.length > 0) {
      // Create a map of item updates for quick lookup
      const itemUpdatesMap = new Map(
        updateTransactionDto.transactionInventoryItems.map(item => [item.id, item])
      );

      // Get ALL existing transaction inventory items
      const allExistingItems = await prisma.transactionInventoryItem.findMany({
        where: { transactionId: id },
      });

      let newTotal = 0;

      for (const existingItem of allExistingItems) {
        const itemUpdate = itemUpdatesMap.get(existingItem.id);

        if (itemUpdate) {
          // This item is being updated
          const newQuantity = itemUpdate.quantity ?? Number(existingItem.quantity);
          const newUnitPrice = itemUpdate.unitPrice ?? Number(existingItem.unitPrice);

          // Calculate subtotal and total (apply existing discount if any)
          const subtotal = newQuantity * newUnitPrice;
          let itemTotal = subtotal;

          // Apply existing item-level discount if present
          if (existingItem.discountType && existingItem.discountValue) {
            const discountCalc = calculateDiscount(
              subtotal,
              existingItem.discountType,
              Number(existingItem.discountValue),
            );
            itemTotal = Number(discountCalc.total);
          }

          // Update the transaction inventory item
          await prisma.transactionInventoryItem.update({
            where: { id: itemUpdate.id },
            data: {
              quantity: newQuantity,
              unitPrice: newUnitPrice,
              subtotal: subtotal,
              total: itemTotal,
            },
          });

          newTotal += itemTotal;
        } else {
          // This item is not being updated, include its existing total
          newTotal += Number(existingItem.total);
        }
      }

      // Update transaction amount to match total of all items
      updateData.amount = newTotal;
    }

    // Update the transaction
    const updatedTransaction = await prisma.transaction.update({
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
          select: INVENTORY_ITEM_EXTENDED_SELECT,
        },
        transactionInventoryItems: {
          include: {
            inventoryItem: {
              select: INVENTORY_ITEM_EXTENDED_SELECT,
            },
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
  });
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
 * Get expenses by category with filtering support.
 * Consolidated method that replaces duplicated getSalaryExpenses and getPurchaseExpenses.
 */
  async getExpensesByCategory(
    user: RequestUser,
    category: TransactionCategory,
    branchId?: string,
    startDate?: string,
    endDate?: string,
    includeInventory = false,
  ): Promise<{
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
      inventoryItem?: { id: string; name: string; quantity: number; unit: string } | null;
    }>;
  }> {
    // Use helper for branch filter
    const filterBranchId = getEffectiveBranchFilter(user, branchId);

    // Build where clause
    const where: Prisma.TransactionWhereInput = {
      deletedAt: null,
      type: TransactionType.EXPENSE,
      category,
      ...(filterBranchId && { branchId: filterBranchId }),
    };

    // Apply date range filter
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = formatDateForDB(startDate);
      if (endDate) where.date.lte = formatDateForDB(endDate);
    }

    // Execute queries in parallel
    const [totalResult, transactions] = await Promise.all([
      this.prisma.transaction.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.transaction.findMany({
        where,
        include: {
          branch: { select: { id: true, name: true } },
          ...(includeInventory && {
            inventoryItem: { select: { id: true, name: true, quantity: true, unit: true } },
          }),
        },
        orderBy: { date: 'desc' },
      }),
    ]);

    return {
      total: Number(totalResult._sum.amount || 0),
      count: totalResult._count,
      transactions: transactions.map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        date: formatToISODate(t.date),
        description: t.notes || '',
        paymentMethod: t.paymentMethod,
        branchId: t.branchId,
        branchName: t.branch.name,
        ...(includeInventory && {
          inventoryItem: t.inventoryItem
            ? {
                id: t.inventoryItem.id,
                name: t.inventoryItem.name,
                quantity: Number(t.inventoryItem.quantity),
                unit: t.inventoryItem.unit,
              }
            : null,
        }),
      })),
    };
  }

  /**
   * Get salary expenses - wrapper for backward compatibility
   */
  async getSalaryExpenses(
    user: RequestUser,
    branchId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<SalaryExpensesSummary> {
    return this.getExpensesByCategory(user, Category.EMPLOYEE_SALARIES, branchId, startDate, endDate, false);
  }

  /**
   * Get purchase expenses - wrapper for backward compatibility
   */
  async getPurchaseExpenses(
    user: RequestUser,
    branchId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<PurchaseExpensesSummary> {
    const result = await this.getExpensesByCategory(user, Category.INVENTORY, branchId, startDate, endDate, true);
    // Ensure inventoryItem is explicitly null (not undefined) for PurchaseExpensesSummary
    return {
      ...result,
      transactions: result.transactions.map((t) => ({
        ...t,
        inventoryItem: t.inventoryItem ?? null,
      })),
    };
  }

}
