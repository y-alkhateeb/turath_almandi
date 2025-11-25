import {
  IsString,
  IsNumber,
  IsUUID,
  IsOptional,
  Min,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Trim, Escape } from 'class-sanitizer';

export class RecordDeductionDto {
  @IsUUID('4', { message: 'معرف السلفة يجب أن يكون UUID صالح' })
  advanceId: string;

  @IsNumber({}, { message: 'مبلغ الخصم يجب أن يكون رقمًا' })
  @Min(0.01, { message: 'مبلغ الخصم يجب أن يكون أكبر من صفر' })
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @IsDateString({}, { message: 'تاريخ الخصم يجب أن يكون تاريخًا صالحًا' })
  deductionDate: string;

  @IsUUID('4', { message: 'معرف دفعة الراتب يجب أن يكون UUID صالح' })
  @IsOptional()
  salaryPaymentId?: string;

  @Trim()
  @Escape()
  @IsString()
  @IsOptional()
  notes?: string;
}
