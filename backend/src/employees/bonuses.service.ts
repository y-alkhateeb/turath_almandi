import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBonusDto } from './dto/create-bonus.dto';
import { Prisma } from '@prisma/client';
import { TransactionType, UserRole } from '../common/types/prisma-enums';
import { AuditLogService, AuditEntityType } from '../common/audit-log/audit-log.service';
import { USER_SELECT } from '../common/constants/prisma-includes';
import { formatDateForDB, getStartOfDay, getEndOfDay } from '../common/utils/date.utils';
import { ERROR_MESSAGES } from '../common/constants/error-messages';
import { RequestUser } from '../common/interfaces';

interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

// Type for bonus with relations
type BonusWithRelations = Prisma.BonusGetPayload<{
  include: {
    employee: {
      include: {
        branch: true;
      };
    };
    transaction: true;
    recorder: {
      select: typeof USER_SELECT;
    };
  };
}>;

interface BonusSummary {
  totalBonuses: number;
  count: number;
  breakdown: Array<{
    employeeId: string;
    employeeName: string;
    totalAmount: number;
    bonusCount: number;
  }>;
}

@Injectable()
export class BonusesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Create bonus and automatically create linked transaction
   * Uses Prisma transaction for atomicity
   */
  async create(
    employeeId: string,
    createBonusDto: CreateBonusDto,
    user: RequestUser,
  ): Promise<BonusWithRelations> {
    // Validate amount is positive
    if (createBonusDto.amount <= 0) {
      throw new BadRequestException(ERROR_MESSAGES.BONUS.AMOUNT_POSITIVE);
    }

    // Fetch employee with branch
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId, deletedAt: null },
      include: {
        branch: true,
      },
    });

    if (!employee) {
      throw new NotFoundException(ERROR_MESSAGES.BONUS.EMPLOYEE_NOT_FOUND);
    }

    // Check branch access for accountants
    if (user.role === UserRole.ACCOUNTANT) {
      if (employee.branchId !== user.branchId) {
        throw new ForbiddenException(ERROR_MESSAGES.PERMISSION.BRANCH_ACCESS);
      }
    }

    // Use Prisma transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (prisma) => {
      // Create transaction record for bonus
      const transaction = await prisma.transaction.create({
        data: {
          type: TransactionType.EXPENSE,
          amount: createBonusDto.amount,
          paymentMethod: null, // Bonuses don't have payment method
          category: 'bonuses',
          date: formatDateForDB(createBonusDto.bonusDate),
          employeeVendorName: employee.name,
          notes: createBonusDto.reason
            ? `مكافأة ${employee.position}: ${createBonusDto.reason}`
            : `مكافأة ${employee.position}`,
          branchId: employee.branchId,
          createdBy: user.id,
        },
      });

      // Create bonus record
      const bonus = await prisma.bonus.create({
        data: {
          employeeId: employee.id,
          amount: createBonusDto.amount,
          bonusDate: formatDateForDB(createBonusDto.bonusDate),
          reason: createBonusDto.reason || null,
          transactionId: transaction.id,
          recordedBy: user.id,
        },
        include: {
          employee: {
            include: {
              branch: true,
            },
          },
          transaction: true,
          recorder: {
            select: USER_SELECT,
          },
        },
      });

      return bonus;
    });

    // Log the creation in audit log
    await this.auditLogService.logCreate(
      user.id,
      AuditEntityType.BONUS,
      result.id,
      result,
    );

    return result;
  }

  /**
   * Find bonuses by employee
   */
  async findByEmployee(
    employeeId: string,
    filters: DateRangeFilter = {},
    user: RequestUser,
  ): Promise<BonusWithRelations[]> {
    // Fetch employee to check access
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId, deletedAt: null },
    });

    if (!employee) {
      throw new NotFoundException(ERROR_MESSAGES.BONUS.EMPLOYEE_NOT_FOUND);
    }

    // Check branch access for accountants
    if (user.role === UserRole.ACCOUNTANT) {
      if (employee.branchId !== user.branchId) {
        throw new ForbiddenException(ERROR_MESSAGES.PERMISSION.BRANCH_ACCESS);
      }
    }

    // Build where clause
    const where: Prisma.BonusWhereInput = {
      employeeId,
      deletedAt: null,
    };

    // Apply date range filter
    if (filters.startDate || filters.endDate) {
      where.bonusDate = {};
      if (filters.startDate) {
        where.bonusDate.gte = getStartOfDay(new Date(filters.startDate));
      }
      if (filters.endDate) {
        where.bonusDate.lte = getEndOfDay(new Date(filters.endDate));
      }
    }

    return await this.prisma.bonus.findMany({
      where,
      orderBy: { bonusDate: 'desc' },
      include: {
        employee: {
          include: {
            branch: true,
          },
        },
        transaction: true,
        recorder: {
          select: USER_SELECT,
        },
      },
    });
  }

  /**
   * Find bonuses by branch
   */
  async findByBranch(
    branchId: string,
    dateRange: DateRangeFilter,
    user: RequestUser,
  ): Promise<BonusWithRelations[]> {
    // Check branch access for accountants
    if (user.role === UserRole.ACCOUNTANT) {
      if (branchId !== user.branchId) {
        throw new ForbiddenException(ERROR_MESSAGES.PERMISSION.BRANCH_ACCESS);
      }
    }

    // Build where clause
    const where: Prisma.BonusWhereInput = {
      employee: {
        branchId,
        deletedAt: null,
      },
      deletedAt: null,
    };

    // Apply date range filter
    if (dateRange.startDate || dateRange.endDate) {
      where.bonusDate = {};
      if (dateRange.startDate) {
        where.bonusDate.gte = getStartOfDay(new Date(dateRange.startDate));
      }
      if (dateRange.endDate) {
        where.bonusDate.lte = getEndOfDay(new Date(dateRange.endDate));
      }
    }

    return await this.prisma.bonus.findMany({
      where,
      orderBy: { bonusDate: 'desc' },
      include: {
        employee: {
          include: {
            branch: true,
          },
        },
        transaction: true,
        recorder: {
          select: USER_SELECT,
        },
      },
    });
  }

  /**
   * Get bonus summary for branch
   */
  async getSummary(
    branchId: string,
    dateRange: DateRangeFilter,
    user: RequestUser,
  ): Promise<BonusSummary> {
    // Check branch access for accountants
    if (user.role === UserRole.ACCOUNTANT) {
      if (branchId !== user.branchId) {
        throw new ForbiddenException(ERROR_MESSAGES.PERMISSION.BRANCH_ACCESS);
      }
    }

    // Build where clause
    const where: Prisma.BonusWhereInput = {
      employee: {
        branchId,
        deletedAt: null,
      },
      deletedAt: null,
    };

    // Apply date range filter
    if (dateRange.startDate || dateRange.endDate) {
      where.bonusDate = {};
      if (dateRange.startDate) {
        where.bonusDate.gte = getStartOfDay(new Date(dateRange.startDate));
      }
      if (dateRange.endDate) {
        where.bonusDate.lte = getEndOfDay(new Date(dateRange.endDate));
      }
    }

    // Fetch all bonuses
    const bonuses = await this.prisma.bonus.findMany({
      where,
      include: {
        employee: true,
      },
    });

    // Calculate summary
    const totalBonuses = bonuses.reduce((sum, bonus) => sum + Number(bonus.amount), 0);
    const count = bonuses.length;

    // Group by employee
    const employeeMap = new Map<string, { name: string; total: number; count: number }>();

    bonuses.forEach((bonus) => {
      const existing = employeeMap.get(bonus.employeeId);
      if (existing) {
        existing.total += Number(bonus.amount);
        existing.count += 1;
      } else {
        employeeMap.set(bonus.employeeId, {
          name: bonus.employee.name,
          total: Number(bonus.amount),
          count: 1,
        });
      }
    });

    // Convert to array
    const breakdown = Array.from(employeeMap.entries()).map(([employeeId, data]) => ({
      employeeId,
      employeeName: data.name,
      totalAmount: data.total,
      bonusCount: data.count,
    }));

    return {
      totalBonuses,
      count,
      breakdown,
    };
  }

  /**
   * Soft delete bonus
   */
  async remove(id: string, user: RequestUser): Promise<void> {
    // Fetch existing bonus
    const bonus = await this.prisma.bonus.findUnique({
      where: { id, deletedAt: null },
      include: {
        employee: true,
      },
    });

    if (!bonus) {
      throw new NotFoundException(ERROR_MESSAGES.BONUS.NOT_FOUND);
    }

    // Check branch access for accountants
    if (user.role === UserRole.ACCOUNTANT) {
      if (bonus.employee.branchId !== user.branchId) {
        throw new ForbiddenException(ERROR_MESSAGES.PERMISSION.BRANCH_ACCESS);
      }
    }

    // Soft delete using transaction to also mark the linked transaction as deleted
    await this.prisma.$transaction(async (prisma) => {
      // Soft delete bonus
      await prisma.bonus.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Soft delete linked transaction if exists
      if (bonus.transactionId) {
        await prisma.transaction.update({
          where: { id: bonus.transactionId },
          data: { deletedAt: new Date() },
        });
      }
    });

    // Log the deletion in audit log
    await this.auditLogService.logDelete(user.id, AuditEntityType.BONUS, id, bonus);
  }
}
