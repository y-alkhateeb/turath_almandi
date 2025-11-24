import { UseFormRegister, FieldError, FieldValues, Path } from 'react-hook-form';
import {
  baseInputClasses,
  dateInputClasses,
  getBorderClasses,
  labelClasses,
  errorClasses,
  fieldContainerClasses,
} from '@/styles/formInputStyles';

export interface FormInputProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'datetime-local' | 'time';
  placeholder?: string;
  register?: UseFormRegister<T>;
  error?: FieldError | string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  autoComplete?: string;
  step?: string;
  min?: string | number;
  max?: string | number;
  // Controlled component props
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FormInput<T extends FieldValues>({
  name,
  label,
  type = 'text',
  placeholder,
  register,
  error,
  required = false,
  disabled = false,
  className = '',
  autoComplete,
  step,
  min,
  max,
  value,
  onChange,
}: FormInputProps<T>) {
  // Determine if using react-hook-form or controlled component
  const isControlled = value !== undefined || onChange !== undefined;
  const errorMessage = typeof error === 'string' ? error : error?.message;

  // Use date-specific classes for date inputs, base classes for others
  const isDateType = type === 'date' || type === 'datetime-local' || type === 'time';
  const inputClasses = isDateType ? dateInputClasses : baseInputClasses;

  return (
    <div className={`${fieldContainerClasses} ${className}`}>
      {label && (
        <label htmlFor={name} className={labelClasses}>
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}
      <input
        id={name}
        type={type}
        {...(register && !isControlled ? register(name) : {})}
        value={isControlled ? value : undefined}
        onChange={isControlled ? onChange : undefined}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        step={step}
        min={min}
        max={max}
        className={`
          ${inputClasses}
          placeholder:text-[var(--text-tertiary)]
          ${getBorderClasses(!!error)}
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <p id={`${name}-error`} className={errorClasses} role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
