/**
 * useAppSettings Hook
 * Manages application-wide settings like app name and icon
 *
 * Features:
 * - Fetches app settings from the backend
 * - Updates document title dynamically
 * - Updates favicon dynamically
 * - Provides settings to components via context
 */

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAppSettings } from '@/api/services/settingsService';

const DEFAULT_APP_NAME = 'تراث المندي';

export function useAppSettings() {
  // Fetch app settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['appSettings'],
    queryFn: getAppSettings,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours (formerly cacheTime)
    retry: 1,
  });

  // Update document title when app name changes
  useEffect(() => {
    const appName = settings?.appName || DEFAULT_APP_NAME;
    document.title = appName;
  }, [settings?.appName]);

  // Update favicon when app icon URL changes
  useEffect(() => {
    if (!settings?.appIconUrl) return;

    // Find existing favicon link or create new one
    let faviconLink = document.querySelector<HTMLLinkElement>("link[rel*='icon']");

    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      document.head.appendChild(faviconLink);
    }

    faviconLink.href = settings.appIconUrl;
  }, [settings?.appIconUrl]);

  return {
    settings,
    isLoading,
    appName: settings?.appName || DEFAULT_APP_NAME,
    appIconUrl: settings?.appIconUrl || null,
    loginBackgroundUrl: settings?.loginBackgroundUrl || null,
  };
}
