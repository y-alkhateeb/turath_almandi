import { PartialType } from '@nestjs/mapped-types';
import { CreateDiscountReasonDto } from './create-discount-reason.dto';

export class UpdateDiscountReasonDto extends PartialType(CreateDiscountReasonDto) {}
