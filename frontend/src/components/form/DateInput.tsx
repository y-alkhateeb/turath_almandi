import { UseFormRegister, FieldError, FieldValues, Path } from 'react-hook-form';

/**
 * DateInput Component
 *
 * Unified date input component supporting both react-hook-form and controlled modes.
 * Ensures consistent date formatting and styling across the entire application.
 *
 * Two modes:
 * 1. Form mode (with react-hook-form): Uses name, register, error props
 * 2. Controlled mode (for filters/standalone): Uses value, onChange props
 *
 * Features:
 * - Consistent styling across all date inputs
 * - RTL support
 * - Min/max date constraints
 * - Error display
 * - Helper text
 * - Required field indicator
 * - Easy to change date format globally
 */

// Form mode props (with react-hook-form)
interface DateInputFormProps<T extends FieldValues> {
  mode: 'form';
  name: Path<T>;
  register: UseFormRegister<T>;
  error?: FieldError;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  defaultValue?: string;
  helperText?: string;
  className?: string;
}

// Controlled mode props (for filters and standalone usage)
interface DateInputControlledProps {
  mode?: 'controlled';
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  placeholder?: string;
  className?: string;
  showLabel?: boolean;
  error?: string;
  helperText?: string;
}

// Discriminated union of both prop types
type DateInputProps<T extends FieldValues = any> =
  | DateInputFormProps<T>
  | DateInputControlledProps;

export function DateInput<T extends FieldValues = any>(props: DateInputProps<T>) {
  // Form mode with react-hook-form
  if (props.mode === 'form') {
    const {
      name,
      register,
      error,
      label,
      required = false,
      disabled = false,
      min,
      max,
      defaultValue,
      helperText,
      className = '',
    } = props;

    return (
      <div className={className}>
        {label && (
          <label
            htmlFor={name}
            className="block text-sm font-medium text-[var(--text-primary)] mb-2"
          >
            {label}
            {required && <span className="text-red-500 mr-1">*</span>}
          </label>
        )}
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
            bg-[var(--bg-secondary)] text-[var(--text-primary)]
            focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed disabled:opacity-50
            transition-colors
            [color-scheme:light] dark:[color-scheme:dark]
            [&::-webkit-calendar-picker-indicator]:cursor-pointer
            [&::-webkit-calendar-picker-indicator]:opacity-100
            dark:[&::-webkit-calendar-picker-indicator]:invert
            dark:[&::-webkit-calendar-picker-indicator]:brightness-200
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-[var(--border-color)]'}
          `}
          dir="ltr"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
        />
        {error && (
          <p id={`${name}-error`} className="mt-2 text-sm text-red-600" role="alert" dir="rtl">
            {error.message}
          </p>
        )}
        {helperText && !error && (
          <p id={`${name}-helper`} className="mt-1 text-xs text-[var(--text-secondary)]" dir="rtl">
            {helperText}
          </p>
        )}
      </div>
    );
  }

  // Controlled mode (default or explicit mode='controlled')
  const {
    value,
    onChange,
    label,
    disabled = false,
    min,
    max,
    placeholder,
    className = '',
    showLabel = true,
    error,
    helperText,
  } = props as DateInputControlledProps;

  return (
    <div className={className}>
      {showLabel && label && (
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          {label}
        </label>
      )}
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
        min={min}
        max={max}
        placeholder={placeholder}
        className={`
          w-full px-4 py-3 border rounded-lg
          bg-[var(--bg-secondary)] text-[var(--text-primary)]
          focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed disabled:opacity-50
          transition-colors
          [color-scheme:light] dark:[color-scheme:dark]
          [&::-webkit-calendar-picker-indicator]:cursor-pointer
          [&::-webkit-calendar-picker-indicator]:opacity-100
          dark:[&::-webkit-calendar-picker-indicator]:invert
          dark:[&::-webkit-calendar-picker-indicator]:brightness-200
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-[var(--border-color)]'}
        `}
        dir="ltr"
        aria-invalid={error ? 'true' : 'false'}
      />
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert" dir="rtl">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-[var(--text-secondary)]" dir="rtl">
          {helperText}
        </p>
      )}
    </div>
  );
}
