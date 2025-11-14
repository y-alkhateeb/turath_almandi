import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateBranchDto {
  @IsString({ message: 'اسم الفرع يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'اسم الفرع مطلوب' })
  @MaxLength(200, { message: 'اسم الفرع يجب ألا يتجاوز 200 حرف' })
  name: string;

  @IsString({ message: 'الموقع يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'الموقع مطلوب' })
  @MaxLength(500, { message: 'الموقع يجب ألا يتجاوز 500 حرف' })
  location: string;

  @IsString({ message: 'اسم المدير يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'اسم المدير مطلوب' })
  @MaxLength(200, { message: 'اسم المدير يجب ألا يتجاوز 200 حرف' })
  managerName: string;

  @IsString({ message: 'رقم الهاتف يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  @MaxLength(50, { message: 'رقم الهاتف يجب ألا يتجاوز 50 حرف' })
  phone: string;
}
