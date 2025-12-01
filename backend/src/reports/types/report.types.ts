// ============================================
// SMART REPORTS - TYPE-SAFE INTERFACES
// NO `any` TYPES ALLOWED
// ============================================

import { Prisma, ReportType } from '@prisma/client';

// ============================================
// DATA SOURCE TYPES
// ============================================

/**
 * Supported data sources for reports
 */
export const DATA_SOURCES = ['transactions', 'payables', 'receivables', 'inventory', 'salaries', 'branches'] as const;
export type DataSourceType = typeof DATA_SOURCES[number];

/**
 * Type guard for DataSourceType
 */
export function isValidDataSource(value: string): value is DataSourceType {
  return DATA_SOURCES.includes(value as DataSourceType);
}

// ============================================
// FIELD TYPES
// ============================================

export const FIELD_DATA_TYPES = ['string', 'number', 'date', 'boolean', 'enum'] as const;
export type FieldDataType = typeof FIELD_DATA_TYPES[number];

export const FIELD_FORMATS = ['currency', 'percentage', 'date-short', 'date-long', 'number', 'text'] as const;
export type FieldFormat = typeof FIELD_FORMATS[number];

/**
 * Report field configuration
 */
export interface ReportField {
  readonly id: string;
  readonly sourceField: string;
  readonly displayName: string;
  readonly dataType: FieldDataType;
  readonly visible: boolean;
  readonly order: number;
  readonly width?: number;
  readonly format?: FieldFormat;
  readonly aggregation?: AggregationFunction;
}

// ============================================
// FILTER TYPES - DISCRIMINATED UNIONS
// ============================================

export const FILTER_OPERATORS = [
  'equals',
  'notEquals',
  'greaterThan',
  'greaterThanOrEqual',
  'lessThan',
  'lessThanOrEqual',
  'contains',
  'startsWith',
  'endsWith',
  'in',
  'notIn',
  'between',
  'isNull',
  'isNotNull',
] as const;

export type FilterOperator = typeof FILTER_OPERATORS[number];

/**
 * Type guard for FilterOperator
 */
export function isValidFilterOperator(value: string): value is FilterOperator {
  return FILTER_OPERATORS.includes(value as FilterOperator);
}

/**
 * Filter value types based on field data type
 */
type FilterValueForType<T extends FieldDataType> =
  T extends 'string' ? string :
  T extends 'number' ? number :
  T extends 'date' ? string | Date :
  T extends 'boolean' ? boolean :
  T extends 'enum' ? string :
  never;

/**
 * Base filter interface
 */
interface BaseFilter {
  readonly id: string;
  readonly field: string;
  readonly logicalOperator?: 'AND' | 'OR';
}

/**
 * Single value filter (equals, notEquals, greaterThan, etc.)
 */
export interface SingleValueFilter extends BaseFilter {
  readonly operator: Exclude<FilterOperator, 'in' | 'notIn' | 'between' | 'isNull' | 'isNotNull'>;
  readonly value: string | number | boolean | Date;
}

/**
 * Array value filter (in, notIn)
 */
export interface ArrayValueFilter extends BaseFilter {
  readonly operator: 'in' | 'notIn';
  readonly value: ReadonlyArray<string | number>;
}

/**
 * Range filter (between)
 */
export interface RangeFilter extends BaseFilter {
  readonly operator: 'between';
  readonly value: readonly [string | number | Date, string | number | Date];
}

/**
 * Null check filter (isNull, isNotNull)
 */
export interface NullCheckFilter extends BaseFilter {
  readonly operator: 'isNull' | 'isNotNull';
  readonly value?: never;
}

/**
 * Union type for all filter types
 */
export type ReportFilter = SingleValueFilter | ArrayValueFilter | RangeFilter | NullCheckFilter;

/**
 * Type guard functions for filters
 */
export function isSingleValueFilter(filter: ReportFilter): filter is SingleValueFilter {
  return !['in', 'notIn', 'between', 'isNull', 'isNotNull'].includes(filter.operator);
}

export function isArrayValueFilter(filter: ReportFilter): filter is ArrayValueFilter {
  return filter.operator === 'in' || filter.operator === 'notIn';
}

export function isRangeFilter(filter: ReportFilter): filter is RangeFilter {
  return filter.operator === 'between';
}

export function isNullCheckFilter(filter: ReportFilter): filter is NullCheckFilter {
  return filter.operator === 'isNull' || filter.operator === 'isNotNull';
}

// ============================================
// SORTING & GROUPING TYPES
// ============================================

export type SortDirection = 'asc' | 'desc';

export interface ReportOrderBy {
  readonly field: string;
  readonly direction: SortDirection;
}

export interface ReportGroupBy {
  readonly field: string;
  readonly displayName: string;
}

// ============================================
// AGGREGATION TYPES
// ============================================

export const AGGREGATION_FUNCTIONS = ['sum', 'avg', 'count', 'min', 'max'] as const;
export type AggregationFunction = typeof AGGREGATION_FUNCTIONS[number];

export interface ReportAggregation {
  readonly field: string;
  readonly function: AggregationFunction;
  readonly alias: string;
}

// ============================================
// PAGINATION TYPES
// ============================================

export interface ReportPagination {
  readonly enabled: boolean;
  readonly page: number;
  readonly pageSize: number;
}

// ============================================
// EXPORT TYPES
// ============================================

export const EXPORT_FORMATS = ['excel', 'pdf', 'csv'] as const;
export type ExportFormat = typeof EXPORT_FORMATS[number];

export interface ReportExportOptions {
  readonly formats: ReadonlyArray<ExportFormat>;
  readonly includeCharts: boolean;
  readonly includeRawData: boolean;
  readonly fileName?: string;
}

// ============================================
// MAIN CONFIGURATION TYPE
// ============================================

export interface ReportDataSource {
  readonly type: DataSourceType;
}

export interface ReportConfiguration {
  readonly dataSource: ReportDataSource;
  readonly fields: ReadonlyArray<ReportField>;
  readonly filters: ReadonlyArray<ReportFilter>;
  readonly groupBy?: ReadonlyArray<ReportGroupBy>;
  readonly orderBy: ReadonlyArray<ReportOrderBy>;
  readonly aggregations?: ReadonlyArray<ReportAggregation>;
  readonly pagination?: ReportPagination;
  readonly exportOptions: ReportExportOptions;
}

// ============================================
// QUERY RESULT TYPES
// ============================================

/**
 * Generic result row type
 */
export type ReportResultRow = Record<string, string | number | boolean | Date | null>;

/**
 * Aggregation result type
 */
export interface AggregationResult {
  readonly [alias: string]: number | null;
}

/**
 * Grouped result type
 */
export interface GroupedResult {
  readonly groupKey: Record<string, string | number | boolean | Date | null>;
  readonly rows: ReadonlyArray<ReportResultRow>;
  readonly aggregations: AggregationResult;
}

/**
 * Query execution result
 */
export interface QueryResult {
  readonly data: ReadonlyArray<ReportResultRow>;
  readonly totalCount: number;
  readonly aggregations?: AggregationResult;
  readonly groupedData?: ReadonlyArray<GroupedResult>;
  readonly executionTime: number;
}

// ============================================
// FIELD METADATA TYPES
// ============================================

export interface FieldMetadata {
  readonly id: string;
  readonly dataSource: DataSourceType;
  readonly fieldName: string;
  readonly displayName: string;
  readonly description?: string;
  readonly dataType: FieldDataType;
  readonly filterable: boolean;
  readonly sortable: boolean;
  readonly aggregatable: boolean;
  readonly groupable: boolean;
  readonly defaultVisible: boolean;
  readonly defaultOrder: number;
  readonly category?: string;
  readonly format?: FieldFormat;
  readonly enumValues?: ReadonlyArray<string>;
}

// ============================================
// USER CONTEXT TYPE
// ============================================

export interface ReportUserContext {
  readonly userId: string;
  readonly role: 'ADMIN' | 'ACCOUNTANT';
  readonly branchId?: string;
}
