import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { TransactionType } from '@prisma/client';
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  TRANSACTION_CATEGORIES,
  CATEGORY_LABELS_AR,
} from '../constants/transaction-categories';

interface TransactionWithTypeAndCategory {
  type: TransactionType;
  category?: string;
}

@ValidatorConstraint({ name: 'isValidCategory', async: false })
export class IsValidCategoryConstraint implements ValidatorConstraintInterface {
  validate(category: string | undefined, args: ValidationArguments): boolean {
    // If category is not provided, validation passes (handled by @IsOptional)
    if (!category) {
      return true;
    }

    const object = args.object as TransactionWithTypeAndCategory;
    const transactionType = object.type;

    // Check if category is in the predefined list
    if (!TRANSACTION_CATEGORIES.includes(category as any)) {
      return false;
    }

    // If transaction type is specified, validate category matches the type
    if (transactionType === TransactionType.INCOME) {
      return INCOME_CATEGORIES.includes(category as any);
    }

    if (transactionType === TransactionType.EXPENSE) {
      return EXPENSE_CATEGORIES.includes(category as any);
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const object = args.object as TransactionWithTypeAndCategory;
    const transactionType = object.type;

    if (transactionType === TransactionType.INCOME) {
      const validCategories = INCOME_CATEGORIES.map(cat => CATEGORY_LABELS_AR[cat]).join('، ');
      return `الفئة يجب أن تكون واحدة من فئات الإيرادات: ${validCategories}`;
    }

    if (transactionType === TransactionType.EXPENSE) {
      const validCategories = EXPENSE_CATEGORIES.map(cat => CATEGORY_LABELS_AR[cat]).join('، ');
      return `الفئة يجب أن تكون واحدة من فئات المصروفات: ${validCategories}`;
    }

    return 'الفئة غير صالحة';
  }
}

export function IsValidCategory(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidCategoryConstraint,
    });
  };
}
