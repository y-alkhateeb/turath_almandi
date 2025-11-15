import { IsString, MinLength, MaxLength, IsBoolean, IsOptional } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(3, { message: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' })
  @MaxLength(100, { message: 'اسم المستخدم يجب ألا يتجاوز 100 حرف' })
  username: string;

  @IsString()
  @MinLength(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
  password: string;

  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean;
}
