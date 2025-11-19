/**
 * FormMultiSelect Component
 *
 * A wrapper around MultiSelect for easy React Hook Form integration.
 * Automatically handles Controller and field state.
 *
 * Usage:
 * <FormMultiSelect
 *   name="branches"
 *   label="الفروع"
 *   control={control}
 *   options={branchOptions}
 *   error={errors.branches?.message}
 *   required
 * />
 */

import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { MultiSelect, MultiSelectProps, MultiSelectOption } from './MultiSelect';

// ============================================
// TYPES
// ============================================

export interface FormMultiSelectProps<T extends FieldValues>
  extends Omit<MultiSelectProps, 'value' | 'onChange' | 'error'> {
  /** Field name */
  name: Path<T>;

  /** React Hook Form control */
  control: Control<T>;

  /** Field error message */
  error?: string;

  /** Default value */
  defaultValue?: string[];
}

// ============================================
// COMPONENT
// ============================================

export function FormMultiSelect<T extends FieldValues>({
  name,
  control,
  error,
  defaultValue = [],
  ...multiSelectProps
}: FormMultiSelectProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue as any}
      render={({ field }) => (
        <MultiSelect
          {...multiSelectProps}
          name={name}
          value={field.value || []}
          onChange={field.onChange}
          error={error}
        />
      )}
    />
  );
}

export default FormMultiSelect;
