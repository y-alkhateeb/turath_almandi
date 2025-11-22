import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { Trim, Escape } from 'class-sanitizer';
import { IsPositiveAmount } from '../../common/decorators/is-positive-amount.decorator';

export class RecordSalaryIncreaseDto {
  @IsPositiveAmount({ message: 'الراتب الجديد يجب أن يكون رقم موجب' })
  newSalary: number;

  @IsDateString({}, { message: 'تاريخ التفعيل يجب أن يكون بصيغة صحيحة' })
  @IsNotEmpty({ message: 'تاريخ التفعيل مطلوب' })
  effectiveDate: string;

  @Trim()
  @Escape()
  @IsString()
  @IsOptional()
  reason?: string;
}
