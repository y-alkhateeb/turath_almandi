import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class UpdateBranchDto {
  @IsString({ message: 'اسم الفرع يجب أن يكون نصاً' })
  @IsOptional()
  @MaxLength(200, { message: 'اسم الفرع يجب ألا يتجاوز 200 حرف' })
  name?: string;

  @IsString({ message: 'الموقع يجب أن يكون نصاً' })
  @IsOptional()
  @MaxLength(500, { message: 'الموقع يجب ألا يتجاوز 500 حرف' })
  location?: string;

  @IsString({ message: 'اسم المدير يجب أن يكون نصاً' })
  @IsOptional()
  @MaxLength(200, { message: 'اسم المدير يجب ألا يتجاوز 200 حرف' })
  managerName?: string;

  @IsString({ message: 'رقم الهاتف يجب أن يكون نصاً' })
  @IsOptional()
  @MaxLength(50, { message: 'رقم الهاتف يجب ألا يتجاوز 50 حرف' })
  phone?: string;

  @IsBoolean({ message: 'حالة النشاط يجب أن تكون قيمة منطقية' })
  @IsOptional()
  isActive?: boolean;
}
