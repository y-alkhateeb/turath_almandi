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

// Color channel type (for Tailwind CSS opacity modifiers)
export type ColorChannel = {
  lighter: string;
  light: string;
  default: string;
  dark: string;
  darker: string;
};

export type ColorChannelWithOpacity = {
  lighter: string;
  light: string;
  default: string;
  dark: string;
  darker: string;
  // Opacity channels
  lighterChannel: string;
  lightChannel: string;
  defaultChannel: string;
  darkChannel: string;
  darkerChannel: string;
};
