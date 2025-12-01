import { PartialType } from '@nestjs/mapped-types';
import { CreatePayableDto } from './create-payable.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { DebtStatus } from '../../common/types/prisma-enums';

export class UpdatePayableDto extends PartialType(CreatePayableDto) {
  @IsEnum(DebtStatus, { message: 'Invalid payable status' })
  @IsOptional()
  status?: DebtStatus;
}
