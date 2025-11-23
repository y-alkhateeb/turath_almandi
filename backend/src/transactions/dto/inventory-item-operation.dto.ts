import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsNumber,
  IsEnum,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';

export enum InventoryOperationType {
  PURCHASE = 'PURCHASE',
  CONSUMPTION = 'CONSUMPTION',
}

export class InventoryItemOperationDto {
  @ApiProperty({
    description: 'معرف الصنف في المخزون',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  itemId: string;

  @ApiProperty({
    description: 'الكمية (شراء أو صرف)',
    example: 10.5,
    minimum: 0.001,
  })
  @IsNumber()
  @IsPositive()
  @Min(0.001)
  quantity: number;

  @ApiProperty({
    description: 'نوع العملية: شراء (PURCHASE) أو صرف (CONSUMPTION)',
    enum: InventoryOperationType,
    example: InventoryOperationType.PURCHASE,
  })
  @IsEnum(InventoryOperationType)
  operationType: InventoryOperationType;

  @ApiProperty({
    description: 'سعر الوحدة (مطلوب للشراء فقط)',
    example: 5.5,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}
