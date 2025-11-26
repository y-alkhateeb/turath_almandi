import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { PayDebtDto } from './dto/pay-debt.dto';
import { Prisma } from '@prisma/client';
import { UserRole, DebtStatus } from '../common/types/prisma-enums';
import { AuditLogService, AuditEntityType } from '../common/audit-log/audit-log.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WebSocketGatewayService } from '../websocket/websocket.gateway';
import { SettingsService } from '../settings/settings.service';
import { applyBranchFilter } from '../common/utils/query-builder';
import { BRANCH_SELECT, USER_SELECT } from '../common/constants/prisma-includes';
import { formatDateForDB } from '../common/utils/date.utils';
import { ERROR_MESSAGES } from '../common/constants/error-messages';
import { RequestUser } from '../common/interfaces';

interface PaginationParams {
  page?: number;
  limit?: number;
}

interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

interface DebtsSummary {
  totalDebts: number;
  activeDebts: number;
  paidDebts: number;
  partialDebts: number;
  totalOwed: number;
  overdueDebts: number;
}

// Type for debt with branch and creator relations
type DebtWithRelations = Prisma.DebtGetPayload<{
  include: {
    branch: {
      select: typeof BRANCH_SELECT;
    };
    creator: {
      select: typeof USER_SELECT;
    };
  };
}>;

// Type for debt with branch, creator, and payments
type DebtWithAllRelations = Prisma.DebtGetPayload<{
  include: {
    branch: {
      select: typeof BRANCH_SELECT;
    };
    creator: {
      select: typeof USER_SELECT;
    };
    payments: true;
  };
}>;

@Injectable()
export class DebtsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly notificationsService: NotificationsService,
    private readonly websocketGateway: WebSocketGatewayService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Create a new debt
   * Auto-sets: original_amount = amount, remaining_amount = amount, status = 'ACTIVE'
   * Validates: due_date >= date
   * Filters by branch: accountants can only create debts for their branch
   */
  async create(createDebtDto: CreateDebtDto, user: RequestUser): Promise<DebtWithRelations> {
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
      if (!createDebtDto.branchId) {
        throw new BadRequestException(ERROR_MESSAGES.BRANCH.REQUIRED);
      }
      branchId = createDebtDto.branchId;
    }

    // Validate amount is positive
    if (createDebtDto.amount <= 0) {
      throw new BadRequestException(ERROR_MESSAGES.VALIDATION.AMOUNT_POSITIVE);
    }

    // Validate due_date >= date
    const date = formatDateForDB(createDebtDto.date);
    const dueDate = formatDateForDB(createDebtDto.dueDate);

    if (dueDate < date) {
      throw new BadRequestException(ERROR_MESSAGES.DEBT.DUE_DATE_INVALID);
    }

    // Currency is now frontend-only, not needed for database

    // Build debt data
    const debtData = {
      creditorName: createDebtDto.creditorName,
      originalAmount: createDebtDto.amount,
      remainingAmount: createDebtDto.amount, // Auto-set to amount
      // Currency removed - now frontend-only display
      date: date,
      dueDate: dueDate,
      status: DebtStatus.ACTIVE, // Auto-set to ACTIVE
      notes: createDebtDto.notes || null,
      branchId: branchId,
      createdBy: user.id,
    };

    const debt = await this.prisma.debt.create({
      data: debtData,
      include: {
        branch: {
          select: BRANCH_SELECT,
        },
        creator: {
          select: USER_SELECT,
        },
      },
    });

    // Log the creation in audit log
    await this.auditLogService.logCreate(user.id, AuditEntityType.DEBT, debt.id, debt);

    // Emit WebSocket event for real-time updates
    this.websocketGateway.emitNewDebt(debt);

    // Notify about the new debt (async, don't wait)
    this.notificationsService
      .notifyNewDebt(
        debt.id,
        debt.creditorName,
        Number(debt.originalAmount),
        debt.dueDate,
        debt.branchId,
        user.id,
      )
      .catch((error) => {
        // Log error but don't fail the debt creation
        console.error('Failed to create debt notification:', error);
      });

    return debt;
  }

  /**
   * Find all debts with filtering by branch and pagination
   * Accountants can only see debts from their branch
   * Admins can see all debts
   */
  async findAll(
    user: RequestUser,
    pagination: PaginationParams = {},
  ): Promise<{ data: DebtWithAllRelations[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    // Build where clause based on user role
    let where: Prisma.DebtWhereInput = {
      deletedAt: null, // Exclude soft-deleted debts
    };

    // Apply role-based branch filtering
    where = applyBranchFilter(user, where);

    // Get total count for pagination
    const total = await this.prisma.debt.count({ where });

    // Get debts
    const debts = await this.prisma.debt.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      skip,
      take: limit,
      include: {
        branch: {
          select: BRANCH_SELECT,
        },
        creator: {
          select: USER_SELECT,
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    return {
      data: debts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find one debt by ID with branch access control
   * Accountants can only see debts from their branch
   * Admins can see any debt
   */
  async findOne(id: string, user: RequestUser): Promise<DebtWithAllRelations> {
    const debt = await this.prisma.debt.findUnique({
      where: { id },
      include: {
        branch: {
          select: BRANCH_SELECT,
        },
        creator: {
          select: USER_SELECT,
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!debt) {
      throw new NotFoundException(ERROR_MESSAGES.DEBT.NOT_FOUND);
    }

    if (debt.deletedAt) {
      throw new NotFoundException(ERROR_MESSAGES.DEBT.NOT_FOUND);
    }

    // Accountants can only access debts from their branch
    if (user.role === UserRole.ACCOUNTANT && debt.branchId !== user.branchId) {
      throw new ForbiddenException(ERROR_MESSAGES.BRANCH.CANNOT_ACCESS_OTHER);
    }

    return debt;
  }

  /**
   * Pay debt (create payment and update debt)
   * Uses transaction to ensure atomicity
   * Validates: amount_paid <= remaining_amount
   * Updates: remaining_amount = remaining_amount - amount_paid
   * Auto-updates status: PAID if remaining = 0, PARTIAL if 0 < remaining < original
   */
  async payDebt(debtId: string, payDebtDto: PayDebtDto, user: RequestUser): Promise<DebtWithAllRelations> {
    // Validate accountant has a branch assigned
    if (user.role === UserRole.ACCOUNTANT && !user.branchId) {
      throw new BadRequestException('Accountant must be assigned to branch');
    }

    // Validate amount is positive
    if (payDebtDto.amountPaid <= 0) {
      throw new BadRequestException(ERROR_MESSAGES.VALIDATION.PAYMENT_POSITIVE);
    }

    // Get default currency from settings
    const defaultCurrency = await this.settingsService.getDefaultCurrency();

    // Use Prisma transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      // Get the debt
      const debt = await tx.debt.findUnique({
        where: { id: debtId },
        include: {
          branch: {
            select: BRANCH_SELECT,
          },
          creator: {
            select: USER_SELECT,
          },
        },
      });

      if (!debt) {
        throw new NotFoundException(ERROR_MESSAGES.DEBT.NOT_FOUND);
      }

      // Capture old debt data for audit log
      const oldDebtData = {
        remainingAmount: debt.remainingAmount,
        status: debt.status,
      };

      // Role-based access control
      if (user.role === UserRole.ACCOUNTANT && debt.branchId !== user.branchId) {
        throw new ForbiddenException(ERROR_MESSAGES.DEBT.ONLY_PAY_OWN_BRANCH);
      }

      // Validate payment amount doesn't exceed remaining amount
      const remainingAmount = Number(debt.remainingAmount);
      if (payDebtDto.amountPaid > remainingAmount) {
        throw new BadRequestException(
          ERROR_MESSAGES.DEBT.PAYMENT_EXCEEDS_REMAINING(payDebtDto.amountPaid, remainingAmount),
        );
      }

      // Calculate new remaining amount
      const newRemainingAmount = remainingAmount - payDebtDto.amountPaid;

      // Determine new status
      let newStatus: DebtStatus;
      if (newRemainingAmount === 0) {
        newStatus = DebtStatus.PAID;
      } else if (newRemainingAmount > 0 && newRemainingAmount < Number(debt.originalAmount)) {
        newStatus = DebtStatus.PARTIAL;
      } else {
        newStatus = debt.status; // Keep current status
      }

      // Create payment record
      const payment = await tx.debtPayment.create({
        data: {
          debtId: debtId,
          amountPaid: payDebtDto.amountPaid,
          // Currency is now frontend-only, not stored in database
          paymentDate: formatDateForDB(payDebtDto.paymentDate),
          notes: payDebtDto.notes || null,
          recordedBy: user.id,
        },
      });

      // Update debt
      const updatedDebt = await tx.debt.update({
        where: { id: debtId },
        data: {
          remainingAmount: newRemainingAmount,
          status: newStatus,
        },
        include: {
          branch: {
            select: BRANCH_SELECT,
          },
          creator: {
            select: USER_SELECT,
          },
          payments: {
            orderBy: { paymentDate: 'desc' },
          },
        },
      });

      return { payment, debt: updatedDebt, oldDebtData };
    });

    // Log the payment in audit log
    await this.auditLogService.logCreate(
      user.id,
      AuditEntityType.DEBT_PAYMENT,
      result.payment.id,
      result.payment,
    );

    // Log the debt update in audit log
    await this.auditLogService.logUpdate(
      user.id,
      AuditEntityType.DEBT,
      debtId,
      result.oldDebtData,
      { remainingAmount: result.debt.remainingAmount, status: result.debt.status },
    );

    // Emit WebSocket events for real-time updates
    this.websocketGateway.emitDebtPayment(result.payment);
    this.websocketGateway.emitDebtUpdate(result.debt);

    // Notify about the debt payment (async, don't wait)
    this.notificationsService
      .notifyDebtPayment(
        debtId,
        result.payment.id,
        result.debt.creditorName,
        Number(result.payment.amountPaid),
        Number(result.debt.remainingAmount),
        result.debt.branchId,
        user.id,
      )
      .catch((error) => {
        // Log error but don't fail the payment
        console.error('Failed to create debt payment notification:', error);
      });

    return result.debt;
  }

  /**
   * Get comprehensive debts summary with statistics
   * Useful for dashboard and reporting
   */
  async getDebtsSummary(
    user: RequestUser,
    dateRange?: DateRangeFilter,
    branchId?: string,
  ): Promise<DebtsSummary> {
    // Build base where clause with role-based filtering
    let where: Prisma.DebtWhereInput = {
      deletedAt: null, // Exclude soft-deleted debts
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
    if (dateRange) {
      where.date = {};
      if (dateRange.startDate) {
        where.date.gte = formatDateForDB(dateRange.startDate);
      }
      if (dateRange.endDate) {
        where.date.lte = formatDateForDB(dateRange.endDate);
      }
    }

    // Get today's date for overdue calculation (beginning of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Execute all queries in parallel for best performance
    const [
      totalDebts,
      activeDebts,
      paidDebts,
      partialDebts,
      totalOwedResult,
      overdueDebts,
    ] = await Promise.all([
      // Total count of all debts
      this.prisma.debt.count({ where }),

      // Count of active debts
      this.prisma.debt.count({
        where: { ...where, status: DebtStatus.ACTIVE },
      }),

      // Count of paid debts
      this.prisma.debt.count({
        where: { ...where, status: DebtStatus.PAID },
      }),

      // Count of partial debts
      this.prisma.debt.count({
        where: { ...where, status: DebtStatus.PARTIAL },
      }),

      // Sum of all remaining amounts
      this.prisma.debt.aggregate({
        where,
        _sum: {
          remainingAmount: true,
        },
      }),

      // Count of overdue debts (past due date and not fully paid)
      this.prisma.debt.count({
        where: {
          ...where,
          dueDate: {
            lt: today,
          },
          status: {
            not: DebtStatus.PAID,
          },
        },
      }),
    ]);

    const totalOwed = Number(totalOwedResult._sum.remainingAmount || 0);

    return {
      totalDebts,
      activeDebts,
      paidDebts,
      partialDebts,
      totalOwed,
      overdueDebts,
    };
  }
}
