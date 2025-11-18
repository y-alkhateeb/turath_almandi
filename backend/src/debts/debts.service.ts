import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { PayDebtDto } from './dto/pay-debt.dto';
import { UserRole, DebtStatus, Prisma } from '@prisma/client';
import { AuditLogService, AuditEntityType } from '../common/audit-log/audit-log.service';
import { applyBranchFilter } from '../common/utils/query-builder';
import { BRANCH_SELECT, USER_SELECT } from '../common/constants/prisma-includes';
import { formatDateForDB } from '../common/utils/date.utils';
import { ERROR_MESSAGES } from '../common/constants/error-messages';

interface RequestUser {
  id: string;
  username: string;
  role: UserRole;
  branchId: string | null;
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
        throw new ForbiddenException(ERROR_MESSAGES.DEBT.BRANCH_REQUIRED_CREATE);
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

    // Build debt data
    const debtData = {
      creditorName: createDebtDto.creditorName,
      originalAmount: createDebtDto.amount,
      remainingAmount: createDebtDto.amount, // Auto-set to amount
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

    return debt;
  }

  /**
   * Find all debts with filtering by branch
   * Accountants can only see debts from their branch
   * Admins can see all debts
   */
  async findAll(user: RequestUser): Promise<DebtWithAllRelations[]> {
    // Build where clause based on user role
    let where: any = {};

    // Apply role-based branch filtering
    where = applyBranchFilter(user, where);

    // Get debts
    const debts = await this.prisma.debt.findMany({
      where,
      orderBy: { dueDate: 'asc' },
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

    return debts;
  }

  /**
   * Pay debt (create payment and update debt)
   * Uses transaction to ensure atomicity
   * Validates: amount_paid <= remaining_amount
   * Updates: remaining_amount = remaining_amount - amount_paid
   * Auto-updates status: PAID if remaining = 0, PARTIAL if 0 < remaining < original
   */
  async payDebt(debtId: string, payDebtDto: PayDebtDto, user: RequestUser): Promise<DebtWithAllRelations> {
    // Validate user has a branch assigned
    if (!user.branchId) {
      throw new ForbiddenException(ERROR_MESSAGES.DEBT.BRANCH_REQUIRED_PAY);
    }

    // Validate amount is positive
    if (payDebtDto.amountPaid <= 0) {
      throw new BadRequestException(ERROR_MESSAGES.VALIDATION.PAYMENT_POSITIVE);
    }

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

    return result.debt;
  }
}
