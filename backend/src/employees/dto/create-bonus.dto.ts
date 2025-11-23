import { IsNotEmpty, IsNumber, IsString, IsDateString, IsOptional, Min } from 'class-validator';

export class CreateBonusDto {
  @IsNumber()
  @Min(0.01, { message: 'يجب أن يكون مبلغ المكافأة أكبر من 0' })
  @IsNotEmpty({ message: 'مبلغ المكافأة مطلوب' })
  amount: number;

  @IsDateString({}, { message: 'يجب أن يكون تاريخ المكافأة تاريخًا صحيحًا' })
  @IsNotEmpty({ message: 'تاريخ المكافأة مطلوب' })
  bonusDate: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
