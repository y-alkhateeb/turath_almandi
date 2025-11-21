import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';
import { Trim } from 'class-sanitizer';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SetDefaultCurrencyDto {
  @ApiProperty({
    description: 'ISO 4217 currency code (3 uppercase letters)',
    example: 'IQD',
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
}
