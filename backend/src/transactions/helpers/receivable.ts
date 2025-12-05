import { BadRequestException } from '@nestjs/common';
import { AuditLogService, AuditEntityType } from '../../common/audit-log/audit-log.service';
import { formatDateForDB } from '../../common/utils/date.utils';
import { TransactionErrors } from '../../common/constants/arabic-errors';

/**
 * Input for receivable processing
 */
export interface ReceivableInput {
  amount: number;
  branchId: string;
  contactId: string;
  date: string;
  dueDate?: string;
  category: string;
  notes?: string;
  userId: string;
  transactionId: string;
}

/**
 * Result of receivable processing
 */
export interface ReceivableResult {
  linkedReceivableId: string;
}

/**
 * Validates and processes receivable creation for income transactions.
 * 
 * @param input - Receivable input
 * @param prisma - Prisma transaction client
 * @param auditLogService - Audit log service for logging
 * @returns Processed receivable result with linked receivable ID
 */
export async function processReceivable(
  input: ReceivableInput,
  prisma: any, // Prisma transaction client
  auditLogService: AuditLogService,
): Promise<ReceivableResult> {
  // Validate amount
  if (input.amount <= 0) {
    throw new BadRequestException('المبلغ يجب أن يكون أكبر من صفر');
  }

  // Require contactId
  if (!input.contactId) {
    throw new BadRequestException('معرف العميل مطلوب لإنشاء ذمة مدينة');
  }

  // Create AccountReceivable
  const receivable = await prisma.accountReceivable.create({
    data: {
      contactId: input.contactId,
      originalAmount: input.amount,
      remainingAmount: input.amount,
      date: formatDateForDB(input.date),
      dueDate: input.dueDate ? formatDateForDB(input.dueDate) : null,
      status: 'ACTIVE',
      description: TransactionErrors.autoDebtDescription(input.category),
      notes: input.notes || null,
      linkedSaleTransactionId: input.transactionId,
      branchId: input.branchId,
      createdBy: input.userId,
      isDeleted: false,
    },
  });

  // Log receivable creation
  await auditLogService.logCreate(
    input.userId,
    AuditEntityType.RECEIVABLE,
    receivable.id,
    receivable,
  );

  return {
    linkedReceivableId: receivable.id,
  };
}
