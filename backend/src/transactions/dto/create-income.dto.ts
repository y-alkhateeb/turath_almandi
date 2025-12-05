import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  MaxLength,
  IsString,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, DiscountType } from '../../common/types/prisma-enums';
import { IsPositiveAmount } from '../../common/decorators/is-positive-amount.decorator';
import { BaseTransactionDto } from './base-transaction.dto';
import { TransactionItemDto } from './transaction-item.dto';
import { INCOME_CATEGORIES } from '../../common/constants/transaction-categories';

export type IncomeCategory = typeof INCOME_CATEGORIES[number];

/**
 * DTO for creating INCOME transactions.
 * 
 * Features:
 * - PaymentMethod is REQUIRED (CASH or MASTER)
 * - Supports multi-item transactions (items[])
 * - Supports discounts (for sales categories)
 * - Amount OR items required (not both)
 */
export class CreateIncomeDto extends BaseTransactionDto {
  /**
   * فئة الإيراد
   * @example 'INVENTORY_SALES'
   */
  @IsEnum(INCOME_CATEGORIES, { 
    message: `الفئة يجب أن تكون: ${INCOME_CATEGORIES.join(' | ')}` 
  })
  @IsNotEmpty({ message: 'فئة الإيراد مطلوبة' })
  category: IncomeCategory;

  /**
   * طريقة الدفع (مطلوبة للإيرادات)
   * @example 'CASH'
   */
  @IsEnum(PaymentMethod, { message: 'طريقة الدفع يجب أن تكون: CASH أو MASTER' })
  @IsNotEmpty({ message: 'طريقة الدفع مطلوبة للإيرادات' })
  paymentMethod: PaymentMethod;

  /**
   * المبلغ (مطلوب إذا لم يتم تحديد items)
   * @example 150.50
   */
  @ValidateIf((o) => !o.items || o.items.length === 0)
  @IsPositiveAmount()
  amount?: number;

  /**
   * قائمة الأصناف (للمبيعات متعددة الأصناف)
   * مطلوب إذا لم يتم تحديد amount
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionItemDto)
  items?: TransactionItemDto[];

  // ============================================
  // DISCOUNT FIELDS (Income only)
  // ============================================

  /**
   * نوع الخصم
   * @example 'PERCENTAGE'
   */
  @IsOptional()
  @IsEnum(DiscountType, { message: 'نوع الخصم غير صالح' })
  discountType?: DiscountType;

  /**
   * قيمة الخصم (نسبة أو مبلغ ثابت)
   * @example 10
   */
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'قيمة الخصم يجب أن تكون صفر أو أكبر' })
  discountValue?: number;

  /**
   * سبب الخصم
   * @example 'خصم عميل مميز'
   */
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'سبب الخصم يجب ألا يتجاوز 200 حرف' })
  discountReason?: string;
}
