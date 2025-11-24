import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type {
  ReportFilter,
  FieldMetadata,
  FilterOperator,
  OPERATOR_LABELS,
} from '@/types/smart-reports.types';
import { OPERATOR_LABELS as LABELS } from '@/types/smart-reports.types';

interface FilterBuilderProps {
  availableFields: FieldMetadata[];
  filters: ReportFilter[];
  onChange: (filters: ReportFilter[]) => void;
}

// Get valid operators for field type
function getOperatorsForType(dataType: string): FilterOperator[] {
  const commonOps: FilterOperator[] = ['equals', 'notEquals', 'isNull', 'isNotNull'];

  switch (dataType) {
    case 'string':
      return [...commonOps, 'contains', 'startsWith', 'endsWith', 'in', 'notIn'];
    case 'number':
      return [...commonOps, 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between', 'in', 'notIn'];
    case 'date':
      return [...commonOps, 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between'];
    case 'boolean':
      return ['equals', 'notEquals', 'isNull', 'isNotNull'];
    case 'enum':
      return ['equals', 'notEquals', 'in', 'notIn', 'isNull', 'isNotNull'];
    default:
      return commonOps;
  }
}

export function FilterBuilder({ availableFields, filters, onChange }: FilterBuilderProps) {
  const filterableFields = availableFields.filter((f) => f.filterable);

  const handleAddFilter = useCallback(() => {
    if (filterableFields.length === 0) return;

    const firstField = filterableFields[0];
    const operators = getOperatorsForType(firstField.dataType);

    const newFilter: ReportFilter = {
      id: uuidv4(),
      field: firstField.fieldName,
      operator: operators[0],
      value: '',
      logicalOperator: filters.length > 0 ? 'AND' : undefined,
    };

    onChange([...filters, newFilter]);
  }, [filters, filterableFields, onChange]);

  const handleRemoveFilter = useCallback(
    (id: string) => {
      const updated = filters.filter((f) => f.id !== id);
      // Remove logicalOperator from first filter
      if (updated.length > 0 && updated[0].logicalOperator) {
        updated[0] = { ...updated[0], logicalOperator: undefined };
      }
      onChange(updated);
    },
    [filters, onChange]
  );

  const handleFilterChange = useCallback(
    (id: string, updates: Partial<ReportFilter>) => {
      onChange(
        filters.map((f) => (f.id === id ? { ...f, ...updates } : f))
      );
    },
    [filters, onChange]
  );

  const getFieldByName = (fieldName: string): FieldMetadata | undefined => {
    return filterableFields.find((f) => f.fieldName === fieldName);
  };

  return (
    <div className="space-y-3">
      {filters.map((filter, index) => {
        const fieldMeta = getFieldByName(filter.field);
        const operators = fieldMeta ? getOperatorsForType(fieldMeta.dataType) : [];
        const needsValue = !['isNull', 'isNotNull'].includes(filter.operator);
        const isBetween = filter.operator === 'between';

        return (
          <div key={filter.id} className="flex items-center gap-2 flex-wrap">
            {/* Logical Operator */}
            {index > 0 && (
              <Select
                value={filter.logicalOperator || 'AND'}
                onValueChange={(value) =>
                  handleFilterChange(filter.id, { logicalOperator: value as 'AND' | 'OR' })
                }
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">و</SelectItem>
                  <SelectItem value="OR">أو</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Field Selector */}
            <Select
              value={filter.field}
              onValueChange={(value) => {
                const newFieldMeta = getFieldByName(value);
                const newOperators = newFieldMeta
                  ? getOperatorsForType(newFieldMeta.dataType)
                  : operators;
                handleFilterChange(filter.id, {
                  field: value,
                  operator: newOperators[0],
                  value: '',
                });
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="اختر الحقل" />
              </SelectTrigger>
              <SelectContent>
                {filterableFields.map((f) => (
                  <SelectItem key={f.id} value={f.fieldName}>
                    {f.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Operator Selector */}
            <Select
              value={filter.operator}
              onValueChange={(value) =>
                handleFilterChange(filter.id, {
                  operator: value as FilterOperator,
                  value: ['isNull', 'isNotNull'].includes(value) ? undefined : filter.value,
                })
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {operators.map((op) => (
                  <SelectItem key={op} value={op}>
                    {LABELS[op]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Value Input */}
            {needsValue && !isBetween && (
              <Input
                type={fieldMeta?.dataType === 'number' ? 'number' : fieldMeta?.dataType === 'date' ? 'date' : 'text'}
                value={String(filter.value || '')}
                onChange={(e) =>
                  handleFilterChange(filter.id, { value: e.target.value })
                }
                placeholder="القيمة"
                className="w-40"
              />
            )}

            {/* Between Values */}
            {isBetween && (
              <>
                <Input
                  type={fieldMeta?.dataType === 'number' ? 'number' : 'date'}
                  value={Array.isArray(filter.value) ? String(filter.value[0] || '') : ''}
                  onChange={(e) =>
                    handleFilterChange(filter.id, {
                      value: [e.target.value, Array.isArray(filter.value) ? filter.value[1] : ''],
                    })
                  }
                  placeholder="من"
                  className="w-32"
                />
                <span>إلى</span>
                <Input
                  type={fieldMeta?.dataType === 'number' ? 'number' : 'date'}
                  value={Array.isArray(filter.value) ? String(filter.value[1] || '') : ''}
                  onChange={(e) =>
                    handleFilterChange(filter.id, {
                      value: [Array.isArray(filter.value) ? filter.value[0] : '', e.target.value],
                    })
                  }
                  placeholder="إلى"
                  className="w-32"
                />
              </>
            )}

            {/* Remove Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveFilter(filter.id)}
            >
              <X className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        onClick={handleAddFilter}
        disabled={filterableFields.length === 0}
      >
        <Plus className="h-4 w-4 ml-2" />
        إضافة فلتر
      </Button>
    </div>
  );
}
