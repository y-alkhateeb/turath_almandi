import { IsString, IsNotEmpty, IsEnum, IsUUID, IsNumber, IsPositive, IsDateString, IsOptional } from 'class-validator';
import { EmployeeAdjustmentType } from '@prisma/client';

export class CreateAdjustmentDto {
  @IsUUID()
  @IsNotEmpty({ message: 'معرف الموظف مطلوب' })
  employeeId: string;

  @IsEnum(EmployeeAdjustmentType, { message: 'نوع التسوية غير صالح' })
  @IsNotEmpty({ message: 'نوع التسوية مطلوب' })
  type: EmployeeAdjustmentType;

  @IsNumber()
  @IsPositive({ message: 'المبلغ يجب أن يكون أكبر من صفر' })
  amount: number;

  @IsDateString({}, { message: 'صيغة التاريخ غير صالحة' })
  @IsNotEmpty({ message: 'التاريخ مطلوب' })
  date: string;

  @IsString({ message: 'الوصف يجب أن يكون نصاً' })
  @IsOptional()
  description?: string;
}