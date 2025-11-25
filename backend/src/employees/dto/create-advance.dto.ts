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

export class CreateAdvanceDto {
  @IsUUID('4', { message: 'معرف الموظف يجب أن يكون UUID صالح' })
  employeeId: string;

  @IsNumber({}, { message: 'مبلغ السلفة يجب أن يكون رقمًا' })
  @Min(1, { message: 'مبلغ السلفة يجب أن يكون أكبر من صفر' })
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @IsNumber({}, { message: 'القسط الشهري يجب أن يكون رقمًا' })
  @Min(1, { message: 'القسط الشهري يجب أن يكون أكبر من صفر' })
  @Transform(({ value }) => parseFloat(value))
  monthlyDeduction: number;

  @IsDateString({}, { message: 'تاريخ السلفة يجب أن يكون تاريخًا صالحًا' })
  advanceDate: string;

  @Trim()
  @Escape()
  @IsString()
  @IsOptional()
  reason?: string;
}
