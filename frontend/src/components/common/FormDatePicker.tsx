/**
 * FormDatePicker Component
 *
 * A wrapper around DatePicker for easy React Hook Form integration.
 * Automatically handles Controller and field state.
 *
 * Usage:
 * <FormDatePicker
 *   name="date"
 *   label="تاريخ العملية"
 *   control={control}
 *   error={errors.date}
 *   restrictFuture
 *   required
 * />
 */

import { Controller, Control, FieldError, FieldValues, Path } from 'react-hook-form';
import { DatePicker, DatePickerProps } from './DatePicker';

// ============================================
// TYPES
// ============================================

export interface FormDatePickerProps<T extends FieldValues>
  extends Omit<DatePickerProps, 'value' | 'onChange' | 'error'> {
  /** Field name */
  name: Path<T>;

  /** React Hook Form control */
  control: Control<T>;

  /** Field error */
  error?: FieldError;

  /** Default value */
  defaultValue?: string | Date | null;
}

// ============================================
// COMPONENT
// ============================================

export function FormDatePicker<T extends FieldValues>({
  name,
  control,
  error,
  defaultValue,
  ...datePickerProps
}: FormDatePickerProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue as unknown}
      render={({ field }) => (
        <DatePicker
          {...datePickerProps}
          name={name}
          value={field.value}
          onChange={field.onChange}
          error={error}
        />
      )}
    />
  );
}

export default FormDatePicker;
