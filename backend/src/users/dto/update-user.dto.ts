import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUUID,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { UserRole } from '../../common/types/prisma-enums';

export class UpdateUserDto {
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsUUID()
  @IsOptional()
  branchId?: string | null;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString({ message: 'كلمة المرور يجب أن تكون نصاً' })
  @IsOptional()
  @MinLength(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
  @MaxLength(100, { message: 'كلمة المرور يجب ألا تتجاوز 100 حرف' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم ورمز خاص (@$!%*?&)',
  })
  password?: string;
}
