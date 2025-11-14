import { IsString, MinLength, MaxLength, IsEnum, IsOptional, IsUUID } from 'class-validator';

export enum UserRole {
  ADMIN = 'ADMIN',
  ACCOUNTANT = 'ACCOUNTANT',
}

export class RegisterDto {
  @IsString()
  @MinLength(3, { message: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' })
  @MaxLength(100, { message: 'اسم المستخدم يجب ألا يتجاوز 100 حرف' })
  username: string;

  @IsString()
  @MinLength(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
  password: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'الدور يجب أن يكون ADMIN أو ACCOUNTANT' })
  role?: UserRole;

  @IsOptional()
  @IsUUID('4', { message: 'معرف الفرع يجب أن يكون UUID صالح' })
  branchId?: string;
}
