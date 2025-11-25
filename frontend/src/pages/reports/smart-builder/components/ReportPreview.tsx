import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileDown, FileSpreadsheet, FileText } from 'lucide-react';
import type { QueryResult, ReportField, ExportFormat } from '@/types/smart-reports.types';
import { useCurrencyStore } from '@/stores/currencyStore';
import { formatCurrencyAuto } from '@/utils/currency.utils';

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
        <Card>
          <CardHeader>
            <CardTitle className="text-base">المجاميع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(result.aggregations).map(([alias, value]) => (
                <div key={alias} className="space-y-1">
                  <p className="text-sm text-gray-500">{alias}</p>
                  <p className="text-2xl font-bold">{value?.toLocaleString() ?? 'N/A'}</p>
                </div>
              ))}
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
                          {formatCellValue(row[field.sourceField], field.format, currency)}
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

// Helper function to format cell values
function formatCellValue(
  value: string | number | boolean | Date | null,
  format?: string,
  currency?: CurrencySettings | null
): string {
  if (value === null || value === undefined) {
    return '-';
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

  if (format === 'date-short' && value instanceof Date) {
    return value.toLocaleDateString('ar-IQ');
  }

  if (format === 'date-long' && value instanceof Date) {
    return value.toLocaleString('ar-IQ');
  }

  if (typeof value === 'boolean') {
    return value ? 'نعم' : 'لا';
  }

  return String(value);
}
