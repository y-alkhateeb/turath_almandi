import { IsString, IsOptional, IsUrl, MaxLength } from 'class-validator';

/**
 * DTO for updating app settings
 * Note: appName and appIconUrl are now static constants and cannot be updated
 * Only loginBackgroundUrl is updatable
 */
export class UpdateAppSettingsDto {
  @IsOptional()
  @IsString({ message: 'رابط صورة تسجيل الدخول يجب أن يكون نص' })
  @IsUrl({}, { message: 'رابط صورة تسجيل الدخول يجب أن يكون رابط صحيح' })
  @MaxLength(2000, { message: 'رابط صورة تسجيل الدخول يجب ألا يتجاوز 2000 حرف' })
  loginBackgroundUrl?: string;
}
