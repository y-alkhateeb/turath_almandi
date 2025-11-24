import { useQuery, useMutation, useQueryClient } from '@tantml:invoke name="@tanstack/react-query">';
import smartReportsService from '@/api/services/smartReportsService';
import type {
  ReportConfiguration,
  DataSourceType,
  ExportFormat,
} from '@/types/smart-reports.types';

// ============================================
// QUERY KEYS
// ============================================

export const smartReportKeys = {
  all: ['smart-reports'] as const,
  dataSources: () => [...smartReportKeys.all, 'data-sources'] as const,
  fields: (dataSource: DataSourceType) => [...smartReportKeys.all, 'fields', dataSource] as const,
  templates: () => [...smartReportKeys.all, 'templates'] as const,
  template: (id: string) => [...smartReportKeys.all, 'template', id] as const,
};

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Get data sources
 */
export function useDataSources() {
  return useQuery({
    queryKey: smartReportKeys.dataSources(),
    queryFn: smartReportsService.getDataSources,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Get fields for a data source
 */
export function useFields(dataSource: DataSourceType | null) {
  return useQuery({
    queryKey: smartReportKeys.fields(dataSource!),
    queryFn: () => smartReportsService.getFields(dataSource!),
    enabled: !!dataSource,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Get user templates
 */
export function useTemplates() {
  return useQuery({
    queryKey: smartReportKeys.templates(),
    queryFn: smartReportsService.getTemplates,
  });
}

/**
 * Get template by ID
 */
export function useTemplate(id: string | null) {
  return useQuery({
    queryKey: smartReportKeys.template(id!),
    queryFn: () => smartReportsService.getTemplate(id!),
    enabled: !!id,
  });
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Create template
 */
export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: smartReportsService.createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: smartReportKeys.templates() });
    },
  });
}

/**
 * Update template
 */
export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof smartReportsService.updateTemplate>[1] }) =>
      smartReportsService.updateTemplate(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: smartReportKeys.templates() });
      queryClient.invalidateQueries({ queryKey: smartReportKeys.template(id) });
    },
  });
}

/**
 * Delete template
 */
export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: smartReportsService.deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: smartReportKeys.templates() });
    },
  });
}

/**
 * Execute report
 */
export function useExecuteReport() {
  return useMutation({
    mutationFn: smartReportsService.executeReport,
  });
}

/**
 * Export report
 */
export function useExportReport() {
  return useMutation({
    mutationFn: ({ config, format }: { config: ReportConfiguration; format: ExportFormat }) =>
      smartReportsService.exportReport(config, format),
    onSuccess: (blob, { format, config }) => {
      // Download file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${config.exportOptions.fileName || 'report'}.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
}
