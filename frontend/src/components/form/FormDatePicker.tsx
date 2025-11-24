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
  register?: UseFormRegister<T>;
  error?: FieldError | string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  min?: string;
  max?: string;
  defaultValue?: string;
  valueAsDate?: boolean;
  helperText?: string;
  // Controlled component props (for use without react-hook-form)
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
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
  value,
  onChange,
  onBlur,
}: FormDatePickerProps<T>) {
  // Determine if using react-hook-form or controlled component
  const isControlled = value !== undefined || onChange !== undefined;

  // Error can be FieldError object or string
  const errorMessage = typeof error === 'string' ? error : error?.message;

  return (
    <div className={`${fieldContainerClasses} ${className}`}>
      <label htmlFor={name} className={labelClasses}>
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>
      <input
        id={name}
        type="date"
        {...(register && !isControlled
          ? register(name, valueAsDate ? { valueAsDate: true } : undefined)
          : {})}
        value={isControlled ? value : undefined}
        onChange={isControlled ? onChange : undefined}
        onBlur={isControlled ? onBlur : undefined}
        disabled={disabled}
        min={min}
        max={max}
        defaultValue={!isControlled ? defaultValue : undefined}
        className={`
          ${dateInputClasses}
          ${getBorderClasses(!!error)}
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {errorMessage && (
        <p id={`${name}-error`} className={errorClasses} role="alert">
          {errorMessage}
        </p>
      )}
      {helperText && !error && <p className={helperTextClasses}>{helperText}</p>}
    </div>
  );
}
