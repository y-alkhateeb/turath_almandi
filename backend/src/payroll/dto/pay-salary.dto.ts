import { IsString, IsNotEmpty, IsUUID, IsDateString, Equals, IsOptional, MaxLength } from 'class-validator';
import { Trim, Escape } from 'class-sanitizer';

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
}