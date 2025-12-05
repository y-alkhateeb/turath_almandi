import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService, AuditEntityType } from '../common/audit-log/audit-log.service';
import { TransactionsService } from '../transactions/transactions.service';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { PaySalaryDto } from './dto/pay-salary.dto';
import { RequestUser } from '../common/interfaces';
import { ARABIC_ERRORS } from '../common/constants/arabic-errors';
import { EmployeeStatus, EmployeeAdjustmentType, TransactionType, EmployeeAdjustmentStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { getStartOfMonth, getEndOfMonth } from '../common/utils/date.utils';

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async createAdjustment(dto: CreateAdjustmentDto, user: RequestUser) {
    // 1. Validate Employee
    const employee = await this.prisma.employee.findUnique({ where: { id: dto.employeeId } });
    if (!employee) {
      throw new NotFoundException(ARABIC_ERRORS.employeeNotFound);
    }
    if (user.role === 'ACCOUNTANT' && employee.branchId !== user.branchId) {
      throw new ForbiddenException(ARABIC_ERRORS.noAccessToEmployee);
    }

    // 2. Handle ADVANCE type specifically (Immediate Expense Transaction)
    if (dto.type === EmployeeAdjustmentType.ADVANCE) {
      return this.prisma.$transaction(async (prisma) => {
        // Create an expense transaction for the advance payment
        const transaction = await this.transactionsService.createExpense(
          {
            amount: dto.amount,
            category: 'EMPLOYEE_SALARIES',
            date: dto.date,
            employeeId: dto.employeeId,
            notes: dto.description || 'صرف سلفة نقدية',
            branchId: employee.branchId,
            paymentMethod: 'CASH', // Advances are typically cash
          },
          user,
        );

        // Create the adjustment record with remainingAmount for partial deductions
        const adjustment = await prisma.employeeAdjustment.create({
          data: {
            employeeId: dto.employeeId,
            type: dto.type,
            amount: new Decimal(dto.amount),
            remainingAmount: new Decimal(dto.amount), // Initialize remaining = full amount
            date: new Date(dto.date),
            description: dto.description,
            status: EmployeeAdjustmentStatus.PENDING,
            createdBy: user.id,
          },
        });

        await this.auditLogService.logCreate(user.id, AuditEntityType.EMPLOYEE_ADJUSTMENT, adjustment.id, adjustment);

        return { adjustment, transaction };
      });
    }

    // 3. Handle BONUS and DEDUCTION (Create transactions immediately to appear in history)
    return this.prisma.$transaction(async (prisma) => {
      // Create the adjustment record
      const adjustment = await prisma.employeeAdjustment.create({
        data: {
          employeeId: dto.employeeId,
          type: dto.type,
          amount: new Decimal(dto.amount),
          date: new Date(dto.date),
          description: dto.description,
          status: EmployeeAdjustmentStatus.PENDING,
          createdBy: user.id,
        },
      });

      // Create a corresponding transaction to track in history immediately
      // Bonuses increase expenses (paid out to employee)
      // Deductions decrease payroll expenses (reduction in what we owe)
      const transaction = await this.transactionsService.createExpense(
        {
          amount: dto.amount,
          category: 'EMPLOYEE_SALARIES',
          date: dto.date,
          employeeId: dto.employeeId,
          notes: `${dto.type === EmployeeAdjustmentType.BONUS ? 'مكافأة' : 'تسوية'} ${dto.description ? '- ' + dto.description : ''}`.trim(),
          branchId: employee.branchId,
          paymentMethod: 'CASH', // Default for adjustments
        },
        user,
      );

      await this.auditLogService.logCreate(user.id, AuditEntityType.EMPLOYEE_ADJUSTMENT, adjustment.id, adjustment);

      return { adjustment, transaction };
    });
  }

  async getEmployeeSalaryDetails(employeeId: string, month: string, user: RequestUser) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException(ARABIC_ERRORS.employeeNotFound);
    if (user.role === 'ACCOUNTANT' && employee.branchId !== user.branchId) {
      throw new ForbiddenException(ARABIC_ERRORS.noAccessToEmployee);
    }

    // Parse month string (YYYY-MM) to Date
    const [year, monthNum] = month.split('-').map(Number);
    const monthDate = new Date(year, monthNum - 1, 1);

    const startDate = getStartOfMonth(monthDate);
    const endDate = getEndOfMonth(monthDate);

    // Check if salary is already paid for this month
    const existingPayment = await this.prisma.salaryPayment.findFirst({
      where: {
        employeeId,
        salaryMonth: month,
        isDeleted: false,
      },
    });

    // Get pending adjustments for this month (bonuses/deductions dated in this month)
    const pendingAdjustments = await this.prisma.employeeAdjustment.findMany({
      where: {
        employeeId,
        status: EmployeeAdjustmentStatus.PENDING,
        date: { gte: startDate, lte: endDate },
        isDeleted: false,
      },
    });

    // Get ALL pending advances (not limited to this month - they carry over)
    const pendingAdvances = await this.prisma.employeeAdjustment.findMany({
      where: {
        employeeId,
        type: EmployeeAdjustmentType.ADVANCE,
        status: EmployeeAdjustmentStatus.PENDING,
        isDeleted: false,
      },
    });

    const baseSalary = new Decimal(employee.baseSalary);
    const allowance = new Decimal(employee.allowance);
    const grossSalary = baseSalary.plus(allowance);

    let totalBonuses = new Decimal(0);
    let totalDeductions = new Decimal(0);
    let totalAdvances = new Decimal(0);

    // Calculate bonuses and deductions for this month
    for (const adj of pendingAdjustments) {
      if (adj.type === EmployeeAdjustmentType.BONUS) totalBonuses = totalBonuses.plus(adj.amount);
      if (adj.type === EmployeeAdjustmentType.DEDUCTION) totalDeductions = totalDeductions.plus(adj.amount);
    }

    // Calculate total advances using remainingAmount (for partial deduction support)
    for (const adv of pendingAdvances) {
      const remaining = adv.remainingAmount ?? adv.amount;
      totalAdvances = totalAdvances.plus(remaining);
    }

    const netSalary = grossSalary.plus(totalBonuses).minus(totalDeductions).minus(totalAdvances);

    return {
      employee,
      salaryMonth: month,
      baseSalary: baseSalary.toNumber(),
      allowance: allowance.toNumber(),
      grossSalary: grossSalary.toNumber(),
      isPaid: !!existingPayment,
      existingPayment,
      pendingAdjustments,
      pendingAdvances, // Separate list for advances with remainingAmount
      summary: {
        totalBonuses: totalBonuses.toNumber(),
        totalDeductions: totalDeductions.toNumber(),
        totalAdvances: totalAdvances.toNumber(),
        netSalary: netSalary.toNumber(),
      },
    };
  }

  async paySalary(dto: PaySalaryDto, user: RequestUser) {
    // 1. Get salary details (reuse existing method)
    const salaryDetails = await this.getEmployeeSalaryDetails(
      dto.employeeId,
      dto.salaryMonth,
      user,
    );

    // 2. Check if salary is already paid for this month
    if (salaryDetails.isPaid) {
      throw new BadRequestException(`راتب شهر ${dto.salaryMonth} مدفوع مسبقاً`);
    }

    // 3. Calculate actual net salary based on advance deductions
    let actualAdvanceDeductions = new Decimal(0);
    const advanceDeductionsMap = new Map<string, number>();

    if (dto.advanceDeductions && dto.advanceDeductions.length > 0) {
      // User specified partial deductions
      for (const deduction of dto.advanceDeductions) {
        const advance = salaryDetails.pendingAdvances.find(
          (adv) => adv.id === deduction.adjustmentId,
        );

        if (!advance) {
          throw new BadRequestException(`السلفة ${deduction.adjustmentId} غير موجودة أو ليست معلقة`);
        }

        const remaining = Number(advance.remainingAmount ?? advance.amount);
        if (deduction.deductionAmount > remaining) {
          throw new BadRequestException(
            `مبلغ الخصم (${deduction.deductionAmount}) أكبر من المتبقي من السلفة (${remaining})`,
          );
        }

        advanceDeductionsMap.set(deduction.adjustmentId, deduction.deductionAmount);
        actualAdvanceDeductions = actualAdvanceDeductions.plus(deduction.deductionAmount);
      }
    } else {
      // Default: deduct all pending advances in full
      for (const advance of salaryDetails.pendingAdvances) {
        const remaining = Number(advance.remainingAmount ?? advance.amount);
        advanceDeductionsMap.set(advance.id, remaining);
        actualAdvanceDeductions = actualAdvanceDeductions.plus(remaining);
      }
    }

    // Calculate actual net salary
    const grossSalary = new Decimal(salaryDetails.grossSalary);
    const totalBonuses = new Decimal(salaryDetails.summary.totalBonuses);
    const totalDeductions = new Decimal(salaryDetails.summary.totalDeductions);
    const actualNetSalary = grossSalary
      .plus(totalBonuses)
      .minus(totalDeductions)
      .minus(actualAdvanceDeductions);

    // 4. Validate net salary is positive
    if (actualNetSalary.lessThanOrEqualTo(0)) {
      throw new BadRequestException('صافي الراتب يجب أن يكون أكبر من صفر');
    }

    // 5. Use Prisma transaction for atomicity
    return this.prisma.$transaction(async (prisma) => {
      // 6. Create SalaryPayment record
      const defaultNotes = `صرف راتب شهر ${dto.salaryMonth}`;
      const salaryPayment = await prisma.salaryPayment.create({
        data: {
          employeeId: dto.employeeId,
          salaryMonth: dto.salaryMonth,
          amount: actualNetSalary.toNumber(),
          paymentDate: new Date(dto.paymentDate),
          notes: dto.notes || defaultNotes,
          recordedBy: user.id,
        },
      });

      // 7. Create expense transaction
      const transaction = await this.transactionsService.createExpense(
        {
          amount: actualNetSalary.toNumber(),
          category: 'EMPLOYEE_SALARIES',
          date: dto.paymentDate,
          employeeId: dto.employeeId,
          notes: dto.notes || defaultNotes,
          branchId: salaryDetails.employee.branchId,
          paymentMethod: 'CASH',
        },
        user,
      );

      // 8. Update SalaryPayment with transaction ID
      await prisma.salaryPayment.update({
        where: { id: salaryPayment.id },
        data: { transactionId: transaction.id },
      });

      // 9. Process bonuses and deductions (non-advances) - mark as PROCESSED
      const nonAdvanceAdjustmentIds = salaryDetails.pendingAdjustments
        .filter((adj) => adj.type !== EmployeeAdjustmentType.ADVANCE)
        .map((adj) => adj.id);

      if (nonAdvanceAdjustmentIds.length > 0) {
        await prisma.employeeAdjustment.updateMany({
          where: { id: { in: nonAdvanceAdjustmentIds } },
          data: {
            status: EmployeeAdjustmentStatus.PROCESSED,
            salaryPaymentId: salaryPayment.id,
          },
        });
      }

      // 10. Process advances with partial deduction support
      let advancesProcessed = 0;
      for (const [advanceId, deductionAmount] of advanceDeductionsMap) {
        const advance = salaryDetails.pendingAdvances.find((a) => a.id === advanceId);
        if (!advance) continue;

        const currentRemaining = Number(advance.remainingAmount ?? advance.amount);
        const newRemaining = currentRemaining - deductionAmount;

        if (newRemaining <= 0) {
          // Fully paid off
          await prisma.employeeAdjustment.update({
            where: { id: advanceId },
            data: {
              remainingAmount: new Decimal(0),
              status: EmployeeAdjustmentStatus.PROCESSED,
              salaryPaymentId: salaryPayment.id,
            },
          });
        } else {
          // Partially paid - remains PENDING
          await prisma.employeeAdjustment.update({
            where: { id: advanceId },
            data: {
              remainingAmount: new Decimal(newRemaining),
              // Status remains PENDING, no salaryPaymentId
            },
          });
        }
        advancesProcessed++;
      }

      // 11. Audit log
      await this.auditLogService.logCreate(
        user.id,
        AuditEntityType.SALARY_PAYMENT,
        salaryPayment.id,
        {
          salaryPayment,
          transaction,
          adjustmentsProcessed: nonAdvanceAdjustmentIds.length,
          advancesProcessed,
          advanceDeductions: Object.fromEntries(advanceDeductionsMap),
        },
      );

      // 12. Return complete salary payment details
      return {
        salaryPayment: {
          ...salaryPayment,
          transactionId: transaction.id,
        },
        transaction,
        adjustmentsProcessed: nonAdvanceAdjustmentIds.length,
        advancesProcessed,
        summary: {
          ...salaryDetails.summary,
          actualNetSalary: actualNetSalary.toNumber(),
          actualAdvanceDeductions: actualAdvanceDeductions.toNumber(),
        },
      };
    });
  }
}