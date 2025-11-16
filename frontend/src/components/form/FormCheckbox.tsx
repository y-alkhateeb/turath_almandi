import { UseFormRegister, FieldError, FieldValues, Path } from 'react-hook-form';

export interface FormCheckboxProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  register: UseFormRegister<T>;
  error?: FieldError;
  disabled?: boolean;
  className?: string;
  description?: string;
}

export function FormCheckbox<T extends FieldValues>({
  name,
  label,
  register,
  error,
  disabled = false,
  className = '',
  description,
}: FormCheckboxProps<T>) {
  return (
    <div className={`mb-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex items-center h-6">
          <input
            id={name}
            type="checkbox"
            {...register(name)}
            disabled={disabled}
            className={`
              w-5 h-5 border rounded
              text-primary-600 focus:ring-2 focus:ring-primary-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
              transition-colors duration-200
              cursor-pointer
              ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
            `}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error
                ? `${name}-error`
                : description
                ? `${name}-description`
                : undefined
            }
          />
        </div>
        <div className="mr-3">
          <label
            htmlFor={name}
            className={`text-sm font-medium ${
              disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 cursor-pointer'
            }`}
          >
            {label}
          </label>
          {description && (
            <p
              id={`${name}-description`}
              className="text-sm text-gray-500 mt-1"
            >
              {description}
            </p>
          )}
        </div>
      </div>
      {error && (
        <p
          id={`${name}-error`}
          className="mt-2 text-sm text-red-600 mr-8"
          role="alert"
        >
          {error.message}
        </p>
      )}
    </div>
  );
}
