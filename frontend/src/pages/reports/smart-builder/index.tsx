import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Info } from 'lucide-react';
import { DataSourceSelector } from './components/DataSourceSelector';
import { FieldSelector } from './components/FieldSelector';
import { FilterBuilder } from './components/FilterBuilder';
import { SortConfig } from './components/SortConfig';
import { ReportPreview } from './components/ReportPreview';
import { TemplateManager } from './components/TemplateManager';
import { useFields, useExecuteReport, useExportReport } from '@/hooks/queries/useSmartReports';
import type {
  ReportConfiguration,
  ReportField,
  ReportFilter,
  ReportOrderBy,
  DataSourceType,
  QueryResult,
  ExportFormat,
} from '@/types/smart-reports.types';

const defaultConfig: ReportConfiguration = {
  dataSource: { type: 'transactions' },
  fields: [],
  filters: [],
  orderBy: [],
  exportOptions: {
    formats: ['excel', 'pdf', 'csv'],
    includeCharts: false,
    includeRawData: true,
  },
};

export default function SmartReportBuilder() {
  const [config, setConfig] = useState<ReportConfiguration>(defaultConfig);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [activeTab, setActiveTab] = useState('build');

  // Queries
  const { data: availableFields, isLoading: fieldsLoading } = useFields(config.dataSource.type);
  const executeReport = useExecuteReport();
  const exportReport = useExportReport();

  // Handlers
  const handleDataSourceChange = useCallback((dataSource: DataSourceType) => {
    setConfig((prev) => ({
      ...prev,
      dataSource: { type: dataSource },
      fields: [],
      filters: [],
      orderBy: [],
    }));
    setResult(null);
  }, []);

  const handleFieldsChange = useCallback((fields: ReportField[]) => {
    setConfig((prev) => ({ ...prev, fields }));
  }, []);

  const handleFiltersChange = useCallback((filters: ReportFilter[]) => {
    setConfig((prev) => ({ ...prev, filters }));
  }, []);

  const handleOrderByChange = useCallback((orderBy: ReportOrderBy[]) => {
    setConfig((prev) => ({ ...prev, orderBy }));
  }, []);

  const handleExecute = useCallback(async () => {
    try {
      const queryResult = await executeReport.mutateAsync(config);
      setResult(queryResult);
      setActiveTab('preview');
    } catch (error) {
      console.error('Failed to execute report:', error);
    }
  }, [config, executeReport]);

  const handleExport = useCallback(async (format: ExportFormat) => {
    try {
      await exportReport.mutateAsync({ config, format });
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  }, [config, exportReport]);

  const handleLoadTemplate = useCallback((templateConfig: ReportConfiguration) => {
    setConfig(templateConfig);
    setResult(null);
  }, []);

  const isExecuting = executeReport.isPending;
  const isExporting = exportReport.isPending;
  const canExecute = config.fields.filter((f) => f.visible).length > 0;

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">منشئ التقارير الذكي</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleExecute}
            disabled={!canExecute || isExecuting}
          >
            {isExecuting ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <Play className="h-4 w-4 ml-2" />
            )}
            تشغيل التقرير
          </Button>
        </div>
      </div>

      {/* Instructions Card */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">كيفية استخدام منشئ التقارير:</h3>
              <ol className="list-decimal list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li><strong>اختر مصدر البيانات:</strong> حدد نوع البيانات (المعاملات، الديون، المخزون، الموظفين)</li>
                <li><strong>اختر الحقول:</strong> انقر على الحقول من قائمة "الحقول المتاحة" لإضافتها إلى التقرير</li>
                <li><strong>أضف الفلاتر (اختياري):</strong> قم بتصفية البيانات حسب التاريخ أو الفئة أو غيرها</li>
                <li><strong>حدد الترتيب (اختياري):</strong> رتب النتائج حسب أي حقل تختاره</li>
                <li><strong>شغّل التقرير:</strong> اضغط على زر "تشغيل التقرير" لعرض النتائج</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="build">بناء التقرير</TabsTrigger>
          <TabsTrigger value="preview">المعاينة</TabsTrigger>
          <TabsTrigger value="templates">القوالب</TabsTrigger>
        </TabsList>

        <TabsContent value="build" className="space-y-6">
          {/* Data Source */}
          <Card>
            <CardHeader>
              <CardTitle>مصدر البيانات</CardTitle>
            </CardHeader>
            <CardContent>
              <DataSourceSelector
                value={config.dataSource.type}
                onChange={handleDataSourceChange}
              />
            </CardContent>
          </Card>

          {/* Field Selector */}
          <Card>
            <CardHeader>
              <CardTitle>الحقول</CardTitle>
            </CardHeader>
            <CardContent>
              {fieldsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <FieldSelector
                  availableFields={availableFields || []}
                  selectedFields={config.fields}
                  onChange={handleFieldsChange}
                />
              )}
            </CardContent>
          </Card>

          {/* Filter Builder */}
          <Card>
            <CardHeader>
              <CardTitle>الفلاتر</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterBuilder
                availableFields={availableFields || []}
                filters={config.filters}
                onChange={handleFiltersChange}
              />
            </CardContent>
          </Card>

          {/* Sort Config */}
          <Card>
            <CardHeader>
              <CardTitle>الترتيب</CardTitle>
            </CardHeader>
            <CardContent>
              <SortConfig
                availableFields={config.fields.filter((f) => f.visible)}
                orderBy={config.orderBy}
                onChange={handleOrderByChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <ReportPreview
            result={result}
            fields={config.fields}
            isLoading={isExecuting}
            onExport={handleExport}
            isExporting={isExporting}
          />
        </TabsContent>

        <TabsContent value="templates">
          <TemplateManager
            currentConfig={config}
            onLoadTemplate={handleLoadTemplate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
