import { useSettings, useSettingActions } from '@/store/settingStore';
import { ThemeMode, ThemeColorPresets } from '../type';

export function useTheme() {
  const settings = useSettings();
  const { setSettings } = useSettingActions();

  const setThemeMode = (mode: ThemeMode) => {
    setSettings({ themeMode: mode });
  };

  const setColorPreset = (preset: ThemeColorPresets) => {
    setSettings({ themeColorPresets: preset });
  };

  const toggleTheme = () => {
    setThemeMode(settings.themeMode === ThemeMode.Light ? ThemeMode.Dark : ThemeMode.Light);
  };

  const setDirection = (direction: 'rtl' | 'ltr') => {
    setSettings({ direction });
  };

  const toggleDirection = () => {
    setDirection(settings.direction === 'rtl' ? 'ltr' : 'rtl');
  };

  return {
    themeMode: settings.themeMode,
    colorPreset: settings.themeColorPresets,
    direction: settings.direction,
    fontSize: settings.fontSize,
    fontFamily: settings.fontFamily,
    settings,
    setThemeMode,
    setColorPreset,
    toggleTheme,
    setDirection,
    toggleDirection,
    setSettings,
  };
}
