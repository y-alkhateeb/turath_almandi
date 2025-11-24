import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  IsIn,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportType } from '@prisma/client';
import {
  DataSourceType,
  DATA_SOURCES,
  FieldDataType,
  FIELD_DATA_TYPES,
  FilterOperator,
  FILTER_OPERATORS,
  AggregationFunction,
  AGGREGATION_FUNCTIONS,
  ExportFormat,
  EXPORT_FORMATS,
  SortDirection,
} from '../types/report.types';

// ============================================
// NESTED DTOs
// ============================================

export class DataSourceDto {
  @ApiProperty({ enum: DATA_SOURCES })
  @IsIn([...DATA_SOURCES])
  type: DataSourceType;
}

export class ReportFieldDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sourceField: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  displayName: string;

  @ApiProperty({ enum: FIELD_DATA_TYPES })
  @IsIn([...FIELD_DATA_TYPES])
  dataType: FieldDataType;

  @ApiProperty()
  @IsBoolean()
  visible: boolean;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  order: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  format?: string;

  @ApiPropertyOptional({ enum: AGGREGATION_FUNCTIONS })
  @IsOptional()
  @IsIn([...AGGREGATION_FUNCTIONS])
  aggregation?: AggregationFunction;
}

export class ReportFilterDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  field: string;

  @ApiProperty({ enum: FILTER_OPERATORS })
  @IsIn([...FILTER_OPERATORS])
  operator: FilterOperator;

  @ApiPropertyOptional()
  @IsOptional()
  value?: string | number | boolean | string[] | number[] | [string, string] | [number, number];

  @ApiPropertyOptional({ enum: ['AND', 'OR'] })
  @IsOptional()
  @IsIn(['AND', 'OR'])
  logicalOperator?: 'AND' | 'OR';
}

export class ReportOrderByDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  field: string;

  @ApiProperty({ enum: ['asc', 'desc'] })
  @IsIn(['asc', 'desc'])
  direction: SortDirection;
}

export class ReportGroupByDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  field: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  displayName: string;
}

export class ReportAggregationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  field: string;

  @ApiProperty({ enum: AGGREGATION_FUNCTIONS })
  @IsIn([...AGGREGATION_FUNCTIONS])
  function: AggregationFunction;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  alias: string;
}

export class ReportPaginationDto {
  @ApiProperty()
  @IsBoolean()
  enabled: boolean;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  page: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(1000)
  pageSize: number;
}

export class ReportExportOptionsDto {
  @ApiProperty({ type: [String], enum: EXPORT_FORMATS })
  @IsArray()
  @IsIn([...EXPORT_FORMATS], { each: true })
  formats: ExportFormat[];

  @ApiProperty()
  @IsBoolean()
  includeCharts: boolean;

  @ApiProperty()
  @IsBoolean()
  includeRawData: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fileName?: string;
}

// ============================================
// MAIN DTOs
// ============================================

export class ReportConfigurationDto {
  @ApiProperty({ type: DataSourceDto })
  @ValidateNested()
  @Type(() => DataSourceDto)
  dataSource: DataSourceDto;

  @ApiProperty({ type: [ReportFieldDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportFieldDto)
  fields: ReportFieldDto[];

  @ApiProperty({ type: [ReportFilterDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportFilterDto)
  filters: ReportFilterDto[];

  @ApiPropertyOptional({ type: [ReportGroupByDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportGroupByDto)
  groupBy?: ReportGroupByDto[];

  @ApiProperty({ type: [ReportOrderByDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportOrderByDto)
  orderBy: ReportOrderByDto[];

  @ApiPropertyOptional({ type: [ReportAggregationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportAggregationDto)
  aggregations?: ReportAggregationDto[];

  @ApiPropertyOptional({ type: ReportPaginationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReportPaginationDto)
  pagination?: ReportPaginationDto;

  @ApiProperty({ type: ReportExportOptionsDto })
  @ValidateNested()
  @Type(() => ReportExportOptionsDto)
  exportOptions: ReportExportOptionsDto;
}

export class CreateTemplateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ReportType })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty({ type: ReportConfigurationDto })
  @ValidateNested()
  @Type(() => ReportConfigurationDto)
  config: ReportConfigurationDto;

  @ApiProperty()
  @IsBoolean()
  isPublic: boolean;
}

export class UpdateTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: ReportConfigurationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReportConfigurationDto)
  config?: ReportConfigurationDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class ExecuteReportDto {
  @ApiProperty({ type: ReportConfigurationDto })
  @ValidateNested()
  @Type(() => ReportConfigurationDto)
  config: ReportConfigurationDto;
}

export class ExportReportDto extends ExecuteReportDto {
  @ApiProperty({ enum: EXPORT_FORMATS })
  @IsIn([...EXPORT_FORMATS])
  format: ExportFormat;
}
