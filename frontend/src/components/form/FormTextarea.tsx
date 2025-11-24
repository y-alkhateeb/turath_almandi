import { UseFormRegister, FieldError, FieldValues, Path } from 'react-hook-form';

export interface FormTextareaProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  placeholder?: string;
  register?: UseFormRegister<T>;
  error?: FieldError | string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  rows?: number;
  maxLength?: number;
  // Controlled component props
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export function FormTextarea<T extends FieldValues>({
  name,
  label,
  placeholder,
  register,
  error,
  required = false,
  disabled = false,
  className = '',
  rows = 4,
  maxLength,
  value,
  onChange,
}: FormTextareaProps<T>) {
  // Determine if using react-hook-form or controlled component
  const isControlled = value !== undefined || onChange !== undefined;
  const errorMessage = typeof error === 'string' ? error : error?.message;

  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-[var(--text-primary)] mb-2">
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>
      <textarea
        id={name}
        {...(register && !isControlled ? register(name) : {})}
        value={isControlled ? value : undefined}
        onChange={isControlled ? onChange : undefined}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className={`
          w-full px-4 py-3 border rounded-lg
          bg-[var(--bg-secondary)] text-[var(--text-primary)]
          placeholder:text-[var(--text-tertiary)]
          focus:ring-2 focus:ring-primary-500 focus:border-transparent
          disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed disabled:text-[var(--text-secondary)]
          transition-colors duration-200
          resize-vertical
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-[var(--border-color)]'}
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <p id={`${name}-error`} className="mt-2 text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
