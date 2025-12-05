import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsDateString,
  Equals,
  IsOptional,
  MaxLength,
  IsArray,
  ValidateNested,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { Trim, Escape } from 'class-sanitizer';
import { Type } from 'class-transformer';

/**
 * DTO for specifying partial advance deduction
 * Allows deducting a specific amount from an advance instead of the full amount
 */
export class AdvanceDeductionDto {
  @IsUUID()
  @IsNotEmpty({ message: 'معرف السلفة مطلوب' })
  adjustmentId: string;

  @IsNumber({}, { message: 'مبلغ الخصم يجب أن يكون رقماً' })
  @IsPositive({ message: 'مبلغ الخصم يجب أن يكون موجباً' })
  deductionAmount: number;
}

export class PaySalaryDto {
  @IsUUID()
  @IsNotEmpty({ message: 'معرف الموظف مطلوب' })
  employeeId: string;

  @IsDateString({}, { message: 'صيغة تاريخ الدفع غير صالحة' })
  @IsNotEmpty({ message: 'تاريخ الدفع مطلوب' })
  paymentDate: string;

  @IsString()
  @IsNotEmpty({ message: 'يجب تحديد شهر الراتب (YYYY-MM)' })
  salaryMonth: string; // Format: YYYY-MM

  @Equals('CASH', { message: 'طريقة الدفع يجب أن تكون نقدية فقط' })
  @IsNotEmpty({ message: 'طريقة الدفع مطلوبة' })
  paymentMethod: 'CASH';

  @Trim()
  @Escape()
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'الملاحظات يجب أن لا تتجاوز 500 حرف' })
  notes?: string;

  /**
   * Optional: Specify partial deductions for advances
   * If not provided, all pending advances will be deducted in full
   * If provided, only the specified amounts will be deducted from each advance
   */
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AdvanceDeductionDto)
  advanceDeductions?: AdvanceDeductionDto[];
}