import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { Trim, Escape } from 'class-sanitizer';
import { EmployeeStatus } from '@prisma/client';
import { IsPositiveAmount } from '../../common/decorators/is-positive-amount.decorator';
import { IsNotFutureDate } from '../../common/decorators/is-not-future-date.decorator';

export class UpdateEmployeeDto {
  @Trim()
  @Escape()
  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'اسم الموظف يجب أن لا يتجاوز 200 حرف' })
  name?: string;

  @Trim()
  @Escape()
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'المنصب يجب أن لا يتجاوز 100 حرف' })
  position?: string;

  @IsPositiveAmount({ message: 'الراتب الأساسي يجب أن يكون رقم موجب' })
  @IsOptional()
  baseSalary?: number;

  @IsPositiveAmount({ message: 'البدل يجب أن يكون رقم موجب' })
  @IsOptional()
  allowance?: number;

  @IsDateString({}, { message: 'تاريخ التوظيف يجب أن يكون بصيغة صحيحة' })
  @IsNotFutureDate({ message: 'تاريخ التوظيف لا يمكن أن يكون في المستقبل' })
  @IsOptional()
  hireDate?: string;

  @IsEnum(EmployeeStatus, { message: 'حالة الموظف يجب أن تكون: ACTIVE أو RESIGNED' })
  @IsOptional()
  status?: EmployeeStatus;
}
