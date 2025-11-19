import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  ValidateIf,
} from 'class-validator';
import { TransactionType, PaymentMethod } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsValidCategory } from '../../common/decorators/is-valid-category.decorator';
import {
  CATEGORY_LABELS_AR,
  TransactionCategory,
  TRANSACTION_CATEGORIES
} from '../../common/constants/transaction-categories';

// Create reverse mapping from Arabic labels to English constants
const AR_TO_CATEGORY_MAP = Object.entries(CATEGORY_LABELS_AR).reduce((acc, [key, value]) => {
  acc[value] = key as TransactionCategory;
  return acc;
}, {} as Record<string, TransactionCategory>);

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

  @Transform(({ value }) => {
    if (!value || typeof value !== 'string') return value;

    // If already an English constant, return it
    if (TRANSACTION_CATEGORIES.includes(value as TransactionCategory)) {
      return value;
    }

    // Try to map from Arabic label to English constant
    const mappedCategory = AR_TO_CATEGORY_MAP[value];
    return mappedCategory || value;
  })
  @IsString()
  @IsOptional()
  @IsValidCategory()
  category?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  employeeVendorName?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
