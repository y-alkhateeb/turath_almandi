import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { UserRole } from '@prisma/client';

interface UserWithRole {
  role: UserRole;
  branchId?: string | null;
}

@ValidatorConstraint({ name: 'validateBranchByRole', async: false })
export class ValidateBranchByRoleConstraint implements ValidatorConstraintInterface {
  validate(branchId: string | null | undefined, args: ValidationArguments): boolean {
    const object = args.object as UserWithRole;
    const role = object.role;

    // If role is ACCOUNTANT, branchId is required
    if (role === UserRole.ACCOUNTANT && !branchId) {
      return false;
    }

    // If role is ADMIN, branchId must be null or undefined
    if (role === UserRole.ADMIN && branchId) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const object = args.object as UserWithRole;
    const role = object.role;

    if (role === UserRole.ACCOUNTANT) {
      return 'المحاسب يجب أن يكون مرتبطاً بفرع';
    }

    if (role === UserRole.ADMIN) {
      return 'المسؤول لا يجب أن يكون مرتبطاً بفرع';
    }

    return 'الفرع غير صالح للدور المحدد';
  }
}

export function ValidateBranchByRole(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ValidateBranchByRoleConstraint,
    });
  };
}
