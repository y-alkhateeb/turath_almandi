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
      // Parse the date string (expected format: YYYY-MM-DD or ISO 8601)
      const inputDate = new Date(dateString);

      // Check if date is valid
      if (isNaN(inputDate.getTime())) {
        return false;
      }

      // Get today's date in local timezone
      const today = new Date();

      // Extract only the date parts (ignore time)
      const inputYear = inputDate.getFullYear();
      const inputMonth = inputDate.getMonth();
      const inputDay = inputDate.getDate();

      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth();
      const todayDay = today.getDate();

      // Compare dates: allow today or past dates
      if (inputYear < todayYear) return true;
      if (inputYear > todayYear) return false;

      if (inputMonth < todayMonth) return true;
      if (inputMonth > todayMonth) return false;

      return inputDay <= todayDay;
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
