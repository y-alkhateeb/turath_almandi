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

        // Create the adjustment record, linked to the transaction, and mark as PENDING
        // It will be deducted from the next salary payment
        const adjustment = await prisma.employeeAdjustment.create({
          data: {
            employeeId: dto.employeeId,
            type: dto.type,
            amount: new Decimal(dto.amount),
            date: new Date(dto.date),
            description: dto.description,
            status: EmployeeAdjustmentStatus.PENDING, // Pending deduction from salary
            createdBy: user.id,
          },
        });

        await this.auditLogService.logCreate(user.id, AuditEntityType.EMPLOYEE_ADJUSTMENT, adjustment.id, adjustment);

        return { adjustment, transaction };
      });
    }

    // 3. Handle BONUS and DEDUCTION (Pending until salary payment)
    const adjustment = await this.prisma.employeeAdjustment.create({
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

    await this.auditLogService.logCreate(user.id, AuditEntityType.EMPLOYEE_ADJUSTMENT, adjustment.id, adjustment);

    return adjustment;
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

    const pendingAdjustments = await this.prisma.employeeAdjustment.findMany({
      where: {
        employeeId,
        status: EmployeeAdjustmentStatus.PENDING,
        date: { gte: startDate, lte: endDate },
      },
    });

    const baseSalary = new Decimal(employee.baseSalary);
    const allowance = new Decimal(employee.allowance);
    const grossSalary = baseSalary.plus(allowance);

    let totalBonuses = new Decimal(0);
    let totalDeductions = new Decimal(0);
    let totalAdvances = new Decimal(0);

    for (const adj of pendingAdjustments) {
      if (adj.type === EmployeeAdjustmentType.BONUS) totalBonuses = totalBonuses.plus(adj.amount);
      if (adj.type === EmployeeAdjustmentType.DEDUCTION) totalDeductions = totalDeductions.plus(adj.amount);
      if (adj.type === EmployeeAdjustmentType.ADVANCE) totalAdvances = totalAdvances.plus(adj.amount);
    }

    const netSalary = grossSalary.plus(totalBonuses).minus(totalDeductions).minus(totalAdvances);

    return {
      employee,
      salaryMonth: month,
      baseSalary: baseSalary.toNumber(),
      allowance: allowance.toNumber(),
      grossSalary: grossSalary.toNumber(),
      pendingAdjustments,
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

    // 2. Validate net salary is positive
    if (salaryDetails.summary.netSalary <= 0) {
      throw new BadRequestException('صافي الراتب يجب أن يكون أكبر من صفر');
    }

    // 3. Use Prisma transaction for atomicity
    return this.prisma.$transaction(async (prisma) => {
      // 4. Create SalaryPayment record
      const defaultNotes = `صرف راتب شهر ${dto.salaryMonth}`;
      const salaryPayment = await prisma.salaryPayment.create({
        data: {
          employeeId: dto.employeeId,
          amount: salaryDetails.summary.netSalary,
          paymentDate: new Date(dto.paymentDate),
          notes: dto.notes || defaultNotes,
          recordedBy: user.id,
        },
      });

      // 5. Create expense transaction
      const transaction = await this.transactionsService.createExpense(
        {
          amount: salaryDetails.summary.netSalary,
          category: 'EMPLOYEE_SALARIES',
          date: dto.paymentDate,
          employeeId: dto.employeeId,
          notes: dto.notes || defaultNotes,
          branchId: salaryDetails.employee.branchId,
          paymentMethod: 'CASH',
        },
        user,
      );

      // 6. Update SalaryPayment with transaction ID
      await prisma.salaryPayment.update({
        where: { id: salaryPayment.id },
        data: { transactionId: transaction.id },
      });

      // 7. Update all PENDING adjustments to PROCESSED
      const adjustmentIds = salaryDetails.pendingAdjustments.map((adj) => adj.id);

      if (adjustmentIds.length > 0) {
        await prisma.employeeAdjustment.updateMany({
          where: { id: { in: adjustmentIds } },
          data: {
            status: EmployeeAdjustmentStatus.PROCESSED,
            salaryPaymentId: salaryPayment.id,
          },
        });
      }

      // 8. Audit log
      await this.auditLogService.logCreate(
        user.id,
        AuditEntityType.SALARY_PAYMENT,
        salaryPayment.id,
        { salaryPayment, transaction, adjustmentsProcessed: adjustmentIds.length },
      );

      // 9. Return complete salary payment details
      return {
        salaryPayment: {
          ...salaryPayment,
          transactionId: transaction.id,
        },
        transaction,
        adjustmentsProcessed: adjustmentIds.length,
        summary: salaryDetails.summary,
      };
    });
  }
}