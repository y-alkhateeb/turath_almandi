/**
 * FormDateRangePicker Component
 *
 * A wrapper around DateRangePicker for easy React Hook Form integration.
 * Automatically handles Controller and field state.
 *
 * Usage:
 * <FormDateRangePicker
 *   name="dateRange"
 *   label="فترة التقرير"
 *   control={control}
 *   error={errors.dateRange}
 *   required
 * />
 */

import { Controller, Control, FieldError, FieldValues, Path } from 'react-hook-form';
import { DateRangePicker, DateRangePickerProps, DateRange } from './DateRangePicker';

// ============================================
// TYPES
// ============================================

export interface FormDateRangePickerProps<T extends FieldValues>
  extends Omit<DateRangePickerProps, 'value' | 'onChange' | 'error'> {
  /** Field name */
  name: Path<T>;

  /** React Hook Form control */
  control: Control<T>;

  /** Field error */
  error?: FieldError;

  /** Default value */
  defaultValue?: DateRange | null;
}

// ============================================
// COMPONENT
// ============================================

export function FormDateRangePicker<T extends FieldValues>({
  name,
  control,
  error,
  defaultValue,
  ...dateRangePickerProps
}: FormDateRangePickerProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue as unknown}
      render={({ field }) => (
        <DateRangePicker
          {...dateRangePickerProps}
          value={field.value}
          onChange={field.onChange}
          error={error}
        />
      )}
    />
  );
}

export default FormDateRangePicker;
