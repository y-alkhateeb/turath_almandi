import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  ValidateIf,
  MaxLength,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { TransactionType, PaymentMethod, DiscountType } from '../../common/types/prisma-enums';
import { Transform, Type } from 'class-transformer';
import { IsValidCategory } from '../../common/decorators/is-valid-category.decorator';
import { UpdateTransactionItemDto } from './transaction-item.dto';

export class UpdateTransactionDto {
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  @Transform(({ value }) => parseFloat(value))
  @IsOptional()
  amount?: number;

  @IsEnum(PaymentMethod)
  @IsOptional()
  @ValidateIf((o) => o.type === TransactionType.INCOME || o.paymentMethod !== undefined)
  paymentMethod?: PaymentMethod;

  @IsString()
  @IsOptional()
  @IsValidCategory()
  category?: string;

  @IsDateString()
  @IsOptional()
  date?: string;



  @IsString()
  @IsOptional()
  notes?: string;

  // Discount fields
  @IsOptional()
  @IsEnum(DiscountType, { message: 'نوع الخصم غير صالح' })
  discountType?: DiscountType;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'قيمة الخصم يجب أن تكون صفر أو أكبر' })
  discountValue?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'سبب الخصم يجب ألا يتجاوز 200 حرف' })
  discountReason?: string;

  // Transaction inventory items for updating
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateTransactionItemDto)
  transactionInventoryItems?: UpdateTransactionItemDto[];
}
