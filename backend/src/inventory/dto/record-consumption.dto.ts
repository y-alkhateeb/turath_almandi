import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDateString, IsEnum, Min } from 'class-validator';
import { InventoryUnit } from '@prisma/client';

export class RecordConsumptionDto {
  @IsNotEmpty()
  @IsString()
  inventoryItemId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsNotEmpty()
  @IsEnum(InventoryUnit)
  unit: InventoryUnit;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsNotEmpty()
  @IsDateString()
  consumedAt: string;
}
