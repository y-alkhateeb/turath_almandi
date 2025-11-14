import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class UpdateBranchDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  location?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  managerName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
