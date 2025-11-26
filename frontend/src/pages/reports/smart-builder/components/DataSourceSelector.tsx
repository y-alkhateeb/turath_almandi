import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useDataSources } from '@/hooks/queries/useSmartReports';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import type { DataSourceType } from '@/types/smart-reports.types';

interface DataSourceSelectorProps {
  value: DataSourceType;
  onChange: (value: DataSourceType) => void;
}

// Fallback data sources in case API fails
const FALLBACK_DATA_SOURCES: Array<{ value: DataSourceType; label: string }> = [
  { value: 'transactions', label: 'المعاملات المالية' },
  { value: 'debts', label: 'الديون' },
  { value: 'inventory', label: 'المخزون' },
  { value: 'salaries', label: 'الرواتب' },
  { value: 'branches', label: 'الفروع' },
];

export function DataSourceSelector({ value, onChange }: DataSourceSelectorProps) {
  const { data: dataSources, isLoading, isError, error, refetch } = useDataSources();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  // Use fallback if API failed or returned empty
  const sources = (dataSources && dataSources.length > 0) ? dataSources : FALLBACK_DATA_SOURCES;

  return (
    <div className="space-y-3">
      {isError && (
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>تعذر تحميل مصادر البيانات من الخادم، يتم استخدام القائمة الافتراضية</span>
          <Button variant="ghost" size="sm" onClick={() => refetch()} className="mr-auto">
            <RefreshCw className="h-3 w-3 ml-1" />
            إعادة المحاولة
          </Button>
        </div>
      )}
      <RadioGroup value={value} onValueChange={onChange} className="space-y-2">
        {sources.map((source) => (
          <div key={source.value} className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value={source.value} id={source.value} />
            <Label htmlFor={source.value} className="cursor-pointer">
              {source.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
