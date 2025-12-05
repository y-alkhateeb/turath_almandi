import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService, AuditEntityType } from '../../common/audit-log/audit-log.service';
import { formatDateForDB } from '../../common/utils/date.utils';

/**
 * Input for partial payment processing
 */
export interface PartialPaymentInput {
  totalAmount: number;
  paidAmount?: number;
  branchId: string;
  contactId?: string;
  date: string;
  dueDate?: string;
  category: string;
  notes?: string;
  userId: string;
}

/**
 * Result of partial payment processing
 */
export interface PartialPaymentResult {
  paidAmount: number;
  remainingAmount: number;
  linkedPayableId: string | null;
}

/**
 * Validates and processes partial payment, creating AccountPayable if needed.
 * 
 * @param input - Partial payment input
 * @param prisma - Prisma transaction client
 * @param auditLogService - Audit log service for logging
 * @returns Processed payment result with linked payable ID
 */
export async function processPartialPayment(
  input: PartialPaymentInput,
  prisma: any, // Prisma transaction client
  auditLogService: AuditLogService,
): Promise<PartialPaymentResult> {
  const paidAmount = input.paidAmount ?? input.totalAmount;
  const remainingAmount = input.totalAmount - paidAmount;

  // Validate amounts
  if (paidAmount < 0) {
    throw new BadRequestException('المبلغ المدفوع لا يمكن أن يكون سالباً');
  }

  if (paidAmount > input.totalAmount) {
    throw new BadRequestException('المبلغ المدفوع لا يمكن أن يتجاوز المبلغ الإجمالي');
  }

  // If no remaining amount, no payable needed
  if (remainingAmount <= 0) {
    return {
      paidAmount,
      remainingAmount: 0,
      linkedPayableId: null,
    };
  }

  // Require contactId for partial payment
  if (!input.contactId) {
    throw new BadRequestException('معرف جهة الاتصال مطلوب عند الدفع الجزئي للمصروفات');
  }

  // Create AccountPayable for remaining amount
  const payable = await prisma.accountPayable.create({
    data: {
      branchId: input.branchId,
      contactId: input.contactId,
      originalAmount: remainingAmount,
      remainingAmount: remainingAmount,
      date: formatDateForDB(input.date),
      dueDate: input.dueDate ? formatDateForDB(input.dueDate) : null,
      status: 'ACTIVE',
      description: `دين تلقائي من معاملة ${input.category}`,
      notes: input.notes || 'المبلغ المتبقي من المعاملة',
      createdBy: input.userId,
    },
  });

  // Log payable creation
  await auditLogService.logCreate(
    input.userId,
    AuditEntityType.ACCOUNT_PAYABLE,
    payable.id,
    payable,
  );

  return {
    paidAmount,
    remainingAmount,
    linkedPayableId: payable.id,
  };
}
