import { UseFormRegister, FieldError, FieldValues, Path } from 'react-hook-form';
import {
  dateInputClasses,
  getBorderClasses,
  labelClasses,
  errorClasses,
  fieldContainerClasses,
  helperTextClasses,
} from '@/styles/formInputStyles';

export interface FormDatePickerProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  register: UseFormRegister<T>;
  error?: FieldError;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  min?: string;
  max?: string;
  defaultValue?: string;
  valueAsDate?: boolean;
  helperText?: string;
}

export function FormDatePicker<T extends FieldValues>({
  name,
  label,
  register,
  error,
  required = false,
  disabled = false,
  className = '',
  min,
  max,
  defaultValue,
  valueAsDate = false,
  helperText,
}: FormDatePickerProps<T>) {
  return (
    <div className={`${fieldContainerClasses} ${className}`}>
      <label htmlFor={name} className={labelClasses}>
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>
      <input
        id={name}
        type="date"
        {...register(name, valueAsDate ? { valueAsDate: true } : undefined)}
        disabled={disabled}
        min={min}
        max={max}
        defaultValue={defaultValue}
        className={`
          ${dateInputClasses}
          ${getBorderClasses(!!error)}
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <p id={`${name}-error`} className={errorClasses} role="alert">
          {error.message}
        </p>
      )}
      {helperText && !error && <p className={helperTextClasses}>{helperText}</p>}
    </div>
  );
}
