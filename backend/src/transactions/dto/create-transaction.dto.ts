import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { TransactionType, PaymentMethod } from '@prisma/client';
import { IsPositiveAmount } from '../../common/decorators/is-positive-amount.decorator';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  @IsNotEmpty()
  type: TransactionType;

  @IsPositiveAmount()
  amount: number;

  @IsEnum(PaymentMethod)
  @IsOptional()
  @ValidateIf((o) => o.type === TransactionType.INCOME)
  paymentMethod?: PaymentMethod;

  @IsString()
  @IsOptional()
  category?: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsOptional()
  employeeVendorName?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
