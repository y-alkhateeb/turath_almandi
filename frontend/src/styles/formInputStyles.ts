/**
 * Shared Form Input Styles
 * Centralized styling for consistent form inputs across the application
 * Follows DRY principle (Don't Repeat Yourself)
 */

/**
 * Base input classes shared by all input types
 * Includes: sizing, colors, borders, focus states, transitions
 */
export const baseInputClasses = `
  w-full px-4 py-3 border rounded-lg
  bg-[var(--bg-secondary)] text-[var(--text-primary)]
  focus:ring-2 focus:ring-primary-500 focus:border-transparent
  disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed disabled:text-[var(--text-secondary)]
  transition-colors duration-200
`;

/**
 * Date input specific classes
 * Includes color-scheme for native date picker styling in dark mode
 */
export const dateInputClasses = `
  ${baseInputClasses}
  [color-scheme:light] dark:[color-scheme:dark]
`;

/**
 * Select dropdown classes
 * Similar to base but optimized for select elements
 */
export const selectInputClasses = baseInputClasses;

/**
 * Textarea classes
 * Same as base input but without height restrictions
 */
export const textareaClasses = baseInputClasses;

/**
 * Get border color classes based on error state
 */
export const getBorderClasses = (hasError: boolean): string => {
  return hasError ? 'border-red-500 focus:ring-red-500' : 'border-[var(--border-color)]';
};

/**
 * Label classes for form inputs
 */
export const labelClasses = 'block text-sm font-medium text-[var(--text-primary)] mb-2';

/**
 * Error message classes
 */
export const errorClasses = 'mt-2 text-sm text-red-600';

/**
 * Helper text classes
 */
export const helperTextClasses = 'mt-1 text-xs text-[var(--text-secondary)]';

/**
 * Container classes for form fields
 */
export const fieldContainerClasses = 'mb-4';
