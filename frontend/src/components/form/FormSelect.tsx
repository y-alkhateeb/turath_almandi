import { UseFormRegister, FieldError, FieldValues, Path } from 'react-hook-form';

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
    <div className={`mb-4 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-[var(--text-primary)] mb-2">
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>
      <select
        id={name}
        {...register(name)}
        disabled={disabled}
        className={`
          w-full px-4 py-3 border rounded-lg
          focus:ring-2 focus:ring-primary-500 focus:border-transparent
          disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed
          transition-colors duration-200
          bg-[var(--bg-secondary)]
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-[var(--border-color)]'}
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : undefined}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${name}-error`} className="mt-2 text-sm text-red-600" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}
