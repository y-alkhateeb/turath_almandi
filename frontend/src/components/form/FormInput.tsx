import { UseFormRegister, FieldError, FieldValues, Path } from 'react-hook-form';

export interface FormInputProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
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
  return (
    <div className={`mb-4 ${className}`}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
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
          w-full px-4 py-3 border rounded-lg
          focus:ring-2 focus:ring-primary-500 focus:border-transparent
          disabled:bg-gray-100 disabled:cursor-not-allowed
          transition-colors duration-200
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
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
