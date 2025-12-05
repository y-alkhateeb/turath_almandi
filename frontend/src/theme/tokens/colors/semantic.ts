/**
 * Semantic Color Tokens - CSS Variable Based
 *
 * This file provides helpers to read colors from CSS variables.
 * CSS Variables in index.css are the Single Source of Truth.
 *
 * Benefits:
 * - No duplication between CSS and TypeScript
 * - Automatic sync with CSS changes
 * - Runtime theming support (dark/light mode)
 * - Smaller bundle size
 */

// ============================================
// CSS Variable Reader
// ============================================

/**
 * Get a CSS custom property value from the document root
 * @param varName - CSS variable name without '--' prefix
 * @returns The computed value of the CSS variable
 */
export function getColorFromCSS(varName: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--${varName}`)
    .trim();
}

// ============================================
// Type Definitions
// ============================================

export type ColorTokenSet = {
  lighter: string;
  light: string;
  main: string;
  dark: string;
  darker: string;
  contrast: string;
};

export type BrandColorTokens = {
  main: string;
  foreground: string;
};

export type BrandColors = {
  primary: BrandColorTokens;
  secondary: BrandColorTokens;
  accent: BrandColorTokens;
};

export type SemanticColors = {
  success: ColorTokenSet;
  warning: ColorTokenSet;
  danger: ColorTokenSet;
  info: ColorTokenSet;
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    disabled: string;
    inverse: string;
  };
  background: {
    default: string;
    paper: string;
    neutral: string;
    hover: string;
    selected: string;
    disabled: string;
  };
  border: {
    light: string;
    main: string;
    dark: string;
    focus: string;
  };
  action: {
    hover: string;
    selected: string;
    focus: string;
    disabled: string;
    disabledBackground: string;
    active: string;
  };
};

export type TransactionColorTokens = {
  main: string;
  light: string;
  lighter: string;
  contrast: string;
};

export type TransactionColors = {
  income: TransactionColorTokens;
  expense: TransactionColorTokens;
  transfer: TransactionColorTokens;
};

// ============================================
// Brand Colors (from CSS Variables)
// ============================================

/**
 * Get brand colors from CSS variables
 * These automatically update when theme changes
 */
export function getBrandColors(): BrandColors {
  return {
    primary: {
      main: getColorFromCSS('primary'),
      foreground: getColorFromCSS('primary-foreground'),
    },
    secondary: {
      main: getColorFromCSS('secondary'),
      foreground: getColorFromCSS('secondary-foreground'),
    },
    accent: {
      main: getColorFromCSS('accent'),
      foreground: getColorFromCSS('accent-foreground'),
    },
  };
}

// ============================================
// Semantic Colors (from CSS Variables)
// ============================================

/**
 * Get semantic colors from CSS variables
 * These automatically update when theme changes
 */
export function getSemanticColors(): SemanticColors {
  const success = getColorFromCSS('success');
  const warning = getColorFromCSS('warning');
  const destructive = getColorFromCSS('destructive');
  const info = getColorFromCSS('info');
  const foreground = getColorFromCSS('foreground');
  const mutedForeground = getColorFromCSS('muted-foreground');
  const background = getColorFromCSS('background');
  const card = getColorFromCSS('card');
  const muted = getColorFromCSS('muted');
  const border = getColorFromCSS('border');
  const ring = getColorFromCSS('ring');

  return {
    success: {
      lighter: success,
      light: success,
      main: success,
      dark: success,
      darker: success,
      contrast: getColorFromCSS('success-foreground'),
    },
    warning: {
      lighter: warning,
      light: warning,
      main: warning,
      dark: warning,
      darker: warning,
      contrast: getColorFromCSS('warning-foreground'),
    },
    danger: {
      lighter: destructive,
      light: destructive,
      main: destructive,
      dark: destructive,
      darker: destructive,
      contrast: getColorFromCSS('destructive-foreground'),
    },
    info: {
      lighter: info,
      light: info,
      main: info,
      dark: info,
      darker: info,
      contrast: getColorFromCSS('info-foreground'),
    },
    text: {
      primary: foreground,
      secondary: mutedForeground,
      tertiary: mutedForeground,
      disabled: mutedForeground,
      inverse: background,
    },
    background: {
      default: background,
      paper: card,
      neutral: muted,
      hover: muted,
      selected: muted,
      disabled: muted,
    },
    border: {
      light: border,
      main: border,
      dark: border,
      focus: ring,
    },
    action: {
      hover: 'rgba(0, 0, 0, 0.04)',
      selected: 'rgba(0, 0, 0, 0.08)',
      focus: 'rgba(0, 0, 0, 0.12)',
      disabled: 'rgba(0, 0, 0, 0.26)',
      disabledBackground: 'rgba(0, 0, 0, 0.12)',
      active: 'rgba(0, 0, 0, 0.54)',
    },
  };
}

// ============================================
// Transaction Colors (from CSS Variables)
// ============================================

/**
 * Get transaction-specific colors from CSS variables
 * Maps to semantic colors: income=success, expense=destructive, transfer=info
 */
export function getTransactionColors(): TransactionColors {
  return {
    income: {
      main: getColorFromCSS('success'),
      light: getColorFromCSS('success'),
      lighter: getColorFromCSS('success'),
      contrast: getColorFromCSS('success-foreground'),
    },
    expense: {
      main: getColorFromCSS('destructive'),
      light: getColorFromCSS('destructive'),
      lighter: getColorFromCSS('destructive'),
      contrast: getColorFromCSS('destructive-foreground'),
    },
    transfer: {
      main: getColorFromCSS('info'),
      light: getColorFromCSS('info'),
      lighter: getColorFromCSS('info'),
      contrast: getColorFromCSS('info-foreground'),
    },
  };
}

// ============================================
// Legacy Exports (for backward compatibility)
// ============================================

// These are kept for components that import them directly
// They will read from CSS at runtime
export const lightSemanticColors = {} as SemanticColors;
export const darkSemanticColors = {} as SemanticColors;
export const lightTransactionColors = {} as TransactionColors;
export const darkTransactionColors = {} as TransactionColors;

// Brand color exports (empty objects - use getBrandColors() instead)
export const lightBrandColors = {} as BrandColors;
export const darkBrandColors = {} as BrandColors;
