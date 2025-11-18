import { applyDecorators } from '@nestjs/common';
import { IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Custom decorator combining common validation for positive monetary amounts
 *
 * Combines:
 * - @IsNumber(): Validates that the value is a number
 * - @Min(0.01): Ensures amount is greater than 0 (minimum 0.01)
 * - @Transform(parseFloat): Converts string input to float
 *
 * Usage:
 * @IsPositiveAmount()
 * amount: number;
 */
export function IsPositiveAmount() {
  return applyDecorators(
    IsNumber({}, { message: 'Amount must be a number' }),
    Min(0.01, { message: 'Amount must be greater than 0' }),
    Transform(({ value }) => parseFloat(value)),
  );
}
