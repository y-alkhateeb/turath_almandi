import { IsDateString, IsNotEmpty } from 'class-validator';
import { IsNotFutureDate } from '../../common/decorators/is-not-future-date.decorator';

export class ResignEmployeeDto {
  @IsDateString({}, { message: 'تاريخ الاستقالة يجب أن يكون بصيغة صحيحة' })
  @IsNotEmpty({ message: 'تاريخ الاستقالة مطلوب' })
  @IsNotFutureDate({ message: 'تاريخ الاستقالة لا يمكن أن يكون في المستقبل' })
  resignDate: string;
}
