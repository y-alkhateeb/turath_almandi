/**
 * Use Theme Tokens Hook
 *
 * A custom React hook that provides comprehensive access to theme color tokens.
 * This hook integrates with the Zustand settings store to provide dynamic
 * theme tokens based on the current theme mode (light/dark).
 *
 * @example
 * ```tsx
 * import { useThemeTokens } from '@/theme/hooks/use-theme-tokens';
 *
 * function MyComponent() {
 *   const { isDarkMode, brand, semantic, transaction } = useThemeTokens();
 *
 *   return (
 *     <div style={{ backgroundColor: brand.primary.main }}>
 *       <span style={{ color: semantic.success.main }}>Success!</span>
 *       <span style={{ color: transaction.income.main }}>+$100</span>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Using with specific variants
 * function ThemedButton() {
 *   const tokens = useThemeTokens();
 *
 *   return (
 *     <button
 *       style={{
 *         backgroundColor: tokens.brand.primary.main,
 *         color: tokens.brand.primary.contrast,
 *       }}
 *       onMouseEnter={(e) => {
 *         e.currentTarget.style.backgroundColor = tokens.brand.primary.dark;
 *       }}
 *     >
 *       Themed Button
 *     </button>
 *   );
 * }
 * ```
 */

import { useMemo } from 'react';
import { useSettings } from '@/store/settingStore';
import { ThemeMode } from '@/theme/type';
import {
  getBrandColors,
  getSemanticColors,
  getTransactionColors,
  type BrandColors,
  type SemanticColors,
  type TransactionColors,
} from '@/theme/tokens/colors';

/**
 * Brand color tokens with light/dark mode variants
 */
export type ThemeBrandTokens = BrandColors;

/**
 * Semantic color tokens with light/dark mode variants
 * Includes success, warning, danger, info, text, background, border, and action colors
 */
export type ThemeSemanticTokens = SemanticColors;

/**
 * Transaction-specific color tokens for financial operations
 */
export type ThemeTransactionTokens = TransactionColors;

/**
 * Complete theme tokens object returned by the hook
 */
export interface ThemeTokens {
  /**
   * Current theme mode indicator
   */
  isDarkMode: boolean;

  /**
   * Brand color tokens (primary, secondary, accent)
   * - primary: Gold color from brand palette
   * - secondary: Green color from brand palette
   * - accent: Terracotta color from brand palette
   *
   * Each contains: lighter, light, main, dark, darker, contrast
   */
  brand: ThemeBrandTokens;

  /**
   * Semantic color tokens for UI states and feedback
   * - success: Positive feedback and confirmations
   * - warning: Cautionary messages and attention
   * - danger: Errors and destructive actions
   * - info: Informational messages
   * - text: Typography colors (primary, secondary, tertiary, disabled, inverse)
   * - background: Surface colors (default, paper, neutral, hover, selected, disabled)
   * - border: Border and divider colors (light, main, dark, focus)
   * - action: Interactive element states (hover, selected, focus, disabled, active)
   */
  semantic: ThemeSemanticTokens;

  /**
   * Transaction-specific color tokens
   * - income: Positive financial transactions
   * - expense: Negative financial transactions
   * - transfer: Neutral transfers between accounts
   *
   * Each contains: main, light, lighter, contrast
   */
  transaction: ThemeTransactionTokens;
}

/**
 * Custom hook that provides access to theme color tokens
 *
 * This hook connects to the Zustand settings store and returns
 * the appropriate color tokens based on the current theme mode.
 * The tokens are memoized to prevent unnecessary recalculations.
 *
 * @returns {ThemeTokens} Object containing isDarkMode flag and color token collections
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { brand, semantic, transaction, isDarkMode } = useThemeTokens();
 *
 *   return (
 *     <div>
 *       <h1 style={{ color: brand.primary.main }}>Dashboard</h1>
 *       {isDarkMode && <span>Dark mode is enabled</span>}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Using semantic colors for status indicators
 * function StatusBadge({ status }: { status: 'success' | 'warning' | 'danger' }) {
 *   const { semantic } = useThemeTokens();
 *
 *   return (
 *     <span
 *       style={{
 *         backgroundColor: semantic[status].lighter,
 *         color: semantic[status].dark,
 *         padding: '4px 8px',
 *         borderRadius: '4px',
 *       }}
 *     >
 *       {status}
 *     </span>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Using transaction colors for financial displays
 * function TransactionAmount({ type, amount }: { type: 'income' | 'expense', amount: number }) {
 *   const { transaction } = useThemeTokens();
 *
 *   return (
 *     <span style={{ color: transaction[type].main }}>
 *       {type === 'income' ? '+' : '-'}${amount}
 *     </span>
 *   );
 * }
 * ```
 */
export function useThemeTokens(): ThemeTokens {
  const settings = useSettings();
  const isDarkMode = settings.themeMode === ThemeMode.Dark;
  const themeMode: 'light' | 'dark' = isDarkMode ? 'dark' : 'light';

  // Memoize token collections to prevent unnecessary recalculations
  const tokens = useMemo<ThemeTokens>(
    () => ({
      isDarkMode,
      brand: getBrandColors(themeMode),
      semantic: getSemanticColors(themeMode),
      transaction: getTransactionColors(themeMode),
    }),
    [isDarkMode, themeMode]
  );

  return tokens;
}

/**
 * Type guard to check if a color category is valid for brand colors
 */
export function isBrandColor(
  color: string
): color is keyof ThemeBrandTokens {
  return ['primary', 'secondary', 'accent'].includes(color);
}

/**
 * Type guard to check if a color category is valid for semantic colors
 */
export function isSemanticColor(
  color: string
): color is 'success' | 'warning' | 'danger' | 'info' {
  return ['success', 'warning', 'danger', 'info'].includes(color);
}

/**
 * Type guard to check if a color category is valid for transaction colors
 */
export function isTransactionColor(
  color: string
): color is keyof ThemeTransactionTokens {
  return ['income', 'expense', 'transfer'].includes(color);
}
