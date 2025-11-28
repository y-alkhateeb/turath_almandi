import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSalaryPaymentDto } from './dto/create-salary-payment.dto';
import { Prisma } from '@prisma/client';
import { TransactionType, UserRole, AdvanceStatus } from '../common/types/prisma-enums';
import { AuditLogService, AuditEntityType } from '../common/audit-log/audit-log.service';
import { applyBranchFilter } from '../common/utils/query-builder';
import { USER_SELECT } from '../common/constants/prisma-includes';
import { formatDateForDB, getStartOfDay, getEndOfDay } from '../common/utils/date.utils';
import { ERROR_MESSAGES } from '../common/constants/error-messages';
import { RequestUser } from '../common/interfaces';

interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

// Type for salary payment with relations
type SalaryPaymentWithRelations = Prisma.SalaryPaymentGetPayload<{
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

interface PayrollSummary {
  totalPaid: number;
  count: number;
  breakdown: Array<{
    employeeId: string;
    employeeName: string;
    totalAmount: number;
    paymentCount: number;
  }>;
}

interface AdvanceDeductionInfo {
  advanceId: string;
  deductionAmount: number;
  previousRemaining: number;
  newRemaining: number;
  status: AdvanceStatus;
}

@Injectable()
export class SalaryPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Create salary payment and automatically create linked transaction
   * Automatically deducts active advances from the salary
   * Uses Prisma transaction for atomicity
   */
  async create(
    employeeId: string,
    createSalaryPaymentDto: CreateSalaryPaymentDto,
    user: RequestUser,
  ): Promise<SalaryPaymentWithRelations & {
    fullSalary: number;
    paidAmount: number;
    advanceDeductionAmount: number;
    advanceDeductions?: AdvanceDeductionInfo[];
  }> {
    // Validate amount is positive
    if (createSalaryPaymentDto.amount <= 0) {
      throw new BadRequestException(ERROR_MESSAGES.SALARY_PAYMENT.AMOUNT_POSITIVE);
    }

    // Fetch employee with branch and active advances
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId, deletedAt: null },
      include: {
        branch: true,
        advances: {
          where: {
            status: AdvanceStatus.ACTIVE,
            deletedAt: null,
          },
          orderBy: { advanceDate: 'asc' }, // Pay oldest advances first
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(ERROR_MESSAGES.SALARY_PAYMENT.EMPLOYEE_NOT_FOUND);
    }

    // Check branch access for accountants
    if (user.role === UserRole.ACCOUNTANT) {
      if (employee.branchId !== user.branchId) {
        throw new ForbiddenException(ERROR_MESSAGES.PERMISSION.BRANCH_ACCESS);
      }
    }

    // Calculate employee's full salary
    const fullSalary = Number(employee.baseSalary) + Number(employee.allowance);
    const paidAmount = createSalaryPaymentDto.amount;

    // Calculate advance deduction based on salary difference
    // Deduction = fullSalary - paidAmount (only if paidAmount < fullSalary)
    const activeAdvances = employee.advances;
    let advanceDeductionAmount = 0;

    if (paidAmount < fullSalary) {
      // Calculate deduction only if paid less than full salary
      advanceDeductionAmount = fullSalary - paidAmount;

      // Check if total remaining advances can cover the deduction
      const totalRemainingAdvances = activeAdvances.reduce(
        (sum, adv) => sum + Number(adv.remainingAmount),
        0,
      );

      // Limit deduction to available remaining advances
      if (advanceDeductionAmount > totalRemainingAdvances) {
        advanceDeductionAmount = totalRemainingAdvances;
      }
    }
    // If paidAmount >= fullSalary, no advance deduction (advanceDeductionAmount stays 0)

    // Track deduction info for response
    const advanceDeductionsInfo: AdvanceDeductionInfo[] = [];

    // Use Prisma transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (prisma) => {
      // Create transaction record for salary payment
      // The amount recorded is what was actually paid
      const transaction = await prisma.transaction.create({
        data: {
          type: TransactionType.EXPENSE,
          amount: paidAmount, // Record only what was actually paid
          paymentMethod: null,
          category: 'EMPLOYEE_SALARIES',
          date: formatDateForDB(createSalaryPaymentDto.paymentDate),
          employeeVendorName: employee.name,
          notes: advanceDeductionAmount > 0
            ? `راتب ${employee.position} (الراتب الكامل: ${fullSalary.toFixed(2)}، المدفوع: ${paidAmount.toFixed(2)}، خصم سلفة: ${advanceDeductionAmount.toFixed(2)})`
            : createSalaryPaymentDto.notes
              ? `راتب ${employee.position}: ${createSalaryPaymentDto.notes}`
              : `راتب ${employee.position}`,
          branchId: employee.branchId,
          createdBy: user.id,
        },
      });

      // Create salary payment record
      const salaryPayment = await prisma.salaryPayment.create({
        data: {
          employeeId: employee.id,
          amount: createSalaryPaymentDto.amount,
          paymentDate: formatDateForDB(createSalaryPaymentDto.paymentDate),
          notes: createSalaryPaymentDto.notes || null,
          transactionId: transaction.id,
          recordedBy: user.id,
        },
      });

      // Process advance deductions only if there's a deduction amount
      // (i.e., paid less than full salary and there are active advances)
      let remainingDeduction = advanceDeductionAmount;

      for (const advance of activeAdvances) {
        // Stop if no more deduction to distribute
        if (remainingDeduction <= 0) break;

        // Calculate deduction for this advance
        // Deduct min of remaining deduction amount and this advance's remaining balance
        const deductionForThisAdvance = Math.min(
          remainingDeduction,
          Number(advance.remainingAmount),
        );

        if (deductionForThisAdvance <= 0) continue;

        // Create deduction record
        await prisma.advanceDeduction.create({
          data: {
            advanceId: advance.id,
            amount: deductionForThisAdvance,
            deductionDate: formatDateForDB(createSalaryPaymentDto.paymentDate),
            salaryPaymentId: salaryPayment.id,
            notes: `خصم من السلفة - الراتب الكامل: ${fullSalary.toFixed(2)}، المدفوع: ${paidAmount.toFixed(2)}`,
            recordedBy: user.id,
          },
        });

        // Calculate new remaining amount and status
        const newRemainingAmount = Number(advance.remainingAmount) - deductionForThisAdvance;
        const newStatus = newRemainingAmount <= 0 ? AdvanceStatus.PAID : AdvanceStatus.ACTIVE;

        // Update advance
        await prisma.employeeAdvance.update({
          where: { id: advance.id },
          data: {
            remainingAmount: newRemainingAmount,
            status: newStatus,
          },
        });

        advanceDeductionsInfo.push({
          advanceId: advance.id,
          deductionAmount: deductionForThisAdvance,
          previousRemaining: Number(advance.remainingAmount),
          newRemaining: newRemainingAmount,
          status: newStatus,
        });

        // Reduce remaining deduction
        remainingDeduction -= deductionForThisAdvance;
      }

      // Fetch the complete salary payment with relations
      const completeSalaryPayment = await prisma.salaryPayment.findUnique({
        where: { id: salaryPayment.id },
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

      return completeSalaryPayment!;
    });

    // Log the creation in audit log (convert to JSON-safe format)
    const auditData = JSON.parse(JSON.stringify({
      ...result,
      advanceDeductions: advanceDeductionsInfo,
      fullSalary,
      paidAmount,
      advanceDeductionAmount,
    }));

    await this.auditLogService.logCreate(
      user.id,
      AuditEntityType.SALARY_PAYMENT,
      result.id,
      auditData,
    );

    return {
      ...result,
      fullSalary,
      paidAmount,
      advanceDeductionAmount,
      advanceDeductions: advanceDeductionsInfo.length > 0 ? advanceDeductionsInfo : undefined,
    };
  }

  /**
   * Find salary payments by employee
   */
  async findByEmployee(
    employeeId: string,
    filters: DateRangeFilter = {},
    user: RequestUser,
  ): Promise<SalaryPaymentWithRelations[]> {
    // Fetch employee to check access
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId, deletedAt: null },
    });

    if (!employee) {
      throw new NotFoundException(ERROR_MESSAGES.SALARY_PAYMENT.EMPLOYEE_NOT_FOUND);
    }

    // Check branch access for accountants
    if (user.role === UserRole.ACCOUNTANT) {
      if (employee.branchId !== user.branchId) {
        throw new ForbiddenException(ERROR_MESSAGES.PERMISSION.BRANCH_ACCESS);
      }
    }

    // Build where clause
    const where: Prisma.SalaryPaymentWhereInput = {
      employeeId,
      deletedAt: null,
    };

    // Apply date range filter
    if (filters.startDate || filters.endDate) {
      where.paymentDate = {};
      if (filters.startDate) {
        where.paymentDate.gte = getStartOfDay(new Date(filters.startDate));
      }
      if (filters.endDate) {
        where.paymentDate.lte = getEndOfDay(new Date(filters.endDate));
      }
    }

    return await this.prisma.salaryPayment.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
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
   * Find salary payments by branch
   */
  async findByBranch(
    branchId: string,
    dateRange: DateRangeFilter,
    user: RequestUser,
  ): Promise<SalaryPaymentWithRelations[]> {
    // Check branch access for accountants
    if (user.role === UserRole.ACCOUNTANT) {
      if (branchId !== user.branchId) {
        throw new ForbiddenException(ERROR_MESSAGES.PERMISSION.BRANCH_ACCESS);
      }
    }

    // Build where clause
    const where: Prisma.SalaryPaymentWhereInput = {
      employee: {
        branchId,
        deletedAt: null,
      },
      deletedAt: null,
    };

    // Apply date range filter
    if (dateRange.startDate || dateRange.endDate) {
      where.paymentDate = {};
      if (dateRange.startDate) {
        where.paymentDate.gte = getStartOfDay(new Date(dateRange.startDate));
      }
      if (dateRange.endDate) {
        where.paymentDate.lte = getEndOfDay(new Date(dateRange.endDate));
      }
    }

    return await this.prisma.salaryPayment.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
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
   * Get payroll summary for branch
   */
  async getSummary(
    branchId: string,
    dateRange: DateRangeFilter,
    user: RequestUser,
  ): Promise<PayrollSummary> {
    // Check branch access for accountants
    if (user.role === UserRole.ACCOUNTANT) {
      if (branchId !== user.branchId) {
        throw new ForbiddenException(ERROR_MESSAGES.PERMISSION.BRANCH_ACCESS);
      }
    }

    // Build where clause
    const where: Prisma.SalaryPaymentWhereInput = {
      employee: {
        branchId,
        deletedAt: null,
      },
      deletedAt: null,
    };

    // Apply date range filter
    if (dateRange.startDate || dateRange.endDate) {
      where.paymentDate = {};
      if (dateRange.startDate) {
        where.paymentDate.gte = getStartOfDay(new Date(dateRange.startDate));
      }
      if (dateRange.endDate) {
        where.paymentDate.lte = getEndOfDay(new Date(dateRange.endDate));
      }
    }

    // Fetch all payments
    const payments = await this.prisma.salaryPayment.findMany({
      where,
      include: {
        employee: true,
      },
    });

    // Calculate summary
    const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const count = payments.length;

    // Group by employee
    const employeeMap = new Map<string, { name: string; total: number; count: number }>();

    payments.forEach((payment) => {
      const existing = employeeMap.get(payment.employeeId);
      if (existing) {
        existing.total += Number(payment.amount);
        existing.count += 1;
      } else {
        employeeMap.set(payment.employeeId, {
          name: payment.employee.name,
          total: Number(payment.amount),
          count: 1,
        });
      }
    });

    // Convert to array
    const breakdown = Array.from(employeeMap.entries()).map(([employeeId, data]) => ({
      employeeId,
      employeeName: data.name,
      totalAmount: data.total,
      paymentCount: data.count,
    }));

    return {
      totalPaid,
      count,
      breakdown,
    };
  }

  /**
   * Soft delete salary payment
   */
  async remove(id: string, user: RequestUser): Promise<void> {
    // Fetch existing payment
    const payment = await this.prisma.salaryPayment.findUnique({
      where: { id, deletedAt: null },
      include: {
        employee: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(ERROR_MESSAGES.SALARY_PAYMENT.NOT_FOUND);
    }

    // Check branch access for accountants
    if (user.role === UserRole.ACCOUNTANT) {
      if (payment.employee.branchId !== user.branchId) {
        throw new ForbiddenException(ERROR_MESSAGES.PERMISSION.BRANCH_ACCESS);
      }
    }

    // Soft delete using transaction to also mark the linked transaction as deleted
    await this.prisma.$transaction(async (prisma) => {
      // Soft delete salary payment
      await prisma.salaryPayment.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Soft delete linked transaction if exists
      if (payment.transactionId) {
        await prisma.transaction.update({
          where: { id: payment.transactionId },
          data: { deletedAt: new Date() },
        });
      }
    });

    // Log the deletion in audit log
    await this.auditLogService.logDelete(
      user.id,
      AuditEntityType.SALARY_PAYMENT,
      id,
      payment,
    );
  }
}
