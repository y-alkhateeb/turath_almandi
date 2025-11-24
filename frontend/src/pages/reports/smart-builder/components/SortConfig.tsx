import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X, ArrowUp, ArrowDown } from 'lucide-react';
import type { ReportOrderBy, ReportField, SortDirection } from '@/types/smart-reports.types';

interface SortConfigProps {
  availableFields: ReportField[];
  orderBy: ReportOrderBy[];
  onChange: (orderBy: ReportOrderBy[]) => void;
}

export function SortConfig({ availableFields, orderBy, onChange }: SortConfigProps) {
  const handleAddSort = useCallback(() => {
    if (availableFields.length === 0) return;

    const firstField = availableFields[0];
    const newSort: ReportOrderBy = {
      field: firstField.sourceField,
      direction: 'asc',
    };

    onChange([...orderBy, newSort]);
  }, [availableFields, orderBy, onChange]);

  const handleRemoveSort = useCallback(
    (index: number) => {
      onChange(orderBy.filter((_, i) => i !== index));
    },
    [orderBy, onChange]
  );

  const handleFieldChange = useCallback(
    (index: number, field: string) => {
      onChange(
        orderBy.map((sort, i) => (i === index ? { ...sort, field } : sort))
      );
    },
    [orderBy, onChange]
  );

  const handleDirectionChange = useCallback(
    (index: number, direction: SortDirection) => {
      onChange(
        orderBy.map((sort, i) => (i === index ? { ...sort, direction } : sort))
      );
    },
    [orderBy, onChange]
  );

  return (
    <div className="space-y-3">
      {orderBy.map((sort, index) => {
        const field = availableFields.find((f) => f.sourceField === sort.field);

        return (
          <div key={index} className="flex items-center gap-2">
            {/* Field Selector */}
            <Select value={sort.field} onValueChange={(value) => handleFieldChange(index, value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="اختر الحقل" />
              </SelectTrigger>
              <SelectContent>
                {availableFields.map((f) => (
                  <SelectItem key={f.sourceField} value={f.sourceField}>
                    {f.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Direction Selector */}
            <Select
              value={sort.direction}
              onValueChange={(value) => handleDirectionChange(index, value as SortDirection)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">
                  <div className="flex items-center gap-2">
                    <ArrowUp className="h-4 w-4" />
                    <span>تصاعدي</span>
                  </div>
                </SelectItem>
                <SelectItem value="desc">
                  <div className="flex items-center gap-2">
                    <ArrowDown className="h-4 w-4" />
                    <span>تنازلي</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Remove Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveSort(index)}
            >
              <X className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        onClick={handleAddSort}
        disabled={availableFields.length === 0}
      >
        <Plus className="h-4 w-4 ml-2" />
        إضافة ترتيب
      </Button>
    </div>
  );
}
