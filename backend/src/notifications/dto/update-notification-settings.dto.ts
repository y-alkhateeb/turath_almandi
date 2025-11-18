import {
  IsBoolean,
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  Min,
} from 'class-validator';
import { DisplayMethod } from '@prisma/client';

export class UpdateNotificationSettingsDto {
  @IsString()
  notificationType: string;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minAmount?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  selectedBranches?: string[];

  @IsEnum(DisplayMethod)
  @IsOptional()
  displayMethod?: DisplayMethod;
}
