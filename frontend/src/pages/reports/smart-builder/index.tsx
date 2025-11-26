import { useState, useCallback, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Info, AlertCircle } from 'lucide-react';
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
  FieldMetadata,
} from '@/types/smart-reports.types';

// Fallback fields when API fails
const FALLBACK_FIELDS: Record<DataSourceType, FieldMetadata[]> = {
  transactions: [
    { id: 'f-1', dataSource: 'transactions', fieldName: 'amount', displayName: 'المبلغ', dataType: 'number', filterable: true, sortable: true, aggregatable: true, groupable: false, defaultVisible: true, defaultOrder: 1, format: 'currency' },
    { id: 'f-2', dataSource: 'transactions', fieldName: 'type', displayName: 'النوع', dataType: 'enum', filterable: true, sortable: true, aggregatable: false, groupable: true, defaultVisible: true, defaultOrder: 2, enumValues: ['INCOME', 'EXPENSE'] },
    { id: 'f-3', dataSource: 'transactions', fieldName: 'category', displayName: 'الفئة', dataType: 'string', filterable: true, sortable: true, aggregatable: false, groupable: true, defaultVisible: true, defaultOrder: 3 },
    { id: 'f-4', dataSource: 'transactions', fieldName: 'paymentMethod', displayName: 'طريقة الدفع', dataType: 'enum', filterable: true, sortable: true, aggregatable: false, groupable: true, defaultVisible: true, defaultOrder: 4, enumValues: ['CASH', 'MASTER'] },
    { id: 'f-5', dataSource: 'transactions', fieldName: 'employeeVendorName', displayName: 'اسم الموظف/المورد', dataType: 'string', filterable: true, sortable: true, aggregatable: false, groupable: false, defaultVisible: true, defaultOrder: 5 },
    { id: 'f-6', dataSource: 'transactions', fieldName: 'notes', displayName: 'الملاحظات', dataType: 'string', filterable: true, sortable: false, aggregatable: false, groupable: false, defaultVisible: false, defaultOrder: 6 },
    { id: 'f-7', dataSource: 'transactions', fieldName: 'date', displayName: 'التاريخ', dataType: 'date', filterable: true, sortable: true, aggregatable: false, groupable: true, defaultVisible: true, defaultOrder: 7, format: 'date-short' },
  ],
  debts: [
    { id: 'd-1', dataSource: 'debts', fieldName: 'creditorName', displayName: 'اسم الدائن', dataType: 'string', filterable: true, sortable: true, aggregatable: false, groupable: true, defaultVisible: true, defaultOrder: 1 },
    { id: 'd-2', dataSource: 'debts', fieldName: 'originalAmount', displayName: 'المبلغ الأصلي', dataType: 'number', filterable: true, sortable: true, aggregatable: true, groupable: false, defaultVisible: true, defaultOrder: 2, format: 'currency' },
    { id: 'd-3', dataSource: 'debts', fieldName: 'remainingAmount', displayName: 'المبلغ المتبقي', dataType: 'number', filterable: true, sortable: true, aggregatable: true, groupable: false, defaultVisible: true, defaultOrder: 3, format: 'currency' },
    { id: 'd-4', dataSource: 'debts', fieldName: 'status', displayName: 'الحالة', dataType: 'enum', filterable: true, sortable: true, aggregatable: false, groupable: true, defaultVisible: true, defaultOrder: 4, enumValues: ['ACTIVE', 'PAID', 'PARTIAL'] },
    { id: 'd-5', dataSource: 'debts', fieldName: 'date', displayName: 'تاريخ الدين', dataType: 'date', filterable: true, sortable: true, aggregatable: false, groupable: false, defaultVisible: true, defaultOrder: 5, format: 'date-short' },
    { id: 'd-6', dataSource: 'debts', fieldName: 'dueDate', displayName: 'تاريخ الاستحقاق', dataType: 'date', filterable: true, sortable: true, aggregatable: false, groupable: false, defaultVisible: true, defaultOrder: 6, format: 'date-short' },
  ],
  inventory: [
    { id: 'i-1', dataSource: 'inventory', fieldName: 'name', displayName: 'اسم الصنف', dataType: 'string', filterable: true, sortable: true, aggregatable: false, groupable: false, defaultVisible: true, defaultOrder: 1 },
    { id: 'i-2', dataSource: 'inventory', fieldName: 'quantity', displayName: 'الكمية', dataType: 'number', filterable: true, sortable: true, aggregatable: true, groupable: false, defaultVisible: true, defaultOrder: 2 },
    { id: 'i-3', dataSource: 'inventory', fieldName: 'unit', displayName: 'الوحدة', dataType: 'enum', filterable: true, sortable: true, aggregatable: false, groupable: true, defaultVisible: true, defaultOrder: 3, enumValues: ['KG', 'PIECE', 'LITER', 'OTHER'] },
    { id: 'i-4', dataSource: 'inventory', fieldName: 'costPerUnit', displayName: 'التكلفة لكل وحدة', dataType: 'number', filterable: true, sortable: true, aggregatable: true, groupable: false, defaultVisible: true, defaultOrder: 4, format: 'currency' },
  ],
  salaries: [
    { id: 's-1', dataSource: 'salaries', fieldName: 'name', displayName: 'اسم الموظف', dataType: 'string', filterable: true, sortable: true, aggregatable: false, groupable: false, defaultVisible: true, defaultOrder: 1 },
    { id: 's-2', dataSource: 'salaries', fieldName: 'position', displayName: 'المنصب', dataType: 'string', filterable: true, sortable: true, aggregatable: false, groupable: true, defaultVisible: true, defaultOrder: 2 },
    { id: 's-3', dataSource: 'salaries', fieldName: 'baseSalary', displayName: 'الراتب الأساسي', dataType: 'number', filterable: true, sortable: true, aggregatable: true, groupable: false, defaultVisible: true, defaultOrder: 3, format: 'currency' },
    { id: 's-4', dataSource: 'salaries', fieldName: 'allowance', displayName: 'البدل', dataType: 'number', filterable: true, sortable: true, aggregatable: true, groupable: false, defaultVisible: true, defaultOrder: 4, format: 'currency' },
    { id: 's-5', dataSource: 'salaries', fieldName: 'status', displayName: 'الحالة', dataType: 'enum', filterable: true, sortable: true, aggregatable: false, groupable: true, defaultVisible: true, defaultOrder: 5, enumValues: ['ACTIVE', 'RESIGNED'] },
  ],
  branches: [
    { id: 'b-1', dataSource: 'branches', fieldName: 'name', displayName: 'اسم الفرع', dataType: 'string', filterable: true, sortable: true, aggregatable: false, groupable: false, defaultVisible: true, defaultOrder: 1 },
    { id: 'b-2', dataSource: 'branches', fieldName: 'location', displayName: 'الموقع', dataType: 'string', filterable: true, sortable: false, aggregatable: false, groupable: false, defaultVisible: true, defaultOrder: 2 },
    { id: 'b-3', dataSource: 'branches', fieldName: 'managerName', displayName: 'اسم المدير', dataType: 'string', filterable: true, sortable: true, aggregatable: false, groupable: false, defaultVisible: true, defaultOrder: 3 },
    { id: 'b-4', dataSource: 'branches', fieldName: 'phone', displayName: 'الهاتف', dataType: 'string', filterable: true, sortable: false, aggregatable: false, groupable: false, defaultVisible: true, defaultOrder: 4 },
  ],
};

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
  const { data: apiFields, isLoading: fieldsLoading, isError: fieldsError } = useFields(config.dataSource.type);
  const executeReport = useExecuteReport();
  const exportReport = useExportReport();

  // Use fallback fields if API fails or returns empty
  const availableFields = useMemo(() => {
    if (apiFields && apiFields.length > 0) {
      return apiFields;
    }
    return FALLBACK_FIELDS[config.dataSource.type] || [];
  }, [apiFields, config.dataSource.type]);

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
                <div className="space-y-3">
                  {fieldsError && (
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>تعذر تحميل الحقول من الخادم، يتم استخدام القائمة الافتراضية</span>
                    </div>
                  )}
                  <FieldSelector
                    availableFields={availableFields}
                    selectedFields={config.fields}
                    onChange={handleFieldsChange}
                  />
                </div>
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
