import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsEmail,
  IsUUID,
  IsNumber,
  MaxLength,
  Matches,
  Min,
} from 'class-validator';
import { Trim, Escape } from 'class-sanitizer';
import { ContactType } from '../../common/types/prisma-enums';

export class CreateContactDto {
  @Trim()
  @Escape()
  @IsString()
  @IsNotEmpty({ message: 'اسم جهة الاتصال مطلوب' })
  @MaxLength(200, { message: 'اسم جهة الاتصال يجب ألا يتجاوز 200 حرف' })
  name: string;

  @IsEnum(ContactType, { message: 'نوع جهة الاتصال غير صالح' })
  @IsNotEmpty({ message: 'نوع جهة الاتصال مطلوب' })
  type: ContactType;

  @Trim()
  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'رقم الهاتف يجب ألا يتجاوز 20 حرف' })
  @Matches(/^[\d\s+()-]*$/, { message: 'رقم الهاتف يمكن أن يحتوي فقط على أرقام ومسافات و + - ( )' })
  phone?: string;

  @Trim()
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  @IsOptional()
  @MaxLength(100, { message: 'البريد الإلكتروني يجب ألا يتجاوز 100 حرف' })
  email?: string;

  @Trim()
  @Escape()
  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber({}, { message: 'حد الائتمان يجب أن يكون رقماً صالحاً' })
  @Min(0, { message: 'حد الائتمان يجب أن يكون صفراً أو أكثر' })
  @IsOptional()
  creditLimit?: number;

  @Trim()
  @Escape()
  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID('4', { message: 'معرف الفرع يجب أن يكون UUID صالح' })
  @IsOptional()
  branchId?: string;
}
