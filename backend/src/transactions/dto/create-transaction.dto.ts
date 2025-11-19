import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Trim, Escape } from 'class-sanitizer';
import { TransactionType, PaymentMethod, Currency } from '@prisma/client';
import { IsPositiveAmount } from '../../common/decorators/is-positive-amount.decorator';
import { IsAllowedCurrency } from '../../common/decorators/is-allowed-currency.decorator';
import { IsNotFutureDate } from '../../common/decorators/is-not-future-date.decorator';
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

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  @IsNotEmpty()
  type: TransactionType;

  @IsPositiveAmount()
  amount: number;

  @IsEnum(Currency)
  @IsOptional()
  @IsAllowedCurrency()
  currency?: Currency;

  @IsEnum(PaymentMethod, { message: 'طريقة الدفع يجب أن تكون: CASH أو MASTER' })
  @IsOptional()
  @ValidateIf((o) => o.type === TransactionType.INCOME)
  paymentMethod?: PaymentMethod;

  @Trim()
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
  @IsNotEmpty()
  @IsNotFutureDate()
  date: string;

  @Trim()
  @Escape()
  @IsString()
  @IsOptional()
  employeeVendorName?: string;

  @Trim()
  @Escape()
  @IsString()
  @IsOptional()
  notes?: string;
}
