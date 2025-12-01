import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min, MaxLength } from 'class-validator';
import { Trim, Escape } from 'class-sanitizer';

export class CreateDiscountReasonDto {
  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'السبب مطلوب' })
  @MaxLength(200, { message: 'السبب يجب ألا يتجاوز 200 حرف' })
  reason: string;

  @Trim()
  @Escape()
  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
