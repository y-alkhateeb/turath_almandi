import { IsString, IsOptional, IsEnum, IsBoolean, IsUUID } from 'class-validator';
import { UserRole } from '@prisma/client';

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
}
