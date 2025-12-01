import { IsString, IsNotEmpty, IsUUID, IsDateString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

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

  @IsEnum(PaymentMethod, { message: 'طريقة الدفع غير صالحة' })
  @IsNotEmpty({ message: 'طريقة الدفع مطلوبة' })
  paymentMethod: PaymentMethod;
}