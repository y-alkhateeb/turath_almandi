import { UseFormRegister, FieldError, FieldValues, Path } from 'react-hook-form';

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
}: FormDatePickerProps<T>) {
  return (
    <div className={`mb-4 ${className}`}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-[var(--text-primary)] mb-2"
      >
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>
      <input
        id={name}
        type="date"
        {...register(name)}
        disabled={disabled}
        min={min}
        max={max}
        defaultValue={defaultValue}
        className={`
          w-full px-4 py-3 border rounded-lg
          focus:ring-2 focus:ring-primary-500 focus:border-transparent
          disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed
          transition-colors duration-200
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-[var(--border-color)]'}
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <p
          id={`${name}-error`}
          className="mt-2 text-sm text-red-600"
          role="alert"
        >
          {error.message}
        </p>
      )}
    </div>
  );
}
