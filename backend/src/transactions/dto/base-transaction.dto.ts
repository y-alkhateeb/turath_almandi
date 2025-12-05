import {
  IsString,
  IsOptional,
  IsDateString,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';
import { Trim, Escape } from 'class-sanitizer';
import { IsNotFutureDate } from '../../common/decorators/is-not-future-date.decorator';

/**
 * Base DTO with shared fields for all transaction types.
 * Used as a mixin/base for Income and Expense DTOs.
 */
export class BaseTransactionDto {
  /**
   * تاريخ المعاملة
   * @example '2024-12-04'
   */
  @IsDateString()
  @IsNotEmpty()
  @IsNotFutureDate()
  date: string;

  /**
   * معرف الفرع (للأدمن فقط، للمحاسب يتم تحديده تلقائياً)
   * @example '550e8400-e29b-41d4-a716-446655440000'
   */
  @IsUUID()
  @IsOptional()
  branchId?: string;



  /**
   * ملاحظات إضافية
   * @example 'دفعة أولى من المبيعات اليومية'
   */
  @Trim()
  @Escape()
  @IsString()
  @IsOptional()
  notes?: string;
}
