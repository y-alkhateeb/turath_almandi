import { IsString, IsOptional, IsUrl, MaxLength } from 'class-validator';

export class UpdateAppSettingsDto {
  @IsOptional()
  @IsString({ message: 'رابط صورة تسجيل الدخول يجب أن يكون نص' })
  @IsUrl({}, { message: 'رابط صورة تسجيل الدخول يجب أن يكون رابط صحيح' })
  @MaxLength(2000, { message: 'رابط صورة تسجيل الدخول يجب ألا يتجاوز 2000 حرف' })
  loginBackgroundUrl?: string;
}
