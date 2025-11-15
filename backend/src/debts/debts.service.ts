import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UserRole, DebtStatus } from '@prisma/client';
import { AuditLogService, AuditEntityType } from '../common/audit-log/audit-log.service';

interface RequestUser {
  id: string;
  username: string;
  role: UserRole;
  branchId: string | null;
}

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
  async create(createDebtDto: CreateDebtDto, user: RequestUser) {
    // Validate user has a branch assigned
    if (!user.branchId) {
      throw new ForbiddenException('User must be assigned to a branch to create debts');
    }

    // Validate amount is positive
    if (createDebtDto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Validate due_date >= date
    const date = new Date(createDebtDto.date);
    const dueDate = new Date(createDebtDto.dueDate);

    if (dueDate < date) {
      throw new BadRequestException('Due date must be greater than or equal to date');
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
      branchId: user.branchId, // Auto-fill from logged user's branch
      createdBy: user.id,
    };

    const debt = await this.prisma.debt.create({
      data: debtData,
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
      },
    });

    // Log the creation in audit log
    await this.auditLogService.logCreate(
      user.id,
      AuditEntityType.DEBT,
      debt.id,
      debt,
    );

    return debt;
  }

  /**
   * Find all debts with filtering by branch
   * Accountants can only see debts from their branch
   * Admins can see all debts
   */
  async findAll(user: RequestUser) {
    // Build where clause based on user role
    const where: any = {};

    // Role-based access control
    if (user.role === UserRole.ACCOUNTANT) {
      // Accountants can only see debts from their branch
      if (!user.branchId) {
        throw new ForbiddenException('Accountant must be assigned to a branch');
      }
      where.branchId = user.branchId;
    }

    // Get debts
    const debts = await this.prisma.debt.findMany({
      where,
      orderBy: { dueDate: 'asc' },
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
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    return debts;
  }
}
