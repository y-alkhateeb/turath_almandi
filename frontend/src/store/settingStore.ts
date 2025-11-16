/**
 * Settings Store
 * Manages theme, layout, and UI settings using Zustand
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ThemeMode, ThemeColorPresets, ThemeLayout, type SettingsType } from '@/theme/type';

// Default settings
const defaultSettings: SettingsType = {
  themeColorPresets: ThemeColorPresets.Default,
  themeMode: ThemeMode.Light,
  themeLayout: ThemeLayout.Vertical,
  themeStretch: false,
  breadCrumb: true,
  multiTab: false,
  darkSidebar: false,
  fontFamily: "'Cairo', 'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  fontSize: 16,
  direction: 'rtl',
};

type SettingStore = {
  settings: SettingsType;
  actions: {
    setSettings: (settings: Partial<SettingsType>) => void;
    resetSettings: () => void;
  };
};

const useSettingStore = create<SettingStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      actions: {
        setSettings: (newSettings) =>
          set((state) => ({
            settings: { ...state.settings, ...newSettings },
          })),
        resetSettings: () =>
          set({
            settings: defaultSettings,
          }),
      },
    }),
    {
      name: 'settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);

// Selectors
export const useSettings = () => useSettingStore((state) => state.settings);
export const useSettingActions = () => useSettingStore((state) => state.actions);

export default useSettingStore;
