// ============================================
// SMART REPORTS FRONTEND TYPES
// ============================================

// Data Sources
export const DATA_SOURCES = ['transactions', 'debts', 'inventory', 'salaries', 'branches'] as const;
export type DataSourceType = typeof DATA_SOURCES[number];

// Field Types
export const FIELD_DATA_TYPES = ['string', 'number', 'date', 'boolean', 'enum'] as const;
export type FieldDataType = typeof FIELD_DATA_TYPES[number];

export const FIELD_FORMATS = ['currency', 'percentage', 'date-short', 'date-long', 'number', 'text'] as const;
export type FieldFormat = typeof FIELD_FORMATS[number];

// Filter Types
export const FILTER_OPERATORS = [
  'equals', 'notEquals', 'greaterThan', 'greaterThanOrEqual',
  'lessThan', 'lessThanOrEqual', 'contains', 'startsWith',
  'endsWith', 'in', 'notIn', 'between', 'isNull', 'isNotNull',
] as const;
export type FilterOperator = typeof FILTER_OPERATORS[number];

// Aggregation Types
export const AGGREGATION_FUNCTIONS = ['sum', 'avg', 'count', 'min', 'max'] as const;
export type AggregationFunction = typeof AGGREGATION_FUNCTIONS[number];

// Export Types
export const EXPORT_FORMATS = ['excel', 'pdf', 'csv'] as const;
export type ExportFormat = typeof EXPORT_FORMATS[number];

// Sort Direction
export type SortDirection = 'asc' | 'desc';

// ============================================
// INTERFACES
// ============================================

export interface ReportField {
  id: string;
  sourceField: string;
  displayName: string;
  dataType: FieldDataType;
  visible: boolean;
  order: number;
  width?: number;
  format?: FieldFormat;
  aggregation?: AggregationFunction;
}

export interface ReportFilter {
  id: string;
  field: string;
  operator: FilterOperator;
  value?: string | number | boolean | string[] | number[] | [string | number, string | number];
  logicalOperator?: 'AND' | 'OR';
}

export interface ReportOrderBy {
  field: string;
  direction: SortDirection;
}

export interface ReportGroupBy {
  field: string;
  displayName: string;
}

export interface ReportAggregation {
  field: string;
  function: AggregationFunction;
  alias: string;
}

export interface ReportPagination {
  enabled: boolean;
  page: number;
  pageSize: number;
}

export interface ReportExportOptions {
  formats: ExportFormat[];
  includeCharts: boolean;
  includeRawData: boolean;
  fileName?: string;
}

export interface ReportConfiguration {
  dataSource: { type: DataSourceType };
  fields: ReportField[];
  filters: ReportFilter[];
  groupBy?: ReportGroupBy[];
  orderBy: ReportOrderBy[];
  aggregations?: ReportAggregation[];
  pagination?: ReportPagination;
  exportOptions: ReportExportOptions;
}

export interface FieldMetadata {
  id: string;
  dataSource: DataSourceType;
  fieldName: string;
  displayName: string;
  description?: string;
  dataType: FieldDataType;
  filterable: boolean;
  sortable: boolean;
  aggregatable: boolean;
  groupable: boolean;
  defaultVisible: boolean;
  defaultOrder: number;
  category?: string;
  format?: FieldFormat;
  enumValues?: string[];
}

export interface ReportResultRow {
  [key: string]: string | number | boolean | Date | null;
}

export interface AggregationResult {
  [alias: string]: number | null;
}

export interface GroupedResult {
  groupKey: Record<string, string | number | boolean | Date | null>;
  rows: ReportResultRow[];
  aggregations: AggregationResult;
}

export interface QueryResult {
  data: ReportResultRow[];
  totalCount: number;
  aggregations?: AggregationResult;
  groupedData?: GroupedResult[];
  executionTime: number;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  reportType: string;
  config: ReportConfiguration;
  isPublic: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// OPERATOR LABELS (Arabic)
// ============================================

export const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: 'يساوي',
  notEquals: 'لا يساوي',
  greaterThan: 'أكبر من',
  greaterThanOrEqual: 'أكبر من أو يساوي',
  lessThan: 'أصغر من',
  lessThanOrEqual: 'أصغر من أو يساوي',
  contains: 'يحتوي على',
  startsWith: 'يبدأ بـ',
  endsWith: 'ينتهي بـ',
  in: 'ضمن',
  notIn: 'ليس ضمن',
  between: 'بين',
  isNull: 'فارغ',
  isNotNull: 'غير فارغ',
};

export const AGGREGATION_LABELS: Record<AggregationFunction, string> = {
  sum: 'المجموع',
  avg: 'المتوسط',
  count: 'العدد',
  min: 'الحد الأدنى',
  max: 'الحد الأقصى',
};

export const DATA_SOURCE_LABELS: Record<DataSourceType, string> = {
  transactions: 'المعاملات المالية',
  debts: 'الديون',
  inventory: 'المخزون',
  salaries: 'الرواتب',
  branches: 'الفروع',
};
