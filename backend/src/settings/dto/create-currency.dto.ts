import { IsString, IsNotEmpty, Length, Matches, MaxLength, MinLength } from 'class-validator';
import { Trim, Escape } from 'class-sanitizer';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCurrencyDto {
  @ApiProperty({
    description: 'ISO 4217 currency code (3 uppercase letters)',
    example: 'USD',
    minLength: 3,
    maxLength: 3,
    pattern: '^[A-Z]{3}$',
  })
  @Trim()
  @Transform(({ value }) => value?.toUpperCase())
  @IsString({ message: 'رمز العملة يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'رمز العملة مطلوب' })
  @Length(3, 3, { message: 'رمز العملة يجب أن يكون 3 أحرف بالضبط' })
  @Matches(/^[A-Z]{3}$/, { message: 'رمز العملة يجب أن يحتوي على 3 أحرف إنجليزية كبيرة فقط' })
  code: string;

  @ApiProperty({
    description: 'Currency name in Arabic',
    example: 'دولار أمريكي',
    minLength: 1,
    maxLength: 100,
  })
  @Trim()
  @Escape()
  @IsString({ message: 'الاسم العربي يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'الاسم العربي مطلوب' })
  @MinLength(1, { message: 'الاسم العربي يجب ألا يكون فارغاً' })
  @MaxLength(100, { message: 'الاسم العربي يجب ألا يتجاوز 100 حرف' })
  name_ar: string;

  @ApiProperty({
    description: 'Currency name in English',
    example: 'US Dollar',
    minLength: 1,
    maxLength: 100,
  })
  @Trim()
  @Escape()
  @IsString({ message: 'الاسم الإنجليزي يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'الاسم الإنجليزي مطلوب' })
  @MinLength(1, { message: 'الاسم الإنجليزي يجب ألا يكون فارغاً' })
  @MaxLength(100, { message: 'الاسم الإنجليزي يجب ألا يتجاوز 100 حرف' })
  name_en: string;

  @ApiProperty({
    description: 'Currency symbol',
    example: '$',
    minLength: 1,
    maxLength: 10,
  })
  @Trim()
  @IsString({ message: 'رمز العملة يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'رمز العملة مطلوب' })
  @MinLength(1, { message: 'رمز العملة يجب ألا يكون فارغاً' })
  @MaxLength(10, { message: 'رمز العملة يجب ألا يتجاوز 10 أحرف' })
  symbol: string;
}
