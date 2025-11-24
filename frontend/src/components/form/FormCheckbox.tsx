import { UseFormRegister, FieldError, FieldValues, Path } from 'react-hook-form';

export interface FormCheckboxProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  register?: UseFormRegister<T>;
  error?: FieldError | string;
  disabled?: boolean;
  className?: string;
  description?: string;
  // Controlled component props (for use without react-hook-form)
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export function FormCheckbox<T extends FieldValues>({
  name,
  label,
  register,
  error,
  disabled = false,
  className = '',
  description,
  checked,
  onChange,
  onBlur,
}: FormCheckboxProps<T>) {
  // Determine if using react-hook-form or controlled component
  const isControlled = checked !== undefined || onChange !== undefined;

  // Error can be FieldError object or string
  const errorMessage = typeof error === 'string' ? error : error?.message;

  return (
    <div className={`mb-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex items-center h-6">
          <input
            id={name}
            type="checkbox"
            {...(register && !isControlled ? register(name) : {})}
            checked={isControlled ? checked : undefined}
            onChange={isControlled ? onChange : undefined}
            onBlur={isControlled ? onBlur : undefined}
            disabled={disabled}
            className={`
              w-5 h-5 border rounded
              text-primary-600 focus:ring-2 focus:ring-primary-500
              disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed
              transition-colors duration-200
              cursor-pointer
              ${error ? 'border-red-500 focus:ring-red-500' : 'border-[var(--border-color)]'}
            `}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${name}-error` : description ? `${name}-description` : undefined
            }
          />
        </div>
        <div className="mr-3">
          <label
            htmlFor={name}
            className={`text-sm font-medium ${
              disabled
                ? 'text-[var(--text-secondary)] cursor-not-allowed'
                : 'text-[var(--text-primary)] cursor-pointer'
            }`}
          >
            {label}
          </label>
          {description && (
            <p id={`${name}-description`} className="text-sm text-[var(--text-secondary)] mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      {errorMessage && (
        <p id={`${name}-error`} className="mt-2 text-sm text-red-600 mr-8" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
