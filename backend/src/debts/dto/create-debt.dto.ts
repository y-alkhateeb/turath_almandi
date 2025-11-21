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
    return 'تاريخ الاستحقاق يجب أن يكون مساوياً أو بعد تاريخ الدين';
  }
}

export class CreateDebtDto {
  @Trim()
  @Escape()
  @IsString()
  @IsNotEmpty({ message: 'Creditor name is required' })
  creditorName: string;

  @IsPositiveAmount()
  amount: number;

  @IsDateString()
  @IsNotEmpty({ message: 'Date is required' })
  date: string;

  @IsDateString()
  @IsNotEmpty({ message: 'Due date is required' })
  @Validate(IsDateAfterOrEqual)
  dueDate: string;

  @Trim()
  @Escape()
  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID('4', { message: 'معرف الفرع يجب أن يكون UUID صالح' })
  @IsOptional()
  branchId?: string;
}
