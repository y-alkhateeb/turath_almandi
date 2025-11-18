import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { TransactionType, PaymentMethod, Currency } from '@prisma/client';
import { IsPositiveAmount } from '../../common/decorators/is-positive-amount.decorator';
import { IsAllowedCurrency } from '../../common/decorators/is-allowed-currency.decorator';
import { IsNotFutureDate } from '../../common/decorators/is-not-future-date.decorator';

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

  @IsString()
  @IsOptional()
  category?: string;

  @IsDateString()
  @IsNotEmpty()
  @IsNotFutureDate()
  date: string;

  @IsString()
  @IsOptional()
  employeeVendorName?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
