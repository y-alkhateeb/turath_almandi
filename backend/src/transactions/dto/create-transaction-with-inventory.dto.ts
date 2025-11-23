import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsUUID,
  IsBoolean,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType } from '@prisma/client';
import { InventoryItemOperationDto } from './inventory-item-operation.dto';

export class CreateTransactionWithInventoryDto {
  @ApiProperty({
    description: 'نوع المعاملة',
    enum: TransactionType,
    example: TransactionType.EXPENSE,
  })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({
    description: 'المبلغ الإجمالي للمعاملة',
    example: 1500.5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiPropertyOptional({
    description: 'المبلغ المدفوع فعلياً (إذا كان أقل من الإجمالي)',
    example: 1000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @ApiPropertyOptional({
    description: 'فئة المعاملة',
    example: 'INVENTORY',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'طريقة الدفع للمبلغ المدفوع',
    enum: ['CASH', 'MASTER'],
    example: 'CASH',
  })
  @IsOptional()
  @IsEnum(['CASH', 'MASTER'])
  paymentMethod?: 'CASH' | 'MASTER';

  @ApiProperty({
    description: 'اسم الموظف أو البائع',
    example: 'أحمد محمد',
  })
  @IsString()
  @IsNotEmpty()
  employeeVendorName: string;

  @ApiProperty({
    description: 'تاريخ المعاملة',
    example: '2024-01-15',
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    description: 'ملاحظات إضافية',
    example: 'شراء مواد خام للمطعم',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'معرف الفرع (للأدمن فقط)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({
    description: 'قائمة أصناف المخزون المرتبطة بالمعاملة',
    type: [InventoryItemOperationDto],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryItemOperationDto)
  inventoryItems?: InventoryItemOperationDto[];

  @ApiPropertyOptional({
    description: 'هل نسجل المبلغ المتبقي كدين؟',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  createDebtForRemaining?: boolean;

  @ApiPropertyOptional({
    description: 'اسم الدائن (مطلوب إذا كان createDebtForRemaining = true)',
    example: 'شركة المواد الغذائية',
  })
  @ValidateIf((o) => o.createDebtForRemaining === true)
  @IsString()
  @IsNotEmpty()
  debtCreditorName?: string;

  @ApiPropertyOptional({
    description: 'تاريخ استحقاق الدين (اختياري)',
    example: '2024-02-15',
  })
  @IsOptional()
  @IsDateString()
  debtDueDate?: string;

  @ApiPropertyOptional({
    description: 'ملاحظات الدين',
    example: 'دين على دفعة المواد الخام',
  })
  @IsOptional()
  @IsString()
  debtNotes?: string;
}
