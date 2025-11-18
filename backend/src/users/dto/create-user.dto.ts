import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEnum,
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';
import { UserRole } from '@prisma/client';
import { ValidateBranchByRole } from '../../common/decorators/validate-branch-by-role.decorator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsString({ message: 'كلمة المرور يجب أن تكون نصاً' })
  @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
  @MinLength(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
  @MaxLength(100, { message: 'كلمة المرور يجب ألا تتجاوز 100 حرف' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم ورمز خاص (@$!%*?&)',
  })
  password: string;

  @IsEnum(UserRole, { message: 'الدور يجب أن يكون: ADMIN أو ACCOUNTANT' })
  @IsNotEmpty()
  role: UserRole;

  @IsUUID()
  @IsOptional()
  @ValidateBranchByRole()
  branchId?: string | null;
}
