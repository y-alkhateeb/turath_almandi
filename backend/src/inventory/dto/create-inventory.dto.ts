import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsUUID,
  IsBoolean,
  Min,
  MinLength,
  IsOptional,
} from 'class-validator';
import { Trim, Escape } from 'class-sanitizer';
import { Transform } from 'class-transformer';
import { InventoryUnit } from '../../common/types/prisma-enums';

export class CreateInventoryDto {
  @Trim()
  @Escape()
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Item name must be at least 2 characters' })
  name: string;

  @IsNumber()
  @Min(0, { message: 'Quantity must be greater than or equal to 0' })
  @Transform(({ value }) => (value === undefined || value === null || value === '' ? 0 : parseFloat(value)))
  @IsOptional()
  quantity?: number = 0;

  @IsEnum(InventoryUnit, { message: 'الوحدة يجب أن تكون واحدة من القيم المسموحة: KG, PIECE, LITER, OTHER' })
  @IsNotEmpty()
  unit: InventoryUnit;

  @IsNumber()
  @Min(0, { message: 'سعر الشراء يجب أن يكون صفر أو أكبر' })
  @Transform(({ value }) => (value === undefined || value === null || value === '' ? 0 : parseFloat(value)))
  @IsOptional()
  costPerUnit?: number = 0; // سعر الشراء

  @IsNumber()
  @Min(0, { message: 'سعر البيع يجب أن يكون صفر أو أكبر' })
  @Transform(({ value }) => (value === undefined || value === null || value === '' ? null : parseFloat(value)))
  @IsOptional()
  sellingPrice?: number | null; // سعر البيع

  @Trim()
  @Escape()
  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID('4', { message: 'معرف الفرع يجب أن يكون UUID صالح' })
  @IsOptional()
  branchId?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isInternalConsumption?: boolean = false;
}
