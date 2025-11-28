/**
 * FormField - Reusable Form Input Components with forwardRef
 *
 * These components are designed to work seamlessly with react-hook-form's
 * register() spread pattern: {...register('fieldName')}
 *
 * Using forwardRef ensures the ref from register() is properly forwarded
 * to the underlying HTML element.
 *
 * Usage:
 * ```tsx
 * const { register, formState: { errors } } = useForm();
 *
 * <FormFieldInput
 *   label="اسم المستخدم"
 *   error={errors.username?.message}
 *   required
 *   {...register('username')}
 * />
 * ```
 */

import * as React from 'react';
import type { FieldError } from 'react-hook-form';

// ============================================
// SHARED STYLES
// ============================================

const inputBaseClasses = `
  w-full px-4 py-3
  border rounded-lg
  focus:ring-2 focus:border-primary-500
  bg-[var(--bg-primary)] text-[var(--text-primary)]
  transition-colors
  disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed
`;

const inputNormalBorder = 'border-[var(--border-color)] focus:ring-primary-500';
const inputErrorBorder = 'border-red-500 focus:ring-red-500';

const labelClasses = 'block text-sm font-medium text-[var(--text-primary)] mb-2';
const errorClasses = 'mt-1 text-sm text-red-600';
const helperClasses = 'mt-1 text-xs text-[var(--text-secondary)]';

// ============================================
// TYPES
// ============================================

interface BaseFieldProps {
  /** Field label (displayed above input) */
  label?: string;
  /** Error message or FieldError object */
  error?: string | FieldError;
  /** Helper text (displayed below input when no error) */
  helperText?: string;
  /** Mark field as required (shows asterisk) */
  required?: boolean;
  /** Container className */
  containerClassName?: string;
}

// ============================================
// FORM FIELD INPUT
// ============================================

export interface FormFieldInputProps
  extends BaseFieldProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  /** Input className (applied to input element) */
  inputClassName?: string;
}

/**
 * FormFieldInput - Text/Number/Date input with label and error handling
 *
 * Supports all native input types and accepts {...register('fieldName')} spread
 */
export const FormFieldInput = React.forwardRef<HTMLInputElement, FormFieldInputProps>(
  (
    {
      label,
      error,
      helperText,
      required = false,
      containerClassName = '',
      inputClassName = '',
      id,
      name,
      ...props
    },
    ref
  ) => {
    const fieldId = id || name;
    const errorMessage = typeof error === 'string' ? error : error?.message;
    const hasError = !!errorMessage;

    return (
      <div className={containerClassName}>
        {label && (
          <label htmlFor={fieldId} className={labelClasses}>
            {label}
            {required && <span className="text-red-500 mr-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={fieldId}
          name={name}
          className={`${inputBaseClasses} ${hasError ? inputErrorBorder : inputNormalBorder} ${inputClassName}`}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${fieldId}-error` : helperText ? `${fieldId}-helper` : undefined}
          {...props}
        />
        {errorMessage && (
          <p id={`${fieldId}-error`} className={errorClasses} role="alert">
            {errorMessage}
          </p>
        )}
        {helperText && !hasError && (
          <p id={`${fieldId}-helper`} className={helperClasses}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
FormFieldInput.displayName = 'FormFieldInput';

// ============================================
// FORM FIELD TEXTAREA
// ============================================

export interface FormFieldTextareaProps
  extends BaseFieldProps,
    Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  /** Textarea className */
  textareaClassName?: string;
}

/**
 * FormFieldTextarea - Textarea with label and error handling
 *
 * Accepts {...register('fieldName')} spread
 */
export const FormFieldTextarea = React.forwardRef<HTMLTextAreaElement, FormFieldTextareaProps>(
  (
    {
      label,
      error,
      helperText,
      required = false,
      containerClassName = '',
      textareaClassName = '',
      id,
      name,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const fieldId = id || name;
    const errorMessage = typeof error === 'string' ? error : error?.message;
    const hasError = !!errorMessage;

    return (
      <div className={containerClassName}>
        {label && (
          <label htmlFor={fieldId} className={labelClasses}>
            {label}
            {required && <span className="text-red-500 mr-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={fieldId}
          name={name}
          rows={rows}
          className={`${inputBaseClasses} ${hasError ? inputErrorBorder : inputNormalBorder} resize-none ${textareaClassName}`}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${fieldId}-error` : helperText ? `${fieldId}-helper` : undefined}
          {...props}
        />
        {errorMessage && (
          <p id={`${fieldId}-error`} className={errorClasses} role="alert">
            {errorMessage}
          </p>
        )}
        {helperText && !hasError && (
          <p id={`${fieldId}-helper`} className={helperClasses}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
FormFieldTextarea.displayName = 'FormFieldTextarea';

// ============================================
// FORM FIELD SELECT
// ============================================

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface FormFieldSelectProps
  extends BaseFieldProps,
    Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  /** Select options */
  options: SelectOption[];
  /** Placeholder option text */
  placeholder?: string;
  /** Select className */
  selectClassName?: string;
}

/**
 * FormFieldSelect - Select dropdown with label and error handling
 *
 * Accepts {...register('fieldName')} spread
 */
export const FormFieldSelect = React.forwardRef<HTMLSelectElement, FormFieldSelectProps>(
  (
    {
      label,
      error,
      helperText,
      required = false,
      containerClassName = '',
      selectClassName = '',
      options,
      placeholder = 'اختر...',
      id,
      name,
      ...props
    },
    ref
  ) => {
    const fieldId = id || name;
    const errorMessage = typeof error === 'string' ? error : error?.message;
    const hasError = !!errorMessage;

    return (
      <div className={containerClassName}>
        {label && (
          <label htmlFor={fieldId} className={labelClasses}>
            {label}
            {required && <span className="text-red-500 mr-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={fieldId}
          name={name}
          dir="rtl"
          className={`${inputBaseClasses} ${hasError ? inputErrorBorder : inputNormalBorder} ${selectClassName}`}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${fieldId}-error` : helperText ? `${fieldId}-helper` : undefined}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errorMessage && (
          <p id={`${fieldId}-error`} className={errorClasses} role="alert">
            {errorMessage}
          </p>
        )}
        {helperText && !hasError && (
          <p id={`${fieldId}-helper`} className={helperClasses}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
FormFieldSelect.displayName = 'FormFieldSelect';

// ============================================
// FORM FIELD DATE
// ============================================

export interface FormFieldDateProps
  extends BaseFieldProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className' | 'type'> {
  /** Input className */
  inputClassName?: string;
}

/**
 * FormFieldDate - Date input with label and error handling
 *
 * Accepts {...register('fieldName')} spread
 * Uses dir="ltr" for proper date display in RTL layouts
 */
export const FormFieldDate = React.forwardRef<HTMLInputElement, FormFieldDateProps>(
  (
    {
      label,
      error,
      helperText,
      required = false,
      containerClassName = '',
      inputClassName = '',
      id,
      name,
      ...props
    },
    ref
  ) => {
    const fieldId = id || name;
    const errorMessage = typeof error === 'string' ? error : error?.message;
    const hasError = !!errorMessage;

    return (
      <div className={containerClassName}>
        {label && (
          <label htmlFor={fieldId} className={labelClasses}>
            {label}
            {required && <span className="text-red-500 mr-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={fieldId}
          name={name}
          type="date"
          dir="ltr"
          className={`${inputBaseClasses} ${hasError ? inputErrorBorder : inputNormalBorder} ${inputClassName}`}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${fieldId}-error` : helperText ? `${fieldId}-helper` : undefined}
          {...props}
        />
        {errorMessage && (
          <p id={`${fieldId}-error`} className={errorClasses} role="alert">
            {errorMessage}
          </p>
        )}
        {helperText && !hasError && (
          <p id={`${fieldId}-helper`} className={helperClasses}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
FormFieldDate.displayName = 'FormFieldDate';

// ============================================
// EXPORTS
// ============================================

export default {
  Input: FormFieldInput,
  Textarea: FormFieldTextarea,
  Select: FormFieldSelect,
  Date: FormFieldDate,
};
