import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Loader2, FileDown, FileSpreadsheet, FileText } from 'lucide-react';
import type { QueryResult, ReportField, ExportFormat } from '@/types/smart-reports.types';
import { useCurrencyStore } from '@/stores/currencyStore';
import { formatCurrencyAuto } from '@/utils/currency.utils';
import { getCategoryLabel } from '@/constants/transactionCategories';
import { formatDate, formatDateTime } from '@/utils/format';

interface ReportPreviewProps {
  result: QueryResult | null;
  fields: ReportField[];
  isLoading: boolean;
  onExport: (format: ExportFormat) => void;
  isExporting: boolean;
}

export function ReportPreview({
  result,
  fields,
  isLoading,
  onExport,
  isExporting,
}: ReportPreviewProps) {
  const visibleFields = fields.filter((f) => f.visible).sort((a, b) => a.order - b.order);
  const currency = useCurrencyStore((state) => state.currency);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="text-sm text-gray-500">جاري تحميل التقرير...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <FileText className="h-12 w-12 mx-auto text-gray-300" />
            <p className="text-sm text-gray-500">قم بتشغيل التقرير لرؤية النتائج</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Export Buttons & Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>نتائج التقرير</CardTitle>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>عدد السجلات: {result.totalCount}</span>
                <span>وقت التنفيذ: {result.executionTime}ms</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('excel')}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 ml-2" />
                )}
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('csv')}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <FileDown className="h-4 w-4 ml-2" />
                )}
                CSV
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Aggregations */}
      {result.aggregations && Object.keys(result.aggregations).length > 0 && (
        <Card className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-primary-200 dark:border-primary-800">
          <CardHeader>
            <CardTitle className="text-base text-primary-800 dark:text-primary-200">ملخص التقرير</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(result.aggregations).map(([alias, value]) => {
                // Check if this is a currency field (contains مبلغ, تكلفة, إجمالي but not عدد)
                const isCurrencyField = (alias.includes('مبلغ') || alias.includes('تكلفة') || alias.includes('إجمالي')) && !alias.includes('عدد') && !alias.includes('كمية');
                const isCountField = alias.includes('عدد');

                // Format the value
                let formattedValue = 'N/A';
                if (value !== null && value !== undefined) {
                  if (isCurrencyField && currency) {
                    formattedValue = formatCurrencyAuto(Number(value), currency, 2);
                  } else if (isCountField) {
                    formattedValue = Number(value).toLocaleString('ar-IQ');
                  } else {
                    formattedValue = Number(value).toLocaleString('ar-IQ', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    });
                  }
                }

                return (
                  <div key={alias} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-primary-100 dark:border-primary-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{alias}</p>
                    <p className={`text-xl font-bold ${isCurrencyField ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'}`}>
                      {formattedValue}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleFields.map((field) => (
                    <TableHead key={field.sourceField} className="text-right">
                      {field.displayName}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleFields.length} className="text-center py-8 text-gray-500">
                      لا توجد بيانات
                    </TableCell>
                  </TableRow>
                ) : (
                  result.data.map((row, index) => (
                    <TableRow key={row.id || index}>
                      {visibleFields.map((field) => (
                        <TableCell key={field.sourceField}>
                          {formatCellValue(row[field.sourceField], field.format, field.sourceField, currency)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Currency settings type for formatting
interface CurrencySettings {
  code: string;
  symbol: string;
  nameAr: string;
  nameEn: string;
}

// Labels for enum values
const ENUM_LABELS: Record<string, Record<string, string>> = {
  type: {
    INCOME: 'واردات صندوق',
    EXPENSE: 'صرفيات الصندوق',
  },
  status: {
    ACTIVE: 'نشط',
    PAID: 'مسدد',
    PARTIAL: 'جزئي',
    RESIGNED: 'مستقيل',
  },
  paymentMethod: {
    CASH: 'نقدي',
    MASTER: 'ماستر كارد',
  },
  unit: {
    KG: 'كيلوجرام',
    PIECE: 'قطعة',
    LITER: 'لتر',
    OTHER: 'أخرى',
  },
};

// Helper function to format cell values
function formatCellValue(
  value: string | number | boolean | Date | null,
  format?: string,
  fieldName?: string,
  currency?: CurrencySettings | null
): string {
  if (value === null || value === undefined) {
    return '-';
  }

  // Handle category field specifically
  if (fieldName === 'category' && typeof value === 'string') {
    return getCategoryLabel(value);
  }

  // Handle other enum fields
  if (fieldName && typeof value === 'string' && ENUM_LABELS[fieldName]) {
    return ENUM_LABELS[fieldName][value] || value;
  }

  if (format === 'currency') {
    // Use dynamic currency from store if available
    if (currency) {
      return formatCurrencyAuto(Number(value), currency, 2);
    }
    // Fallback to basic number formatting if no currency set
    return Number(value).toLocaleString('ar-IQ', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  if (format === 'percentage') {
    return `${Number(value).toFixed(2)}%`;
  }

  // Handle date strings
  if (format === 'date-short') {
    const dateValue = value instanceof Date ? value : new Date(value as string);
    if (!isNaN(dateValue.getTime())) {
      return formatDate(dateValue);
    }
  }

  if (format === 'date-long') {
    const dateValue = value instanceof Date ? value : new Date(value as string);
    if (!isNaN(dateValue.getTime())) {
      return formatDateTime(dateValue);
    }
  }

  if (typeof value === 'boolean') {
    return value ? 'نعم' : 'لا';
  }

  return String(value);
}
