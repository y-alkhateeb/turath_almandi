import { useEffect, type ReactNode } from 'react';
import { useSettingActions, useSettings } from '@/store/settingStore';
import { HtmlDataAttribute, ThemeMode } from './type';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const settings = useSettings();
  const { setSettings } = useSettingActions();

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

  return <>{children}</>;
}
