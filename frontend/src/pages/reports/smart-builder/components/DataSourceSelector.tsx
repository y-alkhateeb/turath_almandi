import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useDataSources } from '@/hooks/queries/useSmartReports';
import { Loader2 } from 'lucide-react';
import type { DataSourceType } from '@/types/smart-reports.types';

interface DataSourceSelectorProps {
  value: DataSourceType;
  onChange: (value: DataSourceType) => void;
}

export function DataSourceSelector({ value, onChange }: DataSourceSelectorProps) {
  const { data: dataSources, isLoading } = useDataSources();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <RadioGroup value={value} onValueChange={onChange} className="space-y-2">
      {dataSources?.map((source) => (
        <div key={source.value} className="flex items-center space-x-2 space-x-reverse">
          <RadioGroupItem value={source.value} id={source.value} />
          <Label htmlFor={source.value} className="cursor-pointer">
            {source.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
