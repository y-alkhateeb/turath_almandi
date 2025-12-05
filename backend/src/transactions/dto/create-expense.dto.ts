import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsUUID,
  ValidateIf,
  ValidateNested,
  IsDateString,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../common/types/prisma-enums';
import { IsPositiveAmount } from '../../common/decorators/is-positive-amount.decorator';
import { BaseTransactionDto } from './base-transaction.dto';
import { TransactionItemDto } from './transaction-item.dto';
import { EXPENSE_CATEGORIES } from '../../common/constants/transaction-categories';

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

/**
 * DTO for creating EXPENSE transactions.
 *
 * Features:
 * - PaymentMethod is OPTIONAL (defaults based on context)
 * - Supports multi-item transactions (items[]) for inventory operations
 * - Supports employee salary payments
 * - Supports partial payment with automatic debt creation
 * - Amount OR items required (not both)
 */
export class CreateExpenseDto extends BaseTransactionDto {
  /**
   * فئة المصروف
   * @example 'SUPPLIES'
   */
  @IsEnum(EXPENSE_CATEGORIES, { 
    message: `الفئة يجب أن تكون: ${EXPENSE_CATEGORIES.join(' | ')}` 
  })
  @IsNotEmpty({ message: 'فئة المصروف مطلوبة' })
  category: ExpenseCategory;

  /**
   * طريقة الدفع (اختيارية للمصروفات)
   * @example 'CASH'
   */
  @IsEnum(PaymentMethod, { message: 'طريقة الدفع يجب أن تكون: CASH أو MASTER' })
  @IsOptional()
  paymentMethod?: PaymentMethod;

  /**
   * المبلغ الإجمالي للمصروف (مطلوب إذا لم يتم تحديد items)
   * @example 500.00
   */
  @ValidateIf((o) => !o.items || o.items.length === 0)
  @IsPositiveAmount()
  amount?: number;

  // ============================================
  // EMPLOYEE SALARY FIELDS
  // ============================================

  /**
   * معرف الموظف (مطلوب إذا كانت الفئة 'EMPLOYEE_SALARIES')
   * @example '550e8400-e29b-41d4-a716-446655440000'
   */
  @ValidateIf((o) => o.category === 'EMPLOYEE_SALARIES')
  @IsNotEmpty({ message: 'معرف الموظف مطلوب لمعاملات الرواتب' })
  @IsUUID()
  @IsOptional()
  employeeId?: string;

  // ============================================
  // INVENTORY ITEMS (Multi-item support)
  // ============================================

  /**
   * قائمة الأصناف (للمشتريات أو الاستهلاك متعدد الأصناف)
   * مطلوب إذا لم يتم تحديد amount
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionItemDto)
  items?: TransactionItemDto[];

  // ============================================
  // PARTIAL PAYMENT / DEBT FIELDS
  // ============================================

  /**
   * المبلغ المدفوع فعلياً (للدفع الجزئي)
   * إذا كان أقل من المبلغ الإجمالي، سيتم إنشاء دين تلقائياً
   * @example 300
   */
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'المبلغ المدفوع يجب أن يكون صفر أو أكبر' })
  paidAmount?: number;

  /**
   * هل نسجل المبلغ المتبقي كدين؟
   * @example true
   */
  @IsOptional()
  @IsBoolean()
  createDebtForRemaining?: boolean;

  /**
   * معرف جهة الاتصال (الدائن) - مطلوب للدفع الجزئي
   * @example '550e8400-e29b-41d4-a716-446655440000'
   */
  @ValidateIf((o) => o.createDebtForRemaining === true || (o.paidAmount !== undefined && o.amount && o.paidAmount < o.amount))
  @IsUUID('4', { message: 'معرف جهة الاتصال يجب أن يكون UUID صحيح' })
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
