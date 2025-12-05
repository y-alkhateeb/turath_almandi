/**
 * Theme type definitions
 */

export enum ThemeMode {
  Light = 'light',
  Dark = 'dark',
}

export enum ThemeColorPresets {
  Default = 'default',
  Brand = 'brand',
  Primary = 'primary',
  Success = 'success',
}

export enum ThemeLayout {
  Vertical = 'vertical',
  Horizontal = 'horizontal',
  Mini = 'mini',
}

export type Direction = 'rtl' | 'ltr';

export type SettingsType = {
  themeColorPresets: ThemeColorPresets;
  themeMode: ThemeMode;
  themeLayout: ThemeLayout;
  themeStretch: boolean;
  breadCrumb: boolean;
  multiTab: boolean;
  darkSidebar: boolean;
  fontFamily: string;
  fontSize: number;
  direction: Direction;
};

// HTML data attributes for theme
export enum HtmlDataAttribute {
  ThemeMode = 'data-theme-mode',
  ColorPalette = 'data-color-palette',
  Direction = 'dir',
}

// Token type definitions

/**
 * Color token structure for semantic and brand colors
 */
export type ColorTokens = {
  lighter: string;
  light: string;
  main: string;
  dark: string;
  darker: string;
  contrast: string;
};

/**
 * Full color scale (50-950)
 */
export type ColorScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
};

/**
 * Semantic color categories
 */
export type SemanticColorCategory = 'success' | 'warning' | 'danger' | 'info';

/**
 * Brand color categories
 */
export type BrandColorCategory = 'primary' | 'secondary' | 'accent';

/**
 * Transaction color categories
 */
export type TransactionColorCategory = 'income' | 'expense' | 'transfer';

/**
 * Text color tokens
 */
export type TextColors = {
  primary: string;
  secondary: string;
  tertiary: string;
  disabled: string;
  inverse: string;
};

/**
 * Background color tokens
 */
export type BackgroundColors = {
  default: string;
  paper: string;
  neutral: string;
  hover: string;
  selected: string;
  disabled: string;
};

/**
 * Border color tokens
 */
export type BorderColors = {
  light: string;
  main: string;
  dark: string;
  focus: string;
};

/**
 * Action color tokens
 */
export type ActionColors = {
  hover: string;
  selected: string;
  focus: string;
  disabled: string;
  disabledBackground: string;
  active: string;
};

/**
 * Complete theme color palette
 */
export type ThemeColors = {
  brand: {
    primary: ColorTokens;
    secondary: ColorTokens;
    accent: ColorTokens;
  };
  semantic: {
    success: ColorTokens;
    warning: ColorTokens;
    danger: ColorTokens;
    info: ColorTokens;
  };
  text: TextColors;
  background: BackgroundColors;
  border: BorderColors;
  action: ActionColors;
};
