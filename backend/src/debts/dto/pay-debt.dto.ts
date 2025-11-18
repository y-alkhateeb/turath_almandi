import {
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';
import { Currency } from '@prisma/client';
import { IsPositiveAmount } from '../../common/decorators/is-positive-amount.decorator';
import { IsAllowedCurrency } from '../../common/decorators/is-allowed-currency.decorator';

export class PayDebtDto {
  @IsNotEmpty()
  @IsPositiveAmount()
  amountPaid: number;

  @IsEnum(Currency)
  @IsOptional()
  @IsAllowedCurrency()
  currency?: Currency;

  @IsNotEmpty()
  @IsDateString()
  paymentDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
