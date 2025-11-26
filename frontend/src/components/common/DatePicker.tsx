/**
 * DatePicker Component
 *
 * A comprehensive date picker with:
 * - RTL support
 * - Arabic month/day names
 * - Future date restriction (configurable)
 * - React Hook Form integration
 * - Zod validation support
 * - Min/Max date constraints
 *
 * Usage with React Hook Form Controller:
 * <Controller
 *   name="date"
 *   control={control}
 *   render={({ field, fieldState }) => (
 *     <DatePicker
 *       value={field.value}
 *       onChange={field.onChange}
 *       error={fieldState.error}
 *       disabled={isSubmitting}
 *     />
 *   )}
 * />
 */

import { forwardRef } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/ar';
import { FieldError } from 'react-hook-form';

// Configure dayjs to use Arabic locale
dayjs.locale('ar');

// ============================================
// TYPES
// ============================================

export interface DatePickerProps {
  /** Current value (ISO string or Date) */
  value?: string | Date | null;

  /** Change handler */
  onChange: (value: string | null) => void;

  /** Field error from React Hook Form */
  error?: FieldError;

  /** Disabled state */
  disabled?: boolean;

  /** Maximum allowed date (ISO string or Date) */
  maxDate?: string | Date;

  /** Minimum allowed date (ISO string or Date) */
  minDate?: string | Date;

  /** Restrict future dates (default: false) */
  restrictFuture?: boolean;

  /** Label text */
  label?: string;

  /** Required field indicator */
  required?: boolean;

  /** Placeholder text */
  placeholder?: string;

  /** Additional CSS classes */
  className?: string;

  /** Helper text shown below input */
  helperText?: string;

  /** Name attribute for accessibility */
  name?: string;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format date to YYYY-MM-DD for input value
 */
function formatDateForInput(date: string | Date | null | undefined): string {
  if (!date) return '';

  try {
    return dayjs(date).format('YYYY-MM-DD');
  } catch {
    return '';
  }
}

/**
 * Format date to Arabic readable format for display
 */
function formatDateArabic(date: string | Date | null | undefined): string {
  if (!date) return '';

  try {
    return dayjs(date).locale('ar').format('DD MMMM YYYY');
  } catch {
    return '';
  }
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayString(): string {
  return dayjs().format('YYYY-MM-DD');
}

// ============================================
// COMPONENT
// ============================================

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      value,
      onChange,
      error,
      disabled = false,
      maxDate,
      minDate,
      restrictFuture = false,
      label,
      required = false,
      placeholder = 'اختر التاريخ',
      className = '',
      helperText,
      name,
    },
    ref
  ) => {
    // Calculate min and max dates
    const minDateStr = minDate ? formatDateForInput(minDate) : undefined;
    const maxDateStr = maxDate
      ? formatDateForInput(maxDate)
      : restrictFuture
        ? getTodayString()
        : undefined;

    // Current value formatted for input
    const inputValue = formatDateForInput(value);

    // Arabic formatted date for display (optional enhancement)
    const arabicDate = inputValue ? formatDateArabic(inputValue) : '';

    // Handle date change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue || null);
    };

    // Handle clear button
    const handleClear = () => {
      onChange(null);
    };

    return (
      <div className={`${className}`} dir="rtl">
        {/* Label */}
        {label && (
          <label
            htmlFor={name}
            className="block text-sm font-medium text-[var(--text-primary)] mb-2"
          >
            {label}
            {required && <span className="text-red-500 mr-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Native Date Input */}
          <input
            ref={ref}
            id={name}
            name={name}
            type="date"
            value={inputValue}
            onChange={handleChange}
            disabled={disabled}
            min={minDateStr}
            max={maxDateStr}
            placeholder={placeholder}
            className={`
              w-full px-4 py-3 border rounded-lg
              bg-[var(--bg-secondary)] text-[var(--text-primary)]
              focus:ring-2 focus:ring-primary-500 focus:border-primary-500
              disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed disabled:text-[var(--text-secondary)]
              disabled:opacity-50
              transition-colors duration-200
              [color-scheme:light] dark:[color-scheme:dark]
              [&::-webkit-calendar-picker-indicator]:cursor-pointer
              [&::-webkit-calendar-picker-indicator]:opacity-100
              dark:[&::-webkit-calendar-picker-indicator]:invert
              dark:[&::-webkit-calendar-picker-indicator]:brightness-200
              ${error ? 'border-red-500 focus:ring-red-500' : 'border-[var(--border-color)]'}
              ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
            dir="ltr"
          />

          {/* Clear Button */}
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="مسح التاريخ"
              tabIndex={-1}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Arabic Date Display (Optional) */}
        {arabicDate && !error && (
          <p className="mt-1 text-xs text-[var(--text-secondary)]" dir="rtl">
            {arabicDate}
          </p>
        )}

        {/* Error Message */}
        {error && (
          <p id={`${name}-error`} className="mt-2 text-sm text-red-600" role="alert" dir="rtl">
            {error.message}
          </p>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p id={`${name}-helper`} className="mt-1 text-xs text-[var(--text-secondary)]" dir="rtl">
            {helperText}
          </p>
        )}

        {/* Date Constraints Info */}
        {(minDateStr || maxDateStr) && !error && !helperText && (
          <p className="mt-1 text-xs text-[var(--text-secondary)]" dir="rtl">
            {minDateStr && maxDateStr && (
              <>
                من {formatDateArabic(minDateStr)} إلى {formatDateArabic(maxDateStr)}
              </>
            )}
            {minDateStr && !maxDateStr && (
              <>التاريخ يجب أن يكون من {formatDateArabic(minDateStr)}</>
            )}
            {!minDateStr && maxDateStr && (
              <>التاريخ يجب أن يكون قبل {formatDateArabic(maxDateStr)}</>
            )}
          </p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';

export default DatePicker;
