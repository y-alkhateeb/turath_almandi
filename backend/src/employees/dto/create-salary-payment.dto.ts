import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { Trim, Escape } from 'class-sanitizer';
import { IsPositiveAmount } from '../../common/decorators/is-positive-amount.decorator';
import { IsNotFutureDate } from '../../common/decorators/is-not-future-date.decorator';

export class CreateSalaryPaymentDto {
  @IsPositiveAmount({ message: 'مبلغ الدفع يجب أن يكون رقم موجب' })
  amount: number;

  @IsDateString({}, { message: 'تاريخ الدفع يجب أن يكون بصيغة صحيحة' })
  @IsNotEmpty({ message: 'تاريخ الدفع مطلوب' })
  @IsNotFutureDate({ message: 'تاريخ الدفع لا يمكن أن يكون في المستقبل' })
  paymentDate: string;

  @Trim()
  @Escape()
  @IsString()
  @IsOptional()
  notes?: string;
}
