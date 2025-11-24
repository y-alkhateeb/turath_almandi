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
  register?: UseFormRegister<T>;
  error?: FieldError | string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  // Controlled component props (for use without react-hook-form)
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
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
  value,
  onChange,
  onBlur,
}: FormSelectProps<T>) {
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
      <select
        id={name}
        {...(register && !isControlled ? register(name) : {})}
        value={isControlled ? value : undefined}
        onChange={isControlled ? onChange : undefined}
        onBlur={isControlled ? onBlur : undefined}
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
      {errorMessage && (
        <p id={`${name}-error`} className={errorClasses} role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
