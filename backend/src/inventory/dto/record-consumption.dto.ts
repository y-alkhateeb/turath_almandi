import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDateString, IsEnum, IsUUID, Min } from 'class-validator';
import { InventoryUnit } from '../../common/types/prisma-enums';

export class RecordConsumptionDto {
  @IsNotEmpty()
  @IsOptional()
  @IsUUID('4', { message: 'معرف العنصر يجب أن يكون UUID صالح' })
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
