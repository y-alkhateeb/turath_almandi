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
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'datetime-local' | 'time';
  placeholder?: string;
  register: UseFormRegister<T>;
  error?: FieldError;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  autoComplete?: string;
  step?: string;
  min?: string | number;
  max?: string | number;
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
}: FormInputProps<T>) {
  // Use date-specific classes for date inputs, base classes for others
  const isDateType = type === 'date' || type === 'datetime-local' || type === 'time';
  const inputClasses = isDateType ? dateInputClasses : baseInputClasses;

  return (
    <div className={`${fieldContainerClasses} ${className}`}>
      <label htmlFor={name} className={labelClasses}>
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>
      <input
        id={name}
        type={type}
        {...register(name)}
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
          {error.message}
        </p>
      )}
    </div>
  );
}
