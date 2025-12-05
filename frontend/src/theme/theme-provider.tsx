import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useSettingActions, useSettings } from '@/store/settingStore';
import { HtmlDataAttribute, ThemeMode } from './type';
import {
  getBrandColors,
  getSemanticColors,
  getTransactionColors,
  type BrandColors,
  type SemanticColors,
  type TransactionColors,
} from '@/theme/tokens/colors';

/**
 * Theme tokens available through React Context
 */
export interface ThemeTokenContext {
  /**
   * Current theme mode indicator
   */
  isDarkMode: boolean;

  /**
   * Brand color tokens (primary, secondary, accent)
   * Each contains: lighter, light, main, dark, darker, contrast
   */
  brand: BrandColors;

  /**
   * Semantic color tokens for UI states and feedback
   * Includes: success, warning, danger, info, text, background, border, action
   */
  semantic: SemanticColors;

  /**
   * Transaction-specific color tokens
   * Includes: income, expense, transfer
   */
  transaction: TransactionColors;
}

/**
 * React Context for theme tokens
 * Provides access to theme colors throughout the application
 */
const ThemeTokensContext = createContext<ThemeTokenContext | undefined>(undefined);

/**
 * Hook to access theme tokens from React Context
 *
 * @throws {Error} If used outside of ThemeProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { brand, semantic, isDarkMode } = useThemeContext();
 *
 *   return (
 *     <div style={{ backgroundColor: brand.primary.main }}>
 *       {isDarkMode ? 'Dark Mode' : 'Light Mode'}
 *     </div>
 *   );
 * }
 * ```
 */
export function useThemeContext(): ThemeTokenContext {
  const context = useContext(ThemeTokensContext);

  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }

  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const settings = useSettings();
  const { setSettings } = useSettingActions();

  // Compute theme tokens based on current theme mode
  const isDarkMode = settings.themeMode === ThemeMode.Dark;

  // Memoize theme tokens to prevent unnecessary recalculations
  // Note: Color functions read directly from CSS variables,
  // so they automatically return the correct colors for the current theme
  const themeTokens = useMemo<ThemeTokenContext>(
    () => ({
      isDarkMode,
      brand: getBrandColors(),
      semantic: getSemanticColors(),
      transaction: getTransactionColors(),
    }),
    [isDarkMode] // Re-compute when theme changes to read updated CSS values
  );

  // Apply theme mode to HTML element with class-based dark mode
  useEffect(() => {
    const root = document.documentElement;

    // Remove both classes first
    root.classList.remove('light', 'dark');

    // Add the appropriate class based on theme mode
    if (settings.themeMode === ThemeMode.Dark) {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }

    // Also set data attribute for backward compatibility
    root.setAttribute(HtmlDataAttribute.ThemeMode, settings.themeMode);
  }, [settings.themeMode]);

  // Apply color preset to HTML element
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute(HtmlDataAttribute.ColorPalette, settings.themeColorPresets);
  }, [settings.themeColorPresets]);

  // Apply direction (RTL/LTR)
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute(HtmlDataAttribute.Direction, settings.direction);
  }, [settings.direction]);

  // Apply font settings
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.style.fontSize = `${settings.fontSize}px`;
    body.style.fontFamily = settings.fontFamily;
  }, [settings.fontSize, settings.fontFamily]);

  // Initialize theme from system preference on first load
  useEffect(() => {
    if (!localStorage.getItem('settings')) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        setSettings({ themeMode: ThemeMode.Dark });
      }
    }
  }, [setSettings]);

  return (
    <ThemeTokensContext.Provider value={themeTokens}>
      {children}
    </ThemeTokensContext.Provider>
  );
}
