import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsEnum,
  Min,
  ValidateIf,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { InventoryUnit } from '../../common/types/prisma-enums';

export class CreatePurchaseExpenseDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  // Currency removed - now frontend-only display

  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Vendor name must be at least 2 characters' })
  vendorName: string;

  @IsBoolean()
  addToInventory: boolean;

  // Inventory fields (required when addToInventory is true)
  @IsString()
  @ValidateIf((o) => o.addToInventory === true)
  @IsNotEmpty({ message: 'Item name is required when adding to inventory' })
  @MinLength(2, { message: 'Item name must be at least 2 characters' })
  itemName?: string;

  @IsNumber()
  @ValidateIf((o) => o.addToInventory === true)
  @Min(0.01, { message: 'Quantity must be greater than 0' })
  @Transform(({ value }) => parseFloat(value))
  quantity?: number;

  @IsEnum(InventoryUnit)
  @ValidateIf((o) => o.addToInventory === true)
  @IsNotEmpty({ message: 'Unit is required when adding to inventory' })
  unit?: InventoryUnit;

  @IsString()
  @IsOptional()
  notes?: string;
}
