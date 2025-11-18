import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { Currency } from '@prisma/client';
import { ALLOWED_CURRENCIES, CURRENCY_ERROR_MESSAGE } from '../constants/currency.constants';

/**
 * Validates that the currency is one of the allowed currencies
 *
 * Usage:
 * @IsAllowedCurrency()
 * currency: Currency;
 *
 * To change allowed currencies, update ALLOWED_CURRENCIES in currency.constants.ts
 */
export function IsAllowedCurrency(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAllowedCurrency',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // Allow undefined/null if the field is optional
          if (value === undefined || value === null) {
            return true;
          }

          // Check if value is a valid Currency enum
          if (!Object.values(Currency).includes(value as Currency)) {
            return false;
          }

          // Check if currency is in the allowed list
          return ALLOWED_CURRENCIES.includes(value as Currency);
        },
        defaultMessage(args: ValidationArguments) {
          return validationOptions?.message as string || CURRENCY_ERROR_MESSAGE;
        },
      },
    });
  };
}
