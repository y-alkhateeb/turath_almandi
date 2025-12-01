import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsUUID,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  MaxLength,
} from 'class-validator';
import { Trim, Escape } from 'class-sanitizer';
import { IsPositiveAmount } from '../../common/decorators/is-positive-amount.decorator';

/**
 * Custom validator to ensure due_date >= date
 */
@ValidatorConstraint({ name: 'isDateAfterOrEqual', async: false })
export class IsDateAfterOrEqual implements ValidatorConstraintInterface {
  validate(dueDate: string, args: ValidationArguments) {
    const object = args.object as any;
    if (!object.date || !dueDate) {
      return true; // Let other validators handle required validation
    }

    const date = new Date(object.date);
    const dueDateObj = new Date(dueDate);

    return dueDateObj >= date;
  }

  defaultMessage(args: ValidationArguments) {
    return 'تاريخ الاستحقاق يجب أن يكون مساوياً أو بعد تاريخ الحساب الدائن';
  }
}

export class CreatePayableDto {
  @IsUUID('4', { message: 'Contact ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Contact ID is required' })
  contactId: string;

  @IsPositiveAmount()
  amount: number;

  @IsDateString()
  @IsNotEmpty({ message: 'Date is required' })
  date: string;

  @IsDateString()
  @IsOptional()
  @Validate(IsDateAfterOrEqual)
  dueDate?: string;

  @Trim()
  @Escape()
  @IsString()
  @IsOptional()
  description?: string;

  @Trim()
  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Invoice number must not exceed 50 characters' })
  invoiceNumber?: string;

  @Trim()
  @Escape()
  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID('4', { message: 'Branch ID must be a valid UUID' })
  @IsOptional()
  branchId?: string;

  @IsUUID('4', { message: 'Transaction ID must be a valid UUID' })
  @IsOptional()
  linkedPurchaseTransactionId?: string;
}
