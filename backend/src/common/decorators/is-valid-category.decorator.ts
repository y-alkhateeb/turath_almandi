import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { TransactionType } from '../types/prisma-enums';
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  TRANSACTION_CATEGORIES,
  CATEGORY_LABELS_AR,
  TransactionCategory,
} from '../constants/transaction-categories';

interface TransactionWithTypeAndCategory {
  type: TransactionType;
  category?: string;
}

// Create reverse mapping from Arabic labels to English constants
const AR_TO_CATEGORY_MAP = Object.entries(CATEGORY_LABELS_AR).reduce((acc, [key, value]) => {
  acc[value] = key as TransactionCategory;
  return acc;
}, {} as Record<string, TransactionCategory>);

@ValidatorConstraint({ name: 'isValidCategory', async: false })
export class IsValidCategoryConstraint implements ValidatorConstraintInterface {
  /**
   * Normalize category - accept both English constants and Arabic labels
   * Returns the English constant if valid, otherwise returns the original value
   */
  private normalizeCategory(category: string): string {
    // If it's already an English constant, return it
    if (TRANSACTION_CATEGORIES.includes(category as TransactionCategory)) {
      return category;
    }

    // Try to map from Arabic label to English constant
    const mappedCategory = AR_TO_CATEGORY_MAP[category];
    if (mappedCategory) {
      return mappedCategory;
    }

    // Return original value (will fail validation later)
    return category;
  }

  private isInCategory(category: string, categories: readonly string[]): boolean {
    return categories.includes(category);
  }

  validate(category: string | undefined, args: ValidationArguments): boolean {
    // If category is not provided, validation passes (handled by @IsOptional)
    if (!category) {
      return true;
    }

    const object = args.object as TransactionWithTypeAndCategory;
    const transactionType = object.type;

    // Normalize the category (accept both English constants and Arabic labels)
    const normalizedCategory = this.normalizeCategory(category);

    // Check if category is in the predefined list
    if (!this.isInCategory(normalizedCategory, TRANSACTION_CATEGORIES)) {
      return false;
    }

    // If transaction type is specified, validate category matches the type
    if (transactionType === TransactionType.INCOME) {
      return this.isInCategory(normalizedCategory, INCOME_CATEGORIES);
    }

    if (transactionType === TransactionType.EXPENSE) {
      return this.isInCategory(normalizedCategory, EXPENSE_CATEGORIES);
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
