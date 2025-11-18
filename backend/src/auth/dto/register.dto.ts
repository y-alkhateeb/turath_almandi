import { IsString, MinLength, MaxLength, IsEnum, IsOptional, IsUUID, Matches } from 'class-validator';

export enum UserRole {
  ADMIN = 'ADMIN',
  ACCOUNTANT = 'ACCOUNTANT',
}

export class RegisterDto {
  @IsString()
  @MinLength(3, { message: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' })
  @MaxLength(100, { message: 'اسم المستخدم يجب ألا يتجاوز 100 حرف' })
  username: string;

  @IsString({ message: 'كلمة المرور يجب أن تكون نصاً' })
  @MinLength(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
  @MaxLength(100, { message: 'كلمة المرور يجب ألا تتجاوز 100 حرف' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم ورمز خاص (@$!%*?&)',
  })
  password: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'الدور يجب أن يكون ADMIN أو ACCOUNTANT' })
  role?: UserRole;

  @IsOptional()
  @IsUUID('4', { message: 'معرف الفرع يجب أن يكون UUID صالح' })
  branchId?: string;
}
