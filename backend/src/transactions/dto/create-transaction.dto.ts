import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  ValidateIf,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Trim, Escape } from 'class-sanitizer';
import { TransactionType, PaymentMethod, DiscountType } from '../../common/types/prisma-enums';
import { IsPositiveAmount } from '../../common/decorators/is-positive-amount.decorator';
import { IsNotFutureDate } from '../../common/decorators/is-not-future-date.decorator';
import { IsValidCategory } from '../../common/decorators/is-valid-category.decorator';
import { TransactionItemDto } from './transaction-item.dto';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  @IsNotEmpty()
  type: TransactionType;

  // Amount field - required only if no items provided
  @ValidateIf((o) => !o.items || o.items.length === 0)
  @IsPositiveAmount()
  amount?: number;

  @IsEnum(PaymentMethod, { message: 'طريقة الدفع يجب أن تكون: CASH أو MASTER' })
  @IsOptional()
  @ValidateIf((o) => o.type === TransactionType.INCOME)
  paymentMethod?: PaymentMethod;

  // For multi-item transactions
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionItemDto)
  items?: TransactionItemDto[];

  // Transaction-level discount (INCOME only)
  @IsOptional()
  @IsEnum(DiscountType, { message: 'نوع الخصم غير صالح' })
  discountType?: DiscountType;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'قيمة الخصم يجب أن تكون صفر أو أكبر' })
  discountValue?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'سبب الخصم يجب ألا يتجاوز 200 حرف' })
  discountReason?: string;

  @Trim()
  @IsString()
  @IsOptional()
  @IsValidCategory()
  category?: string;

  @IsDateString()
  @IsNotEmpty()
  @IsNotFutureDate()
  date: string;

  @Trim()
  @Escape()
  @IsString()
  @IsOptional()
  employeeVendorName?: string;

  @Trim()
  @Escape()
  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;

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
}
