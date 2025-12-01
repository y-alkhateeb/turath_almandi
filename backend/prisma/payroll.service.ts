import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService, AuditEntityType } from '../common/audit-log/audit-log.service';
import { TransactionsService } from '../transactions/transactions.service';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { PaySalaryDto } from './dto/pay-salary.dto';
import { RequestUser } from '../common/interfaces';
import { ARABIC_ERRORS } from '../common/constants/arabic-errors';
import { EmployeeStatus, EmployeeAdjustmentType, TransactionType, EmployeeAdjustmentStatus, PaymentMethod } from '@prisma/client';
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
        const transaction = await this.transactionsService.create(
          {
            type: TransactionType.EXPENSE,
            amount: dto.amount,
            category: 'EMPLOYEE_SALARIES',
            date: dto.date,
            employeeId: dto.employeeId,
            employeeVendorName: `سلفة للموظف: ${employee.name}`,
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

    const startDate = getStartOfMonth(month);
    const endDate = getEndOfMonth(month);

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
    // This will be the final step of Phase 2
    // It will calculate net salary, create a transaction, and update adjustments status to PROCESSED
    throw new Error('Method not implemented yet. This is the next step.');
  }
}