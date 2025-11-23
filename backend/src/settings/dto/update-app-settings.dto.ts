import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';

export class UpdateAppSettingsDto {
  @IsOptional()
  @IsString({ message: 'رابط صورة تسجيل الدخول يجب أن يكون نص' })
  @Matches(/^(\/uploads\/|https?:\/\/)/, {
    message: 'رابط صورة تسجيل الدخول يجب أن يكون رابط صحيح (يبدأ بـ /uploads/ أو http)',
  })
  @MaxLength(2000, { message: 'رابط صورة تسجيل الدخول يجب ألا يتجاوز 2000 حرف' })
  loginBackgroundUrl?: string;

  @IsOptional()
  @IsString({ message: 'اسم التطبيق يجب أن يكون نص' })
  @MaxLength(200, { message: 'اسم التطبيق يجب ألا يتجاوز 200 حرف' })
  appName?: string;

  @IsOptional()
  @IsString({ message: 'رابط أيقونة التطبيق يجب أن يكون نص' })
  @Matches(/^(\/uploads\/|https?:\/\/)/, {
    message: 'رابط أيقونة التطبيق يجب أن يكون رابط صحيح (يبدأ بـ /uploads/ أو http)',
  })
  @MaxLength(2000, { message: 'رابط أيقونة التطبيق يجب ألا يتجاوز 2000 حرف' })
  appIconUrl?: string;
}
