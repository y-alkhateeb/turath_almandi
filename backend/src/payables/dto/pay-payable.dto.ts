import {
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  IsString,
  MaxLength,
} from 'class-validator';
import { Trim, Escape } from 'class-sanitizer';
import { IsPositiveAmount } from '../../common/decorators/is-positive-amount.decorator';
import { PaymentMethod } from '../../common/types/prisma-enums';

export class PayPayableDto {
  @IsPositiveAmount()
  amountPaid: number;

  @IsDateString()
  @IsNotEmpty({ message: 'Payment date is required' })
  paymentDate: string;

  @IsEnum(PaymentMethod, { message: 'Invalid payment method' })
  @IsNotEmpty({ message: 'Payment method is required' })
  paymentMethod: PaymentMethod;

  @Trim()
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Reference number must not exceed 100 characters' })
  referenceNumber?: string;

  @Trim()
  @Escape()
  @IsString()
  @IsOptional()
  notes?: string;
}
