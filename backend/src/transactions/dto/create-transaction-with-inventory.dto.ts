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
import { TransactionType } from '../../common/types/prisma-enums';
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
   * معرف الموظف (مطلوب إذا كانت الفئة 'EMPLOYEE_SALARIES')
   * @example '550e8400-e29b-41d4-a716-446655440000'
   */
  @ValidateIf((o) => o.category === 'EMPLOYEE_SALARIES')
  @IsNotEmpty({
    message: 'معرف الموظف مطلوب لمعاملات الرواتب',
  })
  @IsUUID()
  @IsOptional() // IsOptional is needed to allow the field to be absent for other categories
  employeeId?: string;

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
   * معرف جهة الاتصال (الدائن) (مطلوب إذا كان createDebtForRemaining = true)
   * @example '550e8400-e29b-41d4-a716-446655440000'
   */
  @ValidateIf((o) => o.createDebtForRemaining === true)
  @IsUUID()
  @IsNotEmpty({ message: 'يجب تحديد جهة الاتصال (الدائن) عند إنشاء دين' })
  contactId?: string;

  /**
   * تاريخ استحقاق الدين (اختياري)
   * @example '2024-02-15'
   */
  @IsOptional()
  @IsDateString()
  payableDueDate?: string;
}
