import {
  IsString,
  IsNotEmpty,
  IsUUID,
  MaxLength,
  Min,
  IsNumber,
} from 'class-validator';
import { Trim, Escape } from 'class-sanitizer';
import { Type } from 'class-transformer';

export class CreateInventorySubUnitDto {
  @IsUUID('4', { message: 'Inventory item ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Inventory item ID is required' })
  inventoryItemId: string;

  @Trim()
  @Escape()
  @IsString()
  @IsNotEmpty({ message: 'Unit name is required' })
  @MaxLength(50, { message: 'Unit name must not exceed 50 characters' })
  unitName: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Ratio must be a number' })
  @Min(0.0001, { message: 'Ratio must be greater than 0' })
  ratio: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Selling price must be a number' })
  @Min(0, { message: 'Selling price must be non-negative' })
  sellingPrice: number;
}
