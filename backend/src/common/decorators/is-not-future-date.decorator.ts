import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Custom validator constraint to check if a date is not in the future
 */
@ValidatorConstraint({ name: 'isNotFutureDate', async: false })
export class IsNotFutureDateConstraint implements ValidatorConstraintInterface {
  validate(dateString: any, args: ValidationArguments): boolean {
    if (!dateString) {
      return true; // Let @IsNotEmpty handle empty values
    }

    try {
      const inputDate = new Date(dateString);
      const today = new Date();

      // Reset time to compare only dates (not time)
      inputDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      // Return true if date is today or in the past
      return inputDate <= today;
    } catch (error) {
      return false; // Invalid date format
    }
  }

  defaultMessage(args: ValidationArguments): string {
    return 'لا يمكن أن يكون التاريخ في المستقبل';
  }
}

/**
 * Custom decorator to validate that a date is not in the future
 *
 * Ensures the date is either today or in the past.
 * Error message is in Arabic.
 *
 * Usage:
 * @IsNotFutureDate()
 * date: string;
 */
export function IsNotFutureDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotFutureDateConstraint,
    });
  };
}
