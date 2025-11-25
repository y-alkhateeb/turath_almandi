import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdvanceDto } from './dto/create-advance.dto';
import { RecordDeductionDto } from './dto/record-deduction.dto';
import { AdvanceStatus, UserRole, Prisma } from '@prisma/client';
import { AuditLogService, AuditEntityType } from '../common/audit-log/audit-log.service';
import { formatDateForDB } from '../common/utils/date.utils';
import { ERROR_MESSAGES } from '../common/constants/error-messages';
import { USER_SELECT } from '../common/constants/prisma-includes';

interface RequestUser {
  id: string;
  username: string;
  role: UserRole;
  branchId: string | null;
}

@Injectable()
export class AdvancesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * إنشاء سلفة جديدة للموظف
   */
  async createAdvance(dto: CreateAdvanceDto, user: RequestUser) {
    // التحقق من وجود الموظف
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId, deletedAt: null },
      include: {
        advances: {
          where: { status: AdvanceStatus.ACTIVE, deletedAt: null },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(ERROR_MESSAGES.EMPLOYEE.NOT_FOUND);
    }

    // التحقق من صلاحية الوصول للفرع
    if (user.role === UserRole.ACCOUNTANT && employee.branchId !== user.branchId) {
      throw new ForbiddenException(ERROR_MESSAGES.PERMISSION.BRANCH_ACCESS);
    }

    // حساب إجمالي السلفات النشطة
    const totalActiveAdvances = employee.advances.reduce(
      (sum, adv) => sum + Number(adv.remainingAmount),
      0,
    );

    // الراتب الكلي = الراتب الأساسي + البدل
    const totalSalary = Number(employee.baseSalary) + Number(employee.allowance);

    // التحقق من أن السلفة الجديدة + السلفات النشطة لا تتجاوز راتبين
    const newTotalAdvances = totalActiveAdvances + dto.amount;
    const twoMonthsSalary = totalSalary * 2;

    // تنبيه إذا كانت السلفة الإجمالية تتجاوز راتب شهرين
    let warning: string | null = null;
    if (newTotalAdvances > twoMonthsSalary) {
      warning = `تنبيه: إجمالي السلفات (${newTotalAdvances.toFixed(2)}) يتجاوز راتب شهرين (${twoMonthsSalary.toFixed(2)})`;
    }

    // إنشاء السلفة
    const advance = await this.prisma.employeeAdvance.create({
      data: {
        employeeId: dto.employeeId,
        amount: dto.amount,
        remainingAmount: dto.amount, // المبلغ المتبقي = المبلغ الكامل عند الإنشاء
        monthlyDeduction: dto.monthlyDeduction,
        advanceDate: formatDateForDB(dto.advanceDate),
        reason: dto.reason,
        status: AdvanceStatus.ACTIVE,
        recordedBy: user.id,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            baseSalary: true,
            allowance: true,
          },
        },
        recorder: {
          select: USER_SELECT,
        },
        deductions: true,
      },
    });

    // تسجيل في سجل التدقيق
    await this.auditLogService.logCreate(
      user.id,
      AuditEntityType.ADVANCE,
      advance.id,
      advance,
    );

    return {
      ...advance,
      warning,
      totalActiveAdvances: newTotalAdvances,
      twoMonthsSalary,
      salaryMonthsEquivalent: (newTotalAdvances / totalSalary).toFixed(2),
    };
  }

  /**
   * الحصول على سلفات موظف معين
   */
  async getEmployeeAdvances(employeeId: string, user: RequestUser) {
    // التحقق من وجود الموظف
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId, deletedAt: null },
    });

    if (!employee) {
      throw new NotFoundException(ERROR_MESSAGES.EMPLOYEE.NOT_FOUND);
    }

    // التحقق من صلاحية الوصول
    if (user.role === UserRole.ACCOUNTANT && employee.branchId !== user.branchId) {
      throw new ForbiddenException(ERROR_MESSAGES.PERMISSION.BRANCH_ACCESS);
    }

    const advances = await this.prisma.employeeAdvance.findMany({
      where: {
        employeeId,
        deletedAt: null,
      },
      orderBy: { advanceDate: 'desc' },
      include: {
        recorder: {
          select: USER_SELECT,
        },
        deductions: {
          orderBy: { deductionDate: 'desc' },
          include: {
            recorder: {
              select: USER_SELECT,
            },
          },
        },
      },
    });

    // حساب ملخص السلفات
    const activeAdvances = advances.filter((a) => a.status === AdvanceStatus.ACTIVE);
    const totalRemaining = activeAdvances.reduce(
      (sum, a) => sum + Number(a.remainingAmount),
      0,
    );
    const totalMonthlyDeduction = activeAdvances.reduce(
      (sum, a) => sum + Number(a.monthlyDeduction),
      0,
    );

    const totalSalary = Number(employee.baseSalary) + Number(employee.allowance);
    const twoMonthsSalary = totalSalary * 2;

    return {
      advances,
      summary: {
        totalActiveAdvances: activeAdvances.length,
        totalRemaining,
        totalMonthlyDeduction,
        netSalaryAfterDeduction: totalSalary - totalMonthlyDeduction,
        salaryMonthsEquivalent: (totalRemaining / totalSalary).toFixed(2),
        exceedsTwoMonths: totalRemaining > twoMonthsSalary,
        twoMonthsSalary,
      },
    };
  }

  /**
   * تسجيل خصم من السلفة
   */
  async recordDeduction(dto: RecordDeductionDto, user: RequestUser) {
    // التحقق من وجود السلفة
    const advance = await this.prisma.employeeAdvance.findUnique({
      where: { id: dto.advanceId, deletedAt: null },
      include: {
        employee: true,
      },
    });

    if (!advance) {
      throw new NotFoundException('السلفة غير موجودة');
    }

    // التحقق من أن السلفة نشطة
    if (advance.status !== AdvanceStatus.ACTIVE) {
      throw new BadRequestException('لا يمكن الخصم من سلفة غير نشطة');
    }

    // التحقق من صلاحية الوصول
    if (user.role === UserRole.ACCOUNTANT && advance.employee.branchId !== user.branchId) {
      throw new ForbiddenException(ERROR_MESSAGES.PERMISSION.BRANCH_ACCESS);
    }

    // التحقق من أن مبلغ الخصم لا يتجاوز المتبقي
    if (dto.amount > Number(advance.remainingAmount)) {
      throw new BadRequestException(
        `مبلغ الخصم (${dto.amount}) يتجاوز المبلغ المتبقي (${advance.remainingAmount})`,
      );
    }

    // حساب المبلغ المتبقي الجديد
    const newRemainingAmount = Number(advance.remainingAmount) - dto.amount;
    const newStatus = newRemainingAmount <= 0 ? AdvanceStatus.PAID : AdvanceStatus.ACTIVE;

    // تنفيذ العمليات في transaction
    const result = await this.prisma.$transaction(async (prisma) => {
      // إنشاء سجل الخصم
      const deduction = await prisma.advanceDeduction.create({
        data: {
          advanceId: dto.advanceId,
          amount: dto.amount,
          deductionDate: formatDateForDB(dto.deductionDate),
          salaryPaymentId: dto.salaryPaymentId,
          notes: dto.notes,
          recordedBy: user.id,
        },
      });

      // تحديث السلفة
      const updatedAdvance = await prisma.employeeAdvance.update({
        where: { id: dto.advanceId },
        data: {
          remainingAmount: newRemainingAmount,
          status: newStatus,
        },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              baseSalary: true,
              allowance: true,
            },
          },
          recorder: {
            select: USER_SELECT,
          },
          deductions: {
            orderBy: { deductionDate: 'desc' },
            include: {
              recorder: {
                select: USER_SELECT,
              },
            },
          },
        },
      });

      return { deduction, advance: updatedAdvance };
    });

    return result;
  }

  /**
   * إلغاء سلفة
   */
  async cancelAdvance(advanceId: string, user: RequestUser) {
    const advance = await this.prisma.employeeAdvance.findUnique({
      where: { id: advanceId, deletedAt: null },
      include: {
        employee: true,
        deductions: true,
      },
    });

    if (!advance) {
      throw new NotFoundException('السلفة غير موجودة');
    }

    // التحقق من صلاحية الوصول
    if (user.role === UserRole.ACCOUNTANT && advance.employee.branchId !== user.branchId) {
      throw new ForbiddenException(ERROR_MESSAGES.PERMISSION.BRANCH_ACCESS);
    }

    // لا يمكن إلغاء سلفة تم خصم جزء منها
    if (advance.deductions.length > 0) {
      throw new BadRequestException(
        'لا يمكن إلغاء سلفة تم خصم جزء منها. يمكنك فقط تسجيل الخصومات حتى اكتمال السداد.',
      );
    }

    const updatedAdvance = await this.prisma.employeeAdvance.update({
      where: { id: advanceId },
      data: {
        status: AdvanceStatus.CANCELLED,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
        recorder: {
          select: USER_SELECT,
        },
      },
    });

    await this.auditLogService.logUpdate(
      user.id,
      AuditEntityType.ADVANCE_CANCELLED,
      advanceId,
      advance,
      updatedAdvance,
    );

    return updatedAdvance;
  }

  /**
   * الحصول على ملخص السلفات لجميع الموظفين في فرع
   */
  async getBranchAdvancesSummary(branchId: string, user: RequestUser) {
    // التحقق من صلاحية الوصول
    if (user.role === UserRole.ACCOUNTANT && branchId !== user.branchId) {
      throw new ForbiddenException(ERROR_MESSAGES.PERMISSION.BRANCH_ACCESS);
    }

    const employees = await this.prisma.employee.findMany({
      where: {
        branchId,
        deletedAt: null,
        status: 'ACTIVE',
      },
      include: {
        advances: {
          where: {
            status: AdvanceStatus.ACTIVE,
            deletedAt: null,
          },
        },
      },
    });

    const summary = employees.map((emp) => {
      const totalRemaining = emp.advances.reduce(
        (sum, a) => sum + Number(a.remainingAmount),
        0,
      );
      const totalMonthlyDeduction = emp.advances.reduce(
        (sum, a) => sum + Number(a.monthlyDeduction),
        0,
      );
      const totalSalary = Number(emp.baseSalary) + Number(emp.allowance);

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        position: emp.position,
        baseSalary: Number(emp.baseSalary),
        allowance: Number(emp.allowance),
        totalSalary,
        activeAdvancesCount: emp.advances.length,
        totalRemaining,
        totalMonthlyDeduction,
        netSalary: totalSalary - totalMonthlyDeduction,
        salaryMonthsEquivalent: totalSalary > 0 ? (totalRemaining / totalSalary).toFixed(2) : '0',
        exceedsTwoMonths: totalRemaining > totalSalary * 2,
      };
    });

    // فقط الموظفين الذين لديهم سلفات نشطة
    const employeesWithAdvances = summary.filter((s) => s.activeAdvancesCount > 0);

    return {
      employees: employeesWithAdvances,
      totals: {
        employeesWithAdvances: employeesWithAdvances.length,
        totalRemainingAdvances: employeesWithAdvances.reduce((sum, e) => sum + e.totalRemaining, 0),
        totalMonthlyDeductions: employeesWithAdvances.reduce(
          (sum, e) => sum + e.totalMonthlyDeduction,
          0,
        ),
      },
    };
  }
}
