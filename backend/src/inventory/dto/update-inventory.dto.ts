import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  Min,
  MinLength,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { InventoryUnit } from '@prisma/client';

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
  @Min(0, { message: 'Cost per unit must be greater than or equal to 0' })
  @Transform(({ value }) => parseFloat(value))
  costPerUnit?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
