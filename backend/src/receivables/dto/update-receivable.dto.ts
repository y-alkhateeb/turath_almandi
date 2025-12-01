import { PartialType } from '@nestjs/mapped-types';
import { CreateReceivableDto } from './create-receivable.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { DebtStatus } from '../../common/types/prisma-enums';

export class UpdateReceivableDto extends PartialType(CreateReceivableDto) {
  @IsEnum(DebtStatus, { message: 'Invalid receivable status' })
  @IsOptional()
  status?: DebtStatus;
}
