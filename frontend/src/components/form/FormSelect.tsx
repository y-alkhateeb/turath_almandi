import { UseFormRegister, FieldError, FieldValues, Path } from 'react-hook-form';
import {
  selectInputClasses,
  getBorderClasses,
  labelClasses,
  errorClasses,
  fieldContainerClasses,
} from '@/styles/formInputStyles';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface FormSelectProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  options: SelectOption[];
  register: UseFormRegister<T>;
  error?: FieldError;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function FormSelect<T extends FieldValues>({
  name,
  label,
  options,
  register,
  error,
  required = false,
  disabled = false,
  placeholder = 'اختر خيارًا...',
  className = '',
}: FormSelectProps<T>) {
  return (
    <div className={`${fieldContainerClasses} ${className}`}>
      <label htmlFor={name} className={labelClasses}>
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>
      <select
        id={name}
        {...register(name)}
        disabled={disabled}
        dir="rtl"
        className={`
          ${selectInputClasses}
          ${getBorderClasses(!!error)}
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : undefined}
      >
        <option value="" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">
          {placeholder}
        </option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="bg-[var(--bg-secondary)] text-[var(--text-primary)]"
          >
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${name}-error`} className={errorClasses} role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}
