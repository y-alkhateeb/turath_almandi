import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Receipt,
  Wallet,
  Package,
  Play,
  Calendar,
  Building2,
  Loader2
} from 'lucide-react';
import { useBranches } from '@/hooks/useBranches';
import type { ReportConfiguration, ReportField, ReportFilter, ReportAggregation } from '@/types/smart-reports.types';
import { v4 as uuidv4 } from 'uuid';

// Date period options
type DatePeriod = 'this_week' | 'this_month' | 'this_year' | 'custom';

interface QuickTemplatesProps {
  onApplyTemplate: (config: ReportConfiguration) => void;
  onExecute: () => void;
  isExecuting: boolean;
}

// Helper function to get date range based on period
function getDateRange(period: DatePeriod, customFrom?: string, customTo?: string): [string, string] {
  const now = new Date();
  let fromDate: Date;
  let toDate: Date = now;

  switch (period) {
    case 'this_week': {
      const dayOfWeek = now.getDay();
      // Set to Saturday (start of Arabic week)
      const saturday = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
      fromDate = new Date(now);
      fromDate.setDate(now.getDate() - saturday);
      fromDate.setHours(0, 0, 0, 0);
      break;
    }
    case 'this_month': {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    }
    case 'this_year': {
      fromDate = new Date(now.getFullYear(), 0, 1);
      break;
    }
    case 'custom': {
      return [customFrom || '', customTo || ''];
    }
    default:
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return [fromDate.toISOString().split('T')[0], toDate.toISOString().split('T')[0]];
}

// Template type
type TemplateType = 'transactions' | 'debts' | 'inventory';

// Template definitions
const TEMPLATE_INFO: Record<TemplateType, { icon: typeof Receipt; title: string; description: string; color: string }> = {
  transactions: {
    icon: Receipt,
    title: 'تقرير المعاملات',
    description: 'جميع المعاملات المالية (واردات وصرفيات الصندوق)',
    color: 'text-blue-600 dark:text-blue-400',
  },
  debts: {
    icon: Wallet,
    title: 'تقرير الديون',
    description: 'الديون النشطة والمسددة',
    color: 'text-orange-600 dark:text-orange-400',
  },
  inventory: {
    icon: Package,
    title: 'تقرير المخزون',
    description: 'جرد المخزون الحالي',
    color: 'text-green-600 dark:text-green-400',
  },
};

// Field definitions for each template
const TEMPLATE_FIELDS: Record<TemplateType, ReportField[]> = {
  transactions: [
    { id: uuidv4(), sourceField: 'date', displayName: 'التاريخ', dataType: 'date', visible: true, order: 0, format: 'date-short' },
    { id: uuidv4(), sourceField: 'type', displayName: 'نوع الفاتورة', dataType: 'enum', visible: true, order: 1 },
    { id: uuidv4(), sourceField: 'category', displayName: 'الفئة', dataType: 'string', visible: true, order: 2 },
    { id: uuidv4(), sourceField: 'amount', displayName: 'المبلغ', dataType: 'number', visible: true, order: 3, format: 'currency' },
    { id: uuidv4(), sourceField: 'paymentMethod', displayName: 'طريقة الدفع', dataType: 'enum', visible: true, order: 4 },
    { id: uuidv4(), sourceField: 'notes', displayName: 'الملاحظات', dataType: 'string', visible: true, order: 5 },
  ],
  debts: [
    { id: uuidv4(), sourceField: 'creditorName', displayName: 'اسم الدائن', dataType: 'string', visible: true, order: 0 },
    { id: uuidv4(), sourceField: 'originalAmount', displayName: 'المبلغ الأصلي', dataType: 'number', visible: true, order: 1, format: 'currency' },
    { id: uuidv4(), sourceField: 'remainingAmount', displayName: 'المبلغ المتبقي', dataType: 'number', visible: true, order: 2, format: 'currency' },
    { id: uuidv4(), sourceField: 'status', displayName: 'الحالة', dataType: 'enum', visible: true, order: 3 },
    { id: uuidv4(), sourceField: 'date', displayName: 'تاريخ الدين', dataType: 'date', visible: true, order: 4, format: 'date-short' },
    { id: uuidv4(), sourceField: 'dueDate', displayName: 'تاريخ الاستحقاق', dataType: 'date', visible: true, order: 5, format: 'date-short' },
  ],
  inventory: [
    { id: uuidv4(), sourceField: 'name', displayName: 'اسم الصنف', dataType: 'string', visible: true, order: 0 },
    { id: uuidv4(), sourceField: 'quantity', displayName: 'الكمية', dataType: 'number', visible: true, order: 1 },
    { id: uuidv4(), sourceField: 'unit', displayName: 'الوحدة', dataType: 'enum', visible: true, order: 2 },
    { id: uuidv4(), sourceField: 'costPerUnit', displayName: 'التكلفة لكل وحدة', dataType: 'number', visible: true, order: 3, format: 'currency' },
  ],
};

// Aggregation definitions for each template
const TEMPLATE_AGGREGATIONS: Record<TemplateType, ReportAggregation[]> = {
  transactions: [
    { field: 'amount', function: 'sum', alias: 'إجمالي المبالغ' },
    { field: 'amount', function: 'count', alias: 'عدد المعاملات' },
  ],
  debts: [
    { field: 'originalAmount', function: 'sum', alias: 'إجمالي المبلغ الأصلي' },
    { field: 'remainingAmount', function: 'sum', alias: 'إجمالي المبلغ المتبقي' },
    { field: 'originalAmount', function: 'count', alias: 'عدد الديون' },
  ],
  inventory: [
    { field: 'quantity', function: 'sum', alias: 'إجمالي الكمية' },
    { field: 'costPerUnit', function: 'sum', alias: 'إجمالي التكلفة' },
    { field: 'name', function: 'count', alias: 'عدد الأصناف' },
  ],
};

export function QuickTemplates({ onApplyTemplate, onExecute, isExecuting }: QuickTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null);
  const [datePeriod, setDatePeriod] = useState<DatePeriod>('this_month');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  const { data: branches } = useBranches();

  const isCustomPeriod = datePeriod === 'custom';

  // Generate the report configuration
  const generateConfig = (templateType: TemplateType): ReportConfiguration => {
    const [fromDate, toDate] = getDateRange(datePeriod, customFromDate, customToDate);
    const fields = TEMPLATE_FIELDS[templateType].map((field) => ({
      ...field,
      id: uuidv4(), // Generate new IDs
    }));

    const filters: ReportFilter[] = [];

    // Add date filter for transactions and debts
    if ((templateType === 'transactions' || templateType === 'debts') && fromDate && toDate) {
      filters.push({
        id: uuidv4(),
        field: 'date',
        operator: 'between',
        value: [fromDate, toDate],
      });
    }

    // Add branch filter if selected
    if (selectedBranch !== 'all' && templateType !== 'inventory') {
      filters.push({
        id: uuidv4(),
        field: 'branchId',
        operator: 'equals',
        value: selectedBranch,
        logicalOperator: filters.length > 0 ? 'AND' : undefined,
      });
    }

    return {
      dataSource: { type: templateType },
      fields,
      filters,
      orderBy: [{ field: templateType === 'inventory' ? 'name' : 'date', direction: 'desc' }],
      aggregations: TEMPLATE_AGGREGATIONS[templateType],
      exportOptions: {
        formats: ['excel', 'pdf', 'csv'],
        includeCharts: false,
        includeRawData: true,
      },
    };
  };

  const handleSelectTemplate = (template: TemplateType) => {
    setSelectedTemplate(template);
    const config = generateConfig(template);
    onApplyTemplate(config);
  };

  const handleRunReport = () => {
    if (selectedTemplate) {
      const config = generateConfig(selectedTemplate);
      onApplyTemplate(config);
      onExecute();
    }
  };

  const canRunReport = selectedTemplate && (datePeriod !== 'custom' || (customFromDate && customToDate));

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.entries(TEMPLATE_INFO) as [TemplateType, typeof TEMPLATE_INFO.transactions][]).map(
          ([key, info]) => {
            const Icon = info.icon;
            const isSelected = selectedTemplate === key;

            return (
              <Card
                key={key}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? 'ring-2 ring-primary border-primary bg-primary/5 dark:bg-primary/10'
                    : 'hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => handleSelectTemplate(key)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${info.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{info.title}</CardTitle>
                      <CardDescription className="text-xs mt-1">{info.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          }
        )}
      </div>

      {/* Filter Options - Show when template is selected */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              خيارات التصفية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Period - Not for inventory */}
              {selectedTemplate !== 'inventory' && (
                <div className="space-y-2">
                  <Label>الفترة الزمنية</Label>
                  <Select
                    value={datePeriod}
                    onValueChange={(value) => setDatePeriod(value as DatePeriod)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفترة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="this_week">هذا الأسبوع</SelectItem>
                      <SelectItem value="this_month">هذا الشهر</SelectItem>
                      <SelectItem value="this_year">هذه السنة</SelectItem>
                      <SelectItem value="custom">نطاق مخصص</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Custom Date Range */}
              {isCustomPeriod && selectedTemplate !== 'inventory' && (
                <>
                  <div className="space-y-2">
                    <Label>من تاريخ</Label>
                    <Input
                      type="date"
                      value={customFromDate}
                      onChange={(e) => setCustomFromDate(e.target.value)}
                      className="[&::-webkit-calendar-picker-indicator]:dark:invert"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>إلى تاريخ</Label>
                    <Input
                      type="date"
                      value={customToDate}
                      onChange={(e) => setCustomToDate(e.target.value)}
                      className="[&::-webkit-calendar-picker-indicator]:dark:invert"
                    />
                  </div>
                </>
              )}

              {/* Branch Selection - Not for inventory */}
              {selectedTemplate !== 'inventory' && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    الفرع
                  </Label>
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفرع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الفروع</SelectItem>
                      {branches?.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Run Report Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleRunReport}
                disabled={!canRunReport || isExecuting}
                size="lg"
              >
                {isExecuting ? (
                  <Loader2 className="h-5 w-5 animate-spin ml-2" />
                ) : (
                  <Play className="h-5 w-5 ml-2" />
                )}
                إنشاء التقرير
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
