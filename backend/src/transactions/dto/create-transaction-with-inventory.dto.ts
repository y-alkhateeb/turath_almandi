// Swagger decorators removed - project doesn't use @nestjs/swagger
// Using JSDoc comments for documentation instead
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  ValidateNested,
  IsUUID,
  IsBoolean,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType } from '@prisma/client';
import { InventoryItemOperationDto } from './inventory-item-operation.dto';

/**
 * DTO for creating transaction with inventory operations and partial payment
 */
export class CreateTransactionWithInventoryDto {
  /**
   * نوع المعاملة
   * @example 'EXPENSE'
   */
  @IsEnum(TransactionType)
  type: TransactionType;

  /**
   * المبلغ الإجمالي للمعاملة
   * @example 1500.5
   * @minimum 0
   */
  @IsNumber()
  @Min(0)
  totalAmount: number;

  /**
   * المبلغ المدفوع فعلياً (إذا كان أقل من الإجمالي)
   * @example 1000
   * @minimum 0
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  /**
   * فئة المعاملة
   * @example 'INVENTORY'
   */
  @IsOptional()
  @IsString()
  category?: string;

  /**
   * طريقة الدفع للمبلغ المدفوع
   * @example 'CASH'
   */
  @IsEnum(['CASH', 'MASTER'])
  paymentMethod: 'CASH' | 'MASTER';

  /**
   * تاريخ المعاملة
   * @example '2024-01-15'
   */
  @IsDateString()
  date: string;

  /**
   * ملاحظات إضافية
   * @example 'شراء مواد خام للمطعم'
   */
  @IsOptional()
  @IsString()
  notes?: string;

  /**
   * معرف الفرع (للأدمن فقط)
   * @example '550e8400-e29b-41d4-a716-446655440000'
   */
  @IsOptional()
  @IsUUID()
  branchId?: string;

  /**
   * صنف المخزون المرتبط بالمعاملة (صنف واحد فقط)
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => InventoryItemOperationDto)
  inventoryItem?: InventoryItemOperationDto;

  /**
   * هل نسجل المبلغ المتبقي كدين؟
   * @example true
   * @default false
   */
  @IsOptional()
  @IsBoolean()
  createDebtForRemaining?: boolean;

  /**
   * اسم الدائن (مطلوب إذا كان createDebtForRemaining = true)
   * @example 'شركة المواد الغذائية'
   */
  @ValidateIf((o) => o.createDebtForRemaining === true)
  @IsString()
  @IsNotEmpty()
  debtCreditorName?: string;

  /**
   * تاريخ استحقاق الدين (اختياري)
   * @example '2024-02-15'
   */
  @IsOptional()
  @IsDateString()
  debtDueDate?: string;

  /**
   * ملاحظات الدين
   * @example 'دين على دفعة المواد الخام'
   */
  @IsOptional()
  @IsString()
  debtNotes?: string;
}
