import {
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';
import { Trim, Escape } from 'class-sanitizer';
import { IsPositiveAmount } from '../../common/decorators/is-positive-amount.decorator';

export class PayDebtDto {
  @IsNotEmpty()
  @IsPositiveAmount()
  amountPaid: number;

  @IsNotEmpty()
  @IsDateString()
  paymentDate: string;

  @Trim()
  @Escape()
  @IsOptional()
  @IsString()
  notes?: string;
}
