import {
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsPositiveAmount } from '../../common/decorators/is-positive-amount.decorator';

export class PayDebtDto {
  @IsNotEmpty()
  @IsPositiveAmount()
  amountPaid: number;

  @IsNotEmpty()
  @IsDateString()
  paymentDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
