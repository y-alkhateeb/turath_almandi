import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsBoolean,
  Min,
  MinLength,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { InventoryUnit } from '../../common/types/prisma-enums';

export class UpdateInventoryDto {
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Item name must be at least 2 characters' })
  name?: string;

  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Quantity must be greater than or equal to 0' })
  @Transform(({ value }) => parseFloat(value))
  quantity?: number;

  @IsEnum(InventoryUnit)
  @IsOptional()
  unit?: InventoryUnit;

  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'سعر الشراء يجب أن يكون صفر أو أكبر' })
  @Transform(({ value }) => parseFloat(value))
  costPerUnit?: number; // سعر الشراء

  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'سعر البيع يجب أن يكون صفر أو أكبر' })
  @Transform(({ value }) => (value === undefined || value === null ? null : parseFloat(value)))
  sellingPrice?: number | null; // سعر البيع

  @IsString()
  @IsOptional()
  notes?: string;
}
