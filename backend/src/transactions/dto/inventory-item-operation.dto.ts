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
   * معرف الوحدة الفرعية (اختياري)
   * يستخدم عند البيع بوحدة فرعية مثل نصف فروج أو ربع فروج
   * @example '550e8400-e29b-41d4-a716-446655440001'
   */
  @IsOptional()
  @IsUUID()
  subUnitId?: string;

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

  /**
   * سعر البيع (اختياري - للشراء فقط)
   * يستخدم لتحديث سعر البيع في المخزون عند الشراء
   * @example 7.5
   * @minimum 0
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  sellingPrice?: number;
}
