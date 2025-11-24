import { useMemo, useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GripVertical, Eye, EyeOff, Search, X } from 'lucide-react';
import type { FieldMetadata, ReportField } from '@/types/smart-reports.types';
import { v4 as uuidv4 } from 'uuid';

interface FieldSelectorProps {
  availableFields: FieldMetadata[];
  selectedFields: ReportField[];
  onChange: (fields: ReportField[]) => void;
}

interface SortableFieldItemProps {
  field: ReportField;
  onToggleVisibility: (id: string) => void;
  onRemove: (id: string) => void;
}

function SortableFieldItem({ field, onToggleVisibility, onRemove }: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-white border rounded-md"
    >
      <button
        type="button"
        className="cursor-grab hover:bg-gray-100 p-1 rounded"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </button>

      <span className="flex-1 text-sm">{field.displayName}</span>

      <button
        type="button"
        onClick={() => onToggleVisibility(field.id)}
        className="p-1 hover:bg-gray-100 rounded"
      >
        {field.visible ? (
          <Eye className="h-4 w-4 text-green-600" />
        ) : (
          <EyeOff className="h-4 w-4 text-gray-400" />
        )}
      </button>

      <button
        type="button"
        onClick={() => onRemove(field.id)}
        className="p-1 hover:bg-red-100 rounded"
      >
        <X className="h-4 w-4 text-red-500" />
      </button>
    </div>
  );
}

export function FieldSelector({ availableFields, selectedFields, onChange }: FieldSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get selected field names for quick lookup
  const selectedFieldNames = useMemo(
    () => new Set(selectedFields.map((f) => f.sourceField)),
    [selectedFields]
  );

  // Filter available fields
  const filteredAvailable = useMemo(
    () =>
      availableFields.filter(
        (f) =>
          !selectedFieldNames.has(f.fieldName) &&
          (f.displayName.includes(searchTerm) || f.fieldName.includes(searchTerm))
      ),
    [availableFields, selectedFieldNames, searchTerm]
  );

  // Handle adding a field
  const handleAddField = useCallback(
    (metadata: FieldMetadata) => {
      const newField: ReportField = {
        id: uuidv4(),
        sourceField: metadata.fieldName,
        displayName: metadata.displayName,
        dataType: metadata.dataType,
        visible: true,
        order: selectedFields.length,
        format: metadata.format,
      };
      onChange([...selectedFields, newField]);
    },
    [selectedFields, onChange]
  );

  // Handle removing a field
  const handleRemoveField = useCallback(
    (id: string) => {
      onChange(selectedFields.filter((f) => f.id !== id));
    },
    [selectedFields, onChange]
  );

  // Handle toggling visibility
  const handleToggleVisibility = useCallback(
    (id: string) => {
      onChange(
        selectedFields.map((f) =>
          f.id === id ? { ...f, visible: !f.visible } : f
        )
      );
    },
    [selectedFields, onChange]
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = selectedFields.findIndex((f) => f.id === active.id);
        const newIndex = selectedFields.findIndex((f) => f.id === over.id);

        const reordered = arrayMove(selectedFields, oldIndex, newIndex).map(
          (field, index) => ({ ...field, order: index })
        );

        onChange(reordered);
      }
    },
    [selectedFields, onChange]
  );

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Available Fields */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">الحقول المتاحة</h4>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="بحث..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-9"
          />
        </div>
        <div className="border rounded-md p-2 h-64 overflow-y-auto space-y-1">
          {filteredAvailable.map((field) => (
            <div
              key={field.id}
              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
              onClick={() => handleAddField(field)}
            >
              <Checkbox checked={false} />
              <span className="text-sm">{field.displayName}</span>
              <span className="text-xs text-gray-400">({field.fieldName})</span>
            </div>
          ))}
          {filteredAvailable.length === 0 && (
            <p className="text-center text-gray-400 py-4">لا توجد حقول</p>
          )}
        </div>
      </div>

      {/* Selected Fields */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">
          الحقول المحددة ({selectedFields.length})
        </h4>
        <div className="border rounded-md p-2 h-72 overflow-y-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={selectedFields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {selectedFields.map((field) => (
                  <SortableFieldItem
                    key={field.id}
                    field={field}
                    onToggleVisibility={handleToggleVisibility}
                    onRemove={handleRemoveField}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {selectedFields.length === 0 && (
            <p className="text-center text-gray-400 py-4">
              اختر الحقول من القائمة اليسرى
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
