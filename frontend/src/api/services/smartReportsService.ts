/**
 * Smart Reports Service
 * Smart reports API operations
 *
 * Endpoints:
 * - GET /reports/smart/data-sources → DataSource[]
 * - GET /reports/smart/fields → FieldMetadata[]
 * - GET /reports/smart/templates → ReportTemplate[]
 * - GET /reports/smart/templates/:id → ReportTemplate
 * - POST /reports/smart/templates → ReportTemplate
 * - PUT /reports/smart/templates/:id → ReportTemplate
 * - DELETE /reports/smart/templates/:id → void
 * - POST /reports/smart/execute → QueryResult
 * - POST /reports/smart/export → Blob
 *
 * All types match backend DTOs exactly. No any types.
 */

import apiClient from '../apiClient';
import type {
  ReportConfiguration,
  FieldMetadata,
  QueryResult,
  ReportTemplate,
  DataSourceType,
  ExportFormat,
} from '@/types/smart-reports.types';

// ============================================
// API ENDPOINTS
// ============================================

export enum SmartReportsApiEndpoints {
  Base = '/reports/smart',
  DataSources = '/reports/smart/data-sources',
  Fields = '/reports/smart/fields',
  Templates = '/reports/smart/templates',
  TemplateById = '/reports/smart/templates/:id',
  Execute = '/reports/smart/execute',
  Export = '/reports/smart/export',
}

// ============================================
// SMART REPORTS SERVICE METHODS
// ============================================

/**
 * Get available data sources
 * GET /reports/smart/data-sources
 */
export async function getDataSources(): Promise<Array<{ value: DataSourceType; label: string }>> {
  const response = await apiClient.get<Array<{ value: DataSourceType; label: string }>>(
    SmartReportsApiEndpoints.DataSources
  );
  return response.data;
}

/**
 * Get available fields for a data source
 * GET /reports/smart/fields
 */
export async function getFields(dataSource: DataSourceType): Promise<FieldMetadata[]> {
  const response = await apiClient.get<FieldMetadata[]>(
    SmartReportsApiEndpoints.Fields,
    { params: { dataSource } }
  );
  return response.data;
}

/**
 * Get user templates
 * GET /reports/smart/templates
 */
export async function getTemplates(): Promise<ReportTemplate[]> {
  const response = await apiClient.get<ReportTemplate[]>(SmartReportsApiEndpoints.Templates);
  return response.data;
}

/**
 * Get template by ID
 * GET /reports/smart/templates/:id
 */
export async function getTemplate(id: string): Promise<ReportTemplate> {
  const url = SmartReportsApiEndpoints.TemplateById.replace(':id', id);
  const response = await apiClient.get<ReportTemplate>(url);
  return response.data;
}

/**
 * Create template
 * POST /reports/smart/templates
 */
export async function createTemplate(data: {
  name: string;
  description?: string;
  reportType: string;
  config: ReportConfiguration;
  isPublic: boolean;
}): Promise<ReportTemplate> {
  const response = await apiClient.post<ReportTemplate>(SmartReportsApiEndpoints.Templates, data);
  return response.data;
}

/**
 * Update template
 * PUT /reports/smart/templates/:id
 */
export async function updateTemplate(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    config: ReportConfiguration;
    isPublic: boolean;
    isDefault: boolean;
  }>
): Promise<ReportTemplate> {
  const url = SmartReportsApiEndpoints.TemplateById.replace(':id', id);
  const response = await apiClient.put<ReportTemplate>(url, data);
  return response.data;
}

/**
 * Delete template
 * DELETE /reports/smart/templates/:id
 */
export async function deleteTemplate(id: string): Promise<void> {
  const url = SmartReportsApiEndpoints.TemplateById.replace(':id', id);
  await apiClient.delete(url);
}

/**
 * Execute report
 * POST /reports/smart/execute
 */
export async function executeReport(config: ReportConfiguration): Promise<QueryResult> {
  const response = await apiClient.post<QueryResult>(SmartReportsApiEndpoints.Execute, { config });
  return response.data;
}

/**
 * Export report
 * POST /reports/smart/export
 */
export async function exportReport(
  config: ReportConfiguration,
  format: ExportFormat
): Promise<Blob> {
  const response = await apiClient.post(
    SmartReportsApiEndpoints.Export,
    { config },
    {
      params: { format },
      responseType: 'blob',
    }
  );
  return response.data;
}

// ============================================
// DEFAULT EXPORT
// ============================================

const smartReportsService = {
  getDataSources,
  getFields,
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  executeReport,
  exportReport,
};

export default smartReportsService;
