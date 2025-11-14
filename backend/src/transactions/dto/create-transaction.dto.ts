import { IsString, IsNotEmpty, IsEnum, IsNumber, IsUUID, IsOptional } from 'class-validator';
import { TransactionType, PaymentMethod, Currency } from '@prisma/client';

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsEnum(Currency)
  currency: Currency;

  @IsUUID()
  branchId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
