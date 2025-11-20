import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  ValidateIf,
  IsUUID,
} from 'class-validator';
import { Trim, Escape } from 'class-sanitizer';
import { TransactionType, PaymentMethod, Currency } from '@prisma/client';
import { IsPositiveAmount } from '../../common/decorators/is-positive-amount.decorator';
import { IsAllowedCurrency } from '../../common/decorators/is-allowed-currency.decorator';
import { IsNotFutureDate } from '../../common/decorators/is-not-future-date.decorator';
import { IsValidCategory } from '../../common/decorators/is-valid-category.decorator';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  @IsNotEmpty()
  type: TransactionType;

  @IsPositiveAmount()
  amount: number;

  @IsEnum(Currency)
  @IsOptional()
  @IsAllowedCurrency()
  currency?: Currency;

  @IsEnum(PaymentMethod, { message: 'طريقة الدفع يجب أن تكون: CASH أو MASTER' })
  @IsOptional()
  @ValidateIf((o) => o.type === TransactionType.INCOME)
  paymentMethod?: PaymentMethod;

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
}
