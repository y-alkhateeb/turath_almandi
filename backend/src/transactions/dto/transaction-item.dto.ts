import { IsUUID, IsNotEmpty, IsNumber, IsPositive, IsEnum, IsOptional, Min } from 'class-validator';
import { InventoryOperationType, DiscountType } from '@prisma/client';

/**
 * DTO for individual items in multi-item transactions
 */
export class TransactionItemDto {
  @IsUUID()
  @IsNotEmpty({ message: 'معرف الصنف مطلوب' })
  inventoryItemId: string;

  @IsNumber()
  @IsPositive({ message: 'الكمية يجب أن تكون أكبر من صفر' })
  quantity: number;

  @IsNumber()
  @IsPositive({ message: 'السعر يجب أن يكون أكبر من صفر' })
  unitPrice: number;

  @IsEnum(InventoryOperationType, { message: 'نوع العملية غير صالح' })
  operationType: InventoryOperationType;

  // Optional item-level discount
  @IsOptional()
  @IsEnum(DiscountType, { message: 'نوع الخصم غير صالح' })
  discountType?: DiscountType;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'قيمة الخصم يجب أن تكون صفر أو أكبر' })
  discountValue?: number;
}
