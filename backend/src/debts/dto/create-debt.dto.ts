import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Transform } from 'class-transformer';

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
    return 'Due date must be greater than or equal to date';
  }
}

export class CreateDebtDto {
  @IsString()
  @IsNotEmpty({ message: 'Creditor name is required' })
  creditorName: string;

  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @IsDateString()
  @IsNotEmpty({ message: 'Date is required' })
  date: string;

  @IsDateString()
  @IsNotEmpty({ message: 'Due date is required' })
  @Validate(IsDateAfterOrEqual)
  dueDate: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
