import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  ValidateIf,
} from 'class-validator';
import { TransactionType, PaymentMethod } from '@prisma/client';
import { Transform } from 'class-transformer';

export class UpdateTransactionDto {
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  @Transform(({ value }) => parseFloat(value))
  @IsOptional()
  amount?: number;

  @IsEnum(PaymentMethod)
  @IsOptional()
  @ValidateIf((o) => o.type === TransactionType.INCOME || o.paymentMethod !== undefined)
  paymentMethod?: PaymentMethod;

  @IsString()
  @IsOptional()
  category?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  employeeVendorName?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
