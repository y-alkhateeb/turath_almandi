export interface SmartReportRequest {
  reportType: string;
  startDate: string;
  endDate: string;
  filters?: Record<string, any>;
}

export interface SmartReportResponse {
  data: any[];
  summary: any;
  metadata: {
    generatedAt: string;
    reportType: string;
  };
}

export interface ReportConfiguration {
  id: string;
  name: string;
  description?: string;
  type: string;
  config: any;
}

export interface FieldMetadata {
  name: string;
  label: string;
  type: string;
}

export interface QueryResult {
  data: any[];
  total: number;
}

export interface ReportTemplate {
  id: string;
  name: string;
  layout: any;
}

export enum DataSourceType {
  TRANSACTIONS = 'TRANSACTIONS',
  INVENTORY = 'INVENTORY',
  CUSTOMERS = 'CUSTOMERS',
}

export enum ExportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
}
