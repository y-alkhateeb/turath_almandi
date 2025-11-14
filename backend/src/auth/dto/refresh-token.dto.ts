import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'رمز التحديث مطلوب' })
  refresh_token: string;
}
