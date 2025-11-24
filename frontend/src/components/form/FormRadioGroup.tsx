import { UseFormRegister, FieldError, FieldValues, Path } from 'react-hook-form';

export interface RadioOption {
  value: string | number;
  label: string;
  description?: string;
}

export interface FormRadioGroupProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  options: RadioOption[];
  register?: UseFormRegister<T>;
  error?: FieldError | string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  inline?: boolean;
  // Controlled component props
  value?: string | number;
  onChange?: (value: string | number) => void;
}

export function FormRadioGroup<T extends FieldValues>({
  name,
  label,
  options,
  register,
  error,
  required = false,
  disabled = false,
  className = '',
  inline = false,
  value,
  onChange,
}: FormRadioGroupProps<T>) {
  // Determine if using react-hook-form or controlled component
  const isControlled = value !== undefined || onChange !== undefined;
  const errorMessage = typeof error === 'string' ? error : error?.message;

  return (
    <div className={`mb-4 ${className}`}>
      <fieldset>
        <legend className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </legend>
        <div
          className={`space-y-3 ${inline ? 'sm:flex sm:items-center sm:space-y-0 sm:space-x-4 sm:space-x-reverse' : ''}`}
          role="group"
          aria-labelledby={`${name}-label`}
        >
          {options.map((option) => (
            <div key={option.value} className="flex items-start">
              <div className="flex items-center h-6">
                <input
                  id={`${name}-${option.value}`}
                  type="radio"
                  {...(register && !isControlled ? register(name) : {})}
                  value={option.value}
                  checked={isControlled ? value === option.value : undefined}
                  onChange={
                    isControlled ? () => onChange?.(option.value) : undefined
                  }
                  disabled={disabled}
                  className={`
                    w-5 h-5 border
                    bg-[var(--bg-secondary)]
                    text-primary-600 focus:ring-2 focus:ring-primary-500
                    disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed
                    transition-colors duration-200
                    cursor-pointer
                    ${error ? 'border-red-500 focus:ring-red-500' : 'border-[var(--border-color)]'}
                  `}
                  aria-invalid={error ? 'true' : 'false'}
                  aria-describedby={
                    error
                      ? `${name}-error`
                      : option.description
                        ? `${name}-${option.value}-description`
                        : undefined
                  }
                />
              </div>
              <div className="mr-3">
                <label
                  htmlFor={`${name}-${option.value}`}
                  className={`text-sm font-medium ${
                    disabled
                      ? 'text-[var(--text-secondary)] cursor-not-allowed'
                      : 'text-[var(--text-primary)] cursor-pointer'
                  }`}
                >
                  {option.label}
                </label>
                {option.description && (
                  <p
                    id={`${name}-${option.value}-description`}
                    className="text-sm text-[var(--text-secondary)] mt-1"
                  >
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </fieldset>
      {error && (
        <p id={`${name}-error`} className="mt-2 text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
