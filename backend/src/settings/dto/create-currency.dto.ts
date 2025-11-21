import { IsString, IsNotEmpty, Length, Matches, MaxLength, MinLength } from 'class-validator';
import { Trim, Escape } from 'class-sanitizer';
import { Transform } from 'class-transformer';

export class CreateCurrencyDto {
  @Trim()
  @Transform(({ value }) => value?.toUpperCase())
  @IsString({ message: 'رمز العملة يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'رمز العملة مطلوب' })
  @Length(3, 3, { message: 'رمز العملة يجب أن يكون 3 أحرف بالضبط' })
  @Matches(/^[A-Z]{3}$/, { message: 'رمز العملة يجب أن يحتوي على 3 أحرف إنجليزية كبيرة فقط' })
  code: string;

  @Trim()
  @Escape()
  @IsString({ message: 'الاسم العربي يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'الاسم العربي مطلوب' })
  @MinLength(1, { message: 'الاسم العربي يجب ألا يكون فارغاً' })
  @MaxLength(100, { message: 'الاسم العربي يجب ألا يتجاوز 100 حرف' })
  nameAr: string;

  @Trim()
  @Escape()
  @IsString({ message: 'الاسم الإنجليزي يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'الاسم الإنجليزي مطلوب' })
  @MinLength(1, { message: 'الاسم الإنجليزي يجب ألا يكون فارغاً' })
  @MaxLength(100, { message: 'الاسم الإنجليزي يجب ألا يتجاوز 100 حرف' })
  nameEn: string;

  @Trim()
  @IsString({ message: 'رمز العملة يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'رمز العملة مطلوب' })
  @MinLength(1, { message: 'رمز العملة يجب ألا يكون فارغاً' })
  @MaxLength(10, { message: 'رمز العملة يجب ألا يتجاوز 10 أحرف' })
  symbol: string;
}
