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

/**
 * DTO for inventory item operation
 */
export class InventoryItemOperationDto {
  /**
   * معرف الصنف في المخزون
   * @example '550e8400-e29b-41d4-a716-446655440000'
   */
  @IsUUID()
  itemId: string;

  /**
   * الكمية (شراء أو صرف)
   * @example 10.5
   * @minimum 0.001
   */
  @IsNumber()
  @IsPositive()
  @Min(0.001)
  quantity: number;

  /**
   * نوع العملية: شراء (PURCHASE) أو صرف (CONSUMPTION)
   * @example 'PURCHASE'
   */
  @IsEnum(InventoryOperationType)
  operationType: InventoryOperationType;

  /**
   * سعر الوحدة (مطلوب للشراء فقط)
   * @example 5.5
   * @minimum 0
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}
