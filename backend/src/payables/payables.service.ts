import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePayableDto } from './dto/create-payable.dto';
import { UpdatePayableDto } from './dto/update-payable.dto';
import { QueryPayablesDto } from './dto/query-payables.dto';
import { PayPayableDto } from './dto/pay-payable.dto';
import { Prisma } from '@prisma/client';
import { UserRole, DebtStatus, TransactionType } from '../common/types/prisma-enums';
import { AuditLogService, AuditEntityType } from '../common/audit-log/audit-log.service';
import { applyBranchFilter } from '../common/utils/query-builder';
import {
  BRANCH_SELECT,
  USER_SELECT,
  CONTACT_SELECT,
  PAYABLE_RECEIVABLE_SELECT,
  PAYMENT_SELECT,
} from '../common/constants/prisma-includes';
import { ERROR_MESSAGES } from '../common/constants/error-messages';
import { RequestUser } from '../common/interfaces';

// Type for payable with relations
type PayableWithRelations = Prisma.AccountPayableGetPayload<{
  include: {
    contact: {
      select: typeof CONTACT_SELECT;
    };
    branch: {
      select: typeof BRANCH_SELECT;
    };
    creator: {
      select: typeof USER_SELECT;
    };
  };
}>;

// Type for payable with payments
type PayableWithPayments = Prisma.AccountPayableGetPayload<{
  include: {
    contact: {
      select: typeof CONTACT_SELECT;
    };
    branch: {
      select: typeof BRANCH_SELECT;
    };
    creator: {
      select: typeof USER_SELECT;
    };
    payments: {
      where: { isDeleted: false };
      orderBy: { paymentDate: 'desc' };
      include: {
        recorder: {
          select: typeof USER_SELECT;
        };
      };
    };
  };
}>;

@Injectable()
export class PayablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Create a new payable
   * Branch filtering: accountants can only create payables for their branch
   * Validates: contact exists and belongs to the same branch (if applicable)
   */
  async create(createPayableDto: CreatePayableDto, user: RequestUser): Promise<PayableWithRelations> {
    // Determine branch ID
    let branchId: string | null = null;

    if (user.role === UserRole.ACCOUNTANT) {
      if (!user.branchId) {
        throw new BadRequestException(ERROR_MESSAGES.PAYABLE.BRANCH_REQUIRED_CREATE);
      }
      branchId = user.branchId;
    } else {
      // Admins can optionally specify a branch
      branchId = createPayableDto.branchId || null;
    }

    // Validate contact exists and has access
    const contact = await this.prisma.contact.findFirst({
      where: {
        id: createPayableDto.contactId,
        isDeleted: false,
        ...(branchId ? { branchId } : {}),
      },
    });

    if (!contact) {
      throw new NotFoundException(ERROR_MESSAGES.CONTACT.NOT_FOUND);
    }

    // Validate due date if provided
    if (createPayableDto.dueDate) {
      const date = new Date(createPayableDto.date);
      const dueDate = new Date(createPayableDto.dueDate);
      if (dueDate < date) {
        throw new BadRequestException(ERROR_MESSAGES.PAYABLE.DUE_DATE_INVALID);
      }
    }

    // Create the payable
    const payable = await this.prisma.accountPayable.create({
      data: {
        contactId: createPayableDto.contactId,
        originalAmount: createPayableDto.amount,
        remainingAmount: createPayableDto.amount,
        date: new Date(createPayableDto.date),
        dueDate: createPayableDto.dueDate ? new Date(createPayableDto.dueDate) : null,
        description: createPayableDto.description,
        invoiceNumber: createPayableDto.invoiceNumber,
        notes: createPayableDto.notes,
        status: DebtStatus.ACTIVE,
        branchId,
        linkedPurchaseTransactionId: createPayableDto.linkedPurchaseTransactionId,
        createdBy: user.id,
        isDeleted: false,
      },
      include: {
        contact: {
          select: CONTACT_SELECT,
        },
        branch: {
          select: BRANCH_SELECT,
        },
        creator: {
          select: USER_SELECT,
        },
      },
    });

    // Audit log
    await this.auditLogService.logCreate(
      user.id,
      AuditEntityType.PAYABLE,
      payable.id,
      {
        contactId: payable.contactId,
        amount: payable.originalAmount,
        date: payable.date,
        branchId: payable.branchId,
      },
    );

    return payable;
  }

  /**
   * Find all payables with pagination and filtering
   * Branch filtering: accountants see only their branch payables
   */
  async findAll(user: RequestUser, query: QueryPayablesDto) {
    const { page = 1, limit = 50, search, status, contactId, branchId, startDate, endDate } = query;

    // Build where clause
    const where: Prisma.AccountPayableWhereInput = {
      isDeleted: false,
    };

    // Apply branch filter
    applyBranchFilter(user, where, branchId);

    // Apply status filter
    if (status) {
      where.status = status;
    }

    // Apply contact filter
    if (contactId) {
      where.contactId = contactId;
    }

    // Apply date range filter
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Apply search filter
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { contact: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count
    const total = await this.prisma.accountPayable.count({ where });

    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Get payables
    const payables = await this.prisma.accountPayable.findMany({
      where,
      include: {
        contact: {
          select: CONTACT_SELECT,
        },
        branch: {
          select: BRANCH_SELECT,
        },
        creator: {
          select: USER_SELECT,
        },
      },
      orderBy: {
        date: 'desc',
      },
      skip,
      take: limit,
    });

    return {
      data: payables,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Find one payable by ID
   * Branch filtering: accountants can only view their branch payables
   */
  async findOne(id: string, user: RequestUser): Promise<PayableWithPayments> {
    const where: Prisma.AccountPayableWhereInput = {
      id,
      isDeleted: false,
    };

    // Apply branch filter
    applyBranchFilter(user, where);

    const payable = await this.prisma.accountPayable.findFirst({
      where,
      include: {
        contact: {
          select: CONTACT_SELECT,
        },
        branch: {
          select: BRANCH_SELECT,
        },
        creator: {
          select: USER_SELECT,
        },
        payments: {
          where: { isDeleted: false },
          orderBy: { paymentDate: 'desc' },
          include: {
            recorder: {
              select: USER_SELECT,
            },
          },
        },
      },
    });

    if (!payable) {
      throw new NotFoundException(ERROR_MESSAGES.PAYABLE.NOT_FOUND);
    }

    return payable;
  }

  /**
   * Update a payable
   * Branch filtering: accountants can only update their branch payables
   * Note: Cannot update amounts or contact after creation
   */
  async update(
    id: string,
    updatePayableDto: UpdatePayableDto,
    user: RequestUser,
  ): Promise<PayableWithRelations> {
    // Find the payable first (with branch filtering)
    const existingPayable = await this.findOne(id, user);

    // Prevent updating core financial fields
    if (updatePayableDto.amount !== undefined) {
      throw new BadRequestException('Cannot update payable amount after creation');
    }
    if (updatePayableDto.contactId !== undefined) {
      throw new BadRequestException('Cannot update payable contact after creation');
    }

    // Validate due date if provided
    if (updatePayableDto.dueDate) {
      const date = updatePayableDto.date
        ? new Date(updatePayableDto.date)
        : existingPayable.date;
      const dueDate = new Date(updatePayableDto.dueDate);
      if (dueDate < date) {
        throw new BadRequestException(ERROR_MESSAGES.PAYABLE.DUE_DATE_INVALID);
      }
    }

    // Update the payable
    const updatedPayable = await this.prisma.accountPayable.update({
      where: { id },
      data: {
        date: updatePayableDto.date ? new Date(updatePayableDto.date) : undefined,
        dueDate: updatePayableDto.dueDate ? new Date(updatePayableDto.dueDate) : undefined,
        description: updatePayableDto.description,
        invoiceNumber: updatePayableDto.invoiceNumber,
        notes: updatePayableDto.notes,
        status: updatePayableDto.status,
      },
      include: {
        contact: {
          select: CONTACT_SELECT,
        },
        branch: {
          select: BRANCH_SELECT,
        },
        creator: {
          select: USER_SELECT,
        },
      },
    });

    // Audit log
    await this.auditLogService.logUpdate(
      user.id,
      AuditEntityType.PAYABLE,
      id,
      {
        status: existingPayable.status,
        description: existingPayable.description,
      },
      {
        status: updatedPayable.status,
        description: updatedPayable.description,
      },
    );

    return updatedPayable;
  }

  /**
   * Soft delete a payable
   * Branch filtering: accountants can only delete their branch payables
   * Validates: no payments have been made
   */
  async remove(id: string, user: RequestUser): Promise<{ message: string }> {
    // Find the payable first (with branch filtering)
    const payable = await this.findOne(id, user);

    // Check if any payments have been made
    if (payable.payments.length > 0) {
      throw new BadRequestException(
        'Cannot delete payable with existing payments. Delete payments first.',
      );
    }

    // Soft delete the payable
    await this.prisma.accountPayable.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: user.id,
        isDeleted: true,
      },
    });

    // Audit log
    await this.auditLogService.logDelete(user.id, AuditEntityType.PAYABLE, id, {
      contactId: payable.contactId,
      amount: payable.originalAmount,
    });

    return { message: 'Payable deleted successfully' };
  }

  /**
   * Make a payment on a payable
   * Branch filtering: accountants can only pay their branch payables
   * Creates a transaction record and updates payable status
   */
  async payPayable(id: string, payPayableDto: PayPayableDto, user: RequestUser) {
    // Verify user has branch access for payments
    if (user.role === UserRole.ACCOUNTANT && !user.branchId) {
      throw new BadRequestException(ERROR_MESSAGES.PAYABLE.BRANCH_REQUIRED_PAY);
    }

    // Find the payable (with branch filtering)
    const payable = await this.findOne(id, user);

    // Validate payment amount
    if (payPayableDto.amountPaid > Number(payable.remainingAmount)) {
      throw new BadRequestException(
        ERROR_MESSAGES.PAYABLE.PAYMENT_EXCEEDS_REMAINING(
          payPayableDto.amountPaid,
          Number(payable.remainingAmount),
        ),
      );
    }

    // Calculate new remaining amount and status
    const newRemainingAmount = Number(payable.remainingAmount) - payPayableDto.amountPaid;
    const newStatus =
      newRemainingAmount === 0
        ? DebtStatus.PAID
        : payPayableDto.amountPaid > 0
          ? DebtStatus.PARTIAL
          : payable.status;

    // Use transaction to ensure consistency
    const result = await this.prisma.$transaction(async (prisma) => {
      // Create payment record
      const payment = await prisma.payablePayment.create({
        data: {
          payableId: id,
          amountPaid: payPayableDto.amountPaid,
          paymentDate: new Date(payPayableDto.paymentDate),
          paymentMethod: payPayableDto.paymentMethod,
          notes: payPayableDto.notes,
          recordedBy: user.id,
          isDeleted: false,
        },
      });

      // Update payable
      const updatedPayable = await prisma.accountPayable.update({
        where: { id },
        data: {
          remainingAmount: newRemainingAmount,
          status: newStatus,
        },
        include: {
          contact: {
            select: CONTACT_SELECT,
          },
          branch: {
            select: BRANCH_SELECT,
          },
          creator: {
            select: USER_SELECT,
          },
        },
      });

      // Create transaction record
      const transaction = await prisma.transaction.create({
        data: {
          type: TransactionType.EXPENSE,
          amount: payPayableDto.amountPaid,
          date: new Date(payPayableDto.paymentDate),
          category: 'دفع حسابات دائنة',
          paymentMethod: payPayableDto.paymentMethod,
          notes: payPayableDto.notes ? `${payPayableDto.notes}` : `دفعة حساب دائن - ${payable.contact.name}`,
          branchId: payable.branchId,
          contactId: payable.contactId,
          linkedPayableId: id,
          createdBy: user.id,
          isDeleted: false,
        },
      });

      return { payment, updatedPayable, transaction };
    });

    // Audit log
    await this.auditLogService.logCreate(
      user.id,
      AuditEntityType.PAYABLE_PAYMENT,
      result.payment.id,
      {
        payableId: id,
        amountPaid: payPayableDto.amountPaid,
        paymentDate: payPayableDto.paymentDate,
      },
    );

    return result;
  }

  /**
   * Get payables summary statistics
   * Branch filtering: accountants see only their branch stats
   */
  async getSummary(user: RequestUser, branchId?: string) {
    const where: Prisma.AccountPayableWhereInput = {
      isDeleted: false,
    };

    // Apply branch filter
    applyBranchFilter(user, where, branchId);

    const [total, pending, partial, paid, totalAmount, remainingAmount] = await Promise.all([
      this.prisma.accountPayable.count({ where }),
      this.prisma.accountPayable.count({ where: { ...where, status: DebtStatus.ACTIVE } }),
      this.prisma.accountPayable.count({ where: { ...where, status: DebtStatus.PARTIAL } }),
      this.prisma.accountPayable.count({ where: { ...where, status: DebtStatus.PAID } }),
      this.prisma.accountPayable.aggregate({
        where,
        _sum: { originalAmount: true },
      }),
      this.prisma.accountPayable.aggregate({
        where,
        _sum: { remainingAmount: true },
      }),
    ]);

    return {
      total,
      byStatus: {
        pending,
        partial,
        paid,
      },
      amounts: {
        total: Number(totalAmount._sum.originalAmount || 0),
        remaining: Number(remainingAmount._sum.remainingAmount || 0),
        paid: Number(totalAmount._sum.originalAmount || 0) - Number(remainingAmount._sum.remainingAmount || 0),
      },
    };
  }
}
