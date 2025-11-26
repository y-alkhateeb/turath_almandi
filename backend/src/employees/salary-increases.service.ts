import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecordSalaryIncreaseDto } from './dto/record-salary-increase.dto';
import { UserRole, Prisma } from '@prisma/client';
import { AuditLogService, AuditEntityType } from '../common/audit-log/audit-log.service';
import { USER_SELECT } from '../common/constants/prisma-includes';
import { formatDateForDB } from '../common/utils/date.utils';
import { ERROR_MESSAGES } from '../common/constants/error-messages';
import { RequestUser } from '../common/interfaces';

// Type for salary increase with relations
type SalaryIncreaseWithRelations = Prisma.SalaryIncreaseGetPayload<{
  include: {
    employee: {
      include: {
        branch: true;
      };
    };
    recorder: {
      select: typeof USER_SELECT;
    };
  };
}>;

@Injectable()
export class SalaryIncreasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Record salary increase and update employee's baseSalary
   * Uses Prisma transaction for atomicity
   */
  async record(
    employeeId: string,
    recordSalaryIncreaseDto: RecordSalaryIncreaseDto,
    user: RequestUser,
  ): Promise<SalaryIncreaseWithRelations> {
    // Validate new salary is positive
    if (recordSalaryIncreaseDto.newSalary <= 0) {
      throw new BadRequestException(ERROR_MESSAGES.SALARY_INCREASE.NEW_SALARY_POSITIVE);
    }

    // Fetch employee
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId, deletedAt: null },
      include: {
        branch: true,
      },
    });

    if (!employee) {
      throw new NotFoundException(ERROR_MESSAGES.SALARY_INCREASE.EMPLOYEE_NOT_FOUND);
    }

    // Check branch access for accountants
    if (user.role === UserRole.ACCOUNTANT) {
      if (employee.branchId !== user.branchId) {
        throw new ForbiddenException(ERROR_MESSAGES.PERMISSION.BRANCH_ACCESS);
      }
    }

    const oldSalary = Number(employee.baseSalary);
    const newSalary = recordSalaryIncreaseDto.newSalary;

    // Validate new salary is not less than old salary
    if (newSalary < oldSalary) {
      throw new BadRequestException(ERROR_MESSAGES.SALARY_INCREASE.NEW_SALARY_LESS_THAN_OLD);
    }

    const increaseAmount = newSalary - oldSalary;

    // Use Prisma transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (prisma) => {
      // Update employee's base salary
      await prisma.employee.update({
        where: { id: employeeId },
        data: {
          baseSalary: newSalary,
        },
      });

      // Create salary increase record
      const salaryIncrease = await prisma.salaryIncrease.create({
        data: {
          employeeId: employee.id,
          oldSalary: oldSalary,
          newSalary: newSalary,
          increaseAmount: increaseAmount,
          effectiveDate: formatDateForDB(recordSalaryIncreaseDto.effectiveDate),
          reason: recordSalaryIncreaseDto.reason || null,
          recordedBy: user.id,
        },
        include: {
          employee: {
            include: {
              branch: true,
            },
          },
          recorder: {
            select: USER_SELECT,
          },
        },
      });

      return salaryIncrease;
    });

    // Log the creation in audit log
    await this.auditLogService.logCreate(
      user.id,
      AuditEntityType.SALARY_INCREASE,
      result.id,
      result,
    );

    return result;
  }

  /**
   * Find salary increases by employee
   */
  async findByEmployee(
    employeeId: string,
    user: RequestUser,
  ): Promise<SalaryIncreaseWithRelations[]> {
    // Fetch employee to check access
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId, deletedAt: null },
    });

    if (!employee) {
      throw new NotFoundException(ERROR_MESSAGES.SALARY_INCREASE.EMPLOYEE_NOT_FOUND);
    }

    // Check branch access for accountants
    if (user.role === UserRole.ACCOUNTANT) {
      if (employee.branchId !== user.branchId) {
        throw new ForbiddenException(ERROR_MESSAGES.PERMISSION.BRANCH_ACCESS);
      }
    }

    return await this.prisma.salaryIncrease.findMany({
      where: {
        employeeId,
      },
      orderBy: { effectiveDate: 'desc' },
      include: {
        employee: {
          include: {
            branch: true,
          },
        },
        recorder: {
          select: USER_SELECT,
        },
      },
    });
  }

  /**
   * Get recent salary increases for branch
   */
  async getRecentIncreases(
    branchId: string,
    limit: number = 10,
    user: RequestUser,
  ): Promise<SalaryIncreaseWithRelations[]> {
    // Check branch access for accountants
    if (user.role === UserRole.ACCOUNTANT) {
      if (branchId !== user.branchId) {
        throw new ForbiddenException(ERROR_MESSAGES.PERMISSION.BRANCH_ACCESS);
      }
    }

    return await this.prisma.salaryIncrease.findMany({
      where: {
        employee: {
          branchId,
          deletedAt: null,
        },
      },
      orderBy: { effectiveDate: 'desc' },
      take: limit,
      include: {
        employee: {
          include: {
            branch: true,
          },
        },
        recorder: {
          select: USER_SELECT,
        },
      },
    });
  }
}
