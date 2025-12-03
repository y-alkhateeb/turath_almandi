/**
 * Color tokens for the theme system
 * Based on the Turath Almandi design system
 */

import type { ColorChannel } from '../type';

// Common colors
export const commonColors = {
  white: '#FFFFFF',
  black: '#09090B',
};

// Brand color palette (Gold - from Logo)
const brandColors: ColorChannel = {
  lighter: '#efe7db', // 100
  light: '#c1a270',   // 400
  default: '#b28b4c', // 500
  dark: '#6a532e',    // 700
  darker: '#231b0f',  // 900
};

// Primary color palette (Gold - Matching Brand)
const primaryColors: ColorChannel = {
  lighter: '#efe7db',
  light: '#c1a270',
  default: '#b28b4c',
  dark: '#6a532e',
  darker: '#231b0f',
};

// Secondary color palette (Green - from Logo)
// Adding this to be available even if not originally in the file, 
// though we might need to export it or map it to an existing category.
// For now, let's update the "brand" concept to be Gold.

// Success color palette (Green)
// We can keep the standard green or align it with brand green.
// Let's keep standard green for semantic meaning, but maybe slightly warmer?
// For now, keeping as is to avoid confusion with "Brand Green".
const successColors: ColorChannel = {
  lighter: '#bbf7d0',
  light: '#4ade80',
  default: '#22c55e',
  dark: '#16a34a',
  darker: '#14532d',
};

// Warning color palette (Amber/Orange)
const warningColors: ColorChannel = {
  lighter: '#fde68a',
  light: '#fbbf24',
  default: '#f59e0b',
  dark: '#d97706',
  darker: '#78350f',
};

// Error/Danger color palette (Red)
const errorColors: ColorChannel = {
  lighter: '#fecaca',
  light: '#f87171',
  default: '#ef4444',
  dark: '#dc2626',
  darker: '#7f1d1d',
};

// Info color palette (Blue)
const infoColors: ColorChannel = {
  lighter: '#bae6fd',
  light: '#38bdf8',
  default: '#0ea5e9',
  dark: '#0369a1',
  darker: '#0c4a6e',
};

// Gray color palette
export const grayColors = {
  50: '#fafaf9',
  100: '#f5f5f4',
  200: '#e7e5e4',
  300: '#d6d3d1',
  400: '#a8a29e',
  500: '#78716c',
  600: '#57534e',
  700: '#44403c',
  800: '#292524',
  900: '#1c1917',
};

// Preset colors
export const presetsColors = {
  default: primaryColors,
  brand: brandColors,
  primary: primaryColors,
  success: successColors,
};

// Palette colors
export const paletteColors = {
  primary: primaryColors,
  brand: brandColors,
  success: successColors,
  warning: warningColors,
  error: errorColors,
  info: infoColors,
  gray: grayColors,
};

// Action colors
export const actionColors = {
  hover: 'rgba(0, 0, 0, 0.04)',
  selected: 'rgba(0, 0, 0, 0.08)',
  focus: 'rgba(0, 0, 0, 0.12)',
  disabled: 'rgba(0, 0, 0, 0.26)',
  disabledBackground: 'rgba(0, 0, 0, 0.12)',
  active: 'rgba(0, 0, 0, 0.54)',
};

// Light mode color tokens
export const lightColorTokens = {
  palette: paletteColors,
  common: commonColors,
  action: actionColors,
  text: {
    primary: grayColors[800],
    secondary: grayColors[600],
    disabled: grayColors[500],
  },
  background: {
    default: commonColors.white,
    paper: commonColors.white,
    neutral: grayColors[200],
  },
  divider: grayColors[200],
};

// Dark mode color tokens
export const darkColorTokens = {
  palette: paletteColors,
  common: commonColors,
  action: {
    hover: 'rgba(255, 255, 255, 0.08)',
    selected: 'rgba(255, 255, 255, 0.16)',
    focus: 'rgba(255, 255, 255, 0.12)',
    disabled: 'rgba(255, 255, 255, 0.3)',
    disabledBackground: 'rgba(255, 255, 255, 0.12)',
    active: 'rgba(255, 255, 255, 0.54)',
  },
  text: {
    primary: grayColors[100],
    secondary: grayColors[300],
    disabled: grayColors[500],
  },
  background: {
    default: '#0a0a0a',
    paper: grayColors[900],
    neutral: grayColors[800],
  },
  divider: grayColors[800],
};

// Helper function to get theme tokens based on mode
export const getThemeTokens = (mode: 'light' | 'dark') => {
  return mode === 'light' ? lightColorTokens : darkColorTokens;
};

// Helper function to convert hex to rgb
export const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0, 0, 0';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
};

// Helper function to add color channels for opacity support
export const addColorChannels = (colors: ColorChannel) => {
  return {
    lighter: colors.lighter,
    light: colors.light,
    default: colors.default,
    dark: colors.dark,
    darker: colors.darker,
    lighterChannel: hexToRgb(colors.lighter),
    lightChannel: hexToRgb(colors.light),
    defaultChannel: hexToRgb(colors.default),
    darkChannel: hexToRgb(colors.dark),
    darkerChannel: hexToRgb(colors.darker),
  };
};
