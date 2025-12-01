import { PartialType } from '@nestjs/mapped-types';
import { CreateInventorySubUnitDto } from './create-inventory-sub-unit.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateInventorySubUnitDto extends PartialType(CreateInventorySubUnitDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
