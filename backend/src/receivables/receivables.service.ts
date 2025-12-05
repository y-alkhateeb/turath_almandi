import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReceivableDto } from './dto/create-receivable.dto';
import { UpdateReceivableDto } from './dto/update-receivable.dto';
import { QueryReceivablesDto } from './dto/query-receivables.dto';
import { CollectReceivableDto } from './dto/collect-receivable.dto';
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

// Type for receivable with relations
type ReceivableWithRelations = Prisma.AccountReceivableGetPayload<{
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

// Type for receivable with payments
type ReceivableWithPayments = Prisma.AccountReceivableGetPayload<{
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
export class ReceivablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Create a new receivable
   * Branch filtering: accountants can only create receivables for their branch
   * Validates: contact exists and belongs to the same branch (if applicable)
   */
  async create(createReceivableDto: CreateReceivableDto, user: RequestUser): Promise<ReceivableWithRelations> {
    // Determine branch ID
    let branchId: string | null = null;

    if (user.role === UserRole.ACCOUNTANT) {
      if (!user.branchId) {
        throw new BadRequestException(ERROR_MESSAGES.RECEIVABLE.BRANCH_REQUIRED_CREATE);
      }
      branchId = user.branchId;
    } else {
      // Admins can optionally specify a branch
      branchId = createReceivableDto.branchId || null;
    }

    // Validate contact exists and has access
    const contact = await this.prisma.contact.findFirst({
      where: {
        id: createReceivableDto.contactId,
        isDeleted: false,
        ...(branchId ? { branchId } : {}),
      },
    });

    if (!contact) {
      throw new NotFoundException(ERROR_MESSAGES.CONTACT.NOT_FOUND);
    }

    // Validate due date if provided
    if (createReceivableDto.dueDate) {
      const date = new Date(createReceivableDto.date);
      const dueDate = new Date(createReceivableDto.dueDate);
      if (dueDate < date) {
        throw new BadRequestException(ERROR_MESSAGES.RECEIVABLE.DUE_DATE_INVALID);
      }
    }

    // Create the receivable
    const receivable = await this.prisma.accountReceivable.create({
      data: {
        contactId: createReceivableDto.contactId,
        originalAmount: createReceivableDto.amount,
        remainingAmount: createReceivableDto.amount,
        date: new Date(createReceivableDto.date),
        dueDate: createReceivableDto.dueDate ? new Date(createReceivableDto.dueDate) : null,
        description: createReceivableDto.description,
        invoiceNumber: createReceivableDto.invoiceNumber,
        notes: createReceivableDto.notes,
        status: DebtStatus.ACTIVE,
        branchId,
        linkedSaleTransactionId: createReceivableDto.linkedSaleTransactionId,
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
      AuditEntityType.RECEIVABLE,
      receivable.id,
      {
        contactId: receivable.contactId,
        amount: receivable.originalAmount,
        date: receivable.date,
        branchId: receivable.branchId,
      },
    );

    return receivable;
  }

  /**
   * Find all receivables with pagination and filtering
   * Branch filtering: accountants see only their branch receivables
   */
  async findAll(user: RequestUser, query: QueryReceivablesDto) {
    const { page = 1, limit = 50, search, status, contactId, branchId, startDate, endDate } = query;

    // Build where clause
    const where: Prisma.AccountReceivableWhereInput = {
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
    const total = await this.prisma.accountReceivable.count({ where });

    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Get receivables
    const receivables = await this.prisma.accountReceivable.findMany({
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
      data: receivables,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Find one receivable by ID
   * Branch filtering: accountants can only view their branch receivables
   */
  async findOne(id: string, user: RequestUser): Promise<ReceivableWithPayments> {
    const where: Prisma.AccountReceivableWhereInput = {
      id,
      isDeleted: false,
    };

    // Apply branch filter
    applyBranchFilter(user, where);

    const receivable = await this.prisma.accountReceivable.findFirst({
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

    if (!receivable) {
      throw new NotFoundException(ERROR_MESSAGES.RECEIVABLE.NOT_FOUND);
    }

    return receivable;
  }

  /**
   * Update a receivable
   * Branch filtering: accountants can only update their branch receivables
   * Note: Cannot update amounts or contact after creation
   */
  async update(
    id: string,
    updateReceivableDto: UpdateReceivableDto,
    user: RequestUser,
  ): Promise<ReceivableWithRelations> {
    // Find the receivable first (with branch filtering)
    const existingReceivable = await this.findOne(id, user);

    // Prevent updating core financial fields
    if (updateReceivableDto.amount !== undefined) {
      throw new BadRequestException('Cannot update receivable amount after creation');
    }
    if (updateReceivableDto.contactId !== undefined) {
      throw new BadRequestException('Cannot update receivable contact after creation');
    }

    // Validate due date if provided
    if (updateReceivableDto.dueDate) {
      const date = updateReceivableDto.date
        ? new Date(updateReceivableDto.date)
        : existingReceivable.date;
      const dueDate = new Date(updateReceivableDto.dueDate);
      if (dueDate < date) {
        throw new BadRequestException(ERROR_MESSAGES.RECEIVABLE.DUE_DATE_INVALID);
      }
    }

    // Update the receivable
    const updatedReceivable = await this.prisma.accountReceivable.update({
      where: { id },
      data: {
        date: updateReceivableDto.date ? new Date(updateReceivableDto.date) : undefined,
        dueDate: updateReceivableDto.dueDate ? new Date(updateReceivableDto.dueDate) : undefined,
        description: updateReceivableDto.description,
        invoiceNumber: updateReceivableDto.invoiceNumber,
        notes: updateReceivableDto.notes,
        status: updateReceivableDto.status,
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
      AuditEntityType.RECEIVABLE,
      id,
      {
        status: existingReceivable.status,
        description: existingReceivable.description,
      },
      {
        status: updatedReceivable.status,
        description: updatedReceivable.description,
      },
    );

    return updatedReceivable;
  }

  /**
   * Soft delete a receivable
   * Branch filtering: accountants can only delete their branch receivables
   * Validates: no payments have been collected
   */
  async remove(id: string, user: RequestUser): Promise<{ message: string }> {
    // Find the receivable first (with branch filtering)
    const receivable = await this.findOne(id, user);

    // Check if any payments have been collected
    if (receivable.payments.length > 0) {
      throw new BadRequestException(
        'Cannot delete receivable with existing payments. Delete payments first.',
      );
    }

    // Soft delete the receivable
    await this.prisma.accountReceivable.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: user.id,
        isDeleted: true,
      },
    });

    // Audit log
    await this.auditLogService.logDelete(user.id, AuditEntityType.RECEIVABLE, id, {
      contactId: receivable.contactId,
      amount: receivable.originalAmount,
    });

    return { message: 'Receivable deleted successfully' };
  }

  /**
   * Collect a payment on a receivable
   * Branch filtering: accountants can only collect from their branch receivables
   * Creates a transaction record and updates receivable status
   */
  async collectReceivable(id: string, collectReceivableDto: CollectReceivableDto, user: RequestUser) {
    // Verify user has branch access for collections
    if (user.role === UserRole.ACCOUNTANT && !user.branchId) {
      throw new BadRequestException(ERROR_MESSAGES.RECEIVABLE.BRANCH_REQUIRED_PAY);
    }

    // Find the receivable (with branch filtering)
    const receivable = await this.findOne(id, user);

    // Validate payment amount
    if (collectReceivableDto.amountPaid > Number(receivable.remainingAmount)) {
      throw new BadRequestException(
        ERROR_MESSAGES.RECEIVABLE.PAYMENT_EXCEEDS_REMAINING(
          collectReceivableDto.amountPaid,
          Number(receivable.remainingAmount),
        ),
      );
    }

    // Calculate new remaining amount and status
    const newRemainingAmount = Number(receivable.remainingAmount) - collectReceivableDto.amountPaid;
    const newStatus =
      newRemainingAmount === 0
        ? DebtStatus.PAID
        : collectReceivableDto.amountPaid > 0
          ? DebtStatus.PARTIAL
          : receivable.status;

    // Use transaction to ensure consistency
    const result = await this.prisma.$transaction(async (prisma) => {
      // Create payment record
      const payment = await prisma.receivablePayment.create({
        data: {
          receivableId: id,
          amountPaid: collectReceivableDto.amountPaid,
          paymentDate: new Date(collectReceivableDto.paymentDate),
          paymentMethod: collectReceivableDto.paymentMethod,
          notes: collectReceivableDto.notes,
          recordedBy: user.id,
          isDeleted: false,
        },
      });

      // Update receivable
      const updatedReceivable = await prisma.accountReceivable.update({
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
          type: TransactionType.INCOME,
          amount: collectReceivableDto.amountPaid,
          date: new Date(collectReceivableDto.paymentDate),
          category: 'تحصيل حسابات مدينة',
          paymentMethod: collectReceivableDto.paymentMethod,
          notes: collectReceivableDto.notes ? `${collectReceivableDto.notes}` : `تحصيل حساب مدين - ${receivable.contact.name}`,
          branchId: receivable.branchId,
          contactId: receivable.contactId,
          linkedReceivableId: id,
          createdBy: user.id,
          isDeleted: false,
        },
      });

      return { payment, updatedReceivable, transaction };
    });

    // Audit log
    await this.auditLogService.logCreate(
      user.id,
      AuditEntityType.RECEIVABLE_PAYMENT,
      result.payment.id,
      {
        receivableId: id,
        amountPaid: collectReceivableDto.amountPaid,
        paymentDate: collectReceivableDto.paymentDate,
      },
    );

    return result;
  }

  /**
   * Get receivables summary statistics
   * Branch filtering: accountants see only their branch stats
   */
  async getSummary(user: RequestUser, branchId?: string) {
    const where: Prisma.AccountReceivableWhereInput = {
      isDeleted: false,
    };

    // Apply branch filter
    applyBranchFilter(user, where, branchId);

    const [total, pending, partial, paid, totalAmount, remainingAmount] = await Promise.all([
      this.prisma.accountReceivable.count({ where }),
      this.prisma.accountReceivable.count({ where: { ...where, status: DebtStatus.ACTIVE } }),
      this.prisma.accountReceivable.count({ where: { ...where, status: DebtStatus.PARTIAL } }),
      this.prisma.accountReceivable.count({ where: { ...where, status: DebtStatus.PAID } }),
      this.prisma.accountReceivable.aggregate({
        where,
        _sum: { originalAmount: true },
      }),
      this.prisma.accountReceivable.aggregate({
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
        collected: Number(totalAmount._sum.originalAmount || 0) - Number(remainingAmount._sum.remainingAmount || 0),
      },
    };
  }
}
