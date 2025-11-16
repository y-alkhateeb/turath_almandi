/**
 * Global configuration for the application
 */

// API configuration
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Default route after login
const defaultRoute = '/dashboard';

// Application metadata
const appName = 'تراث المندي';
const appDescription = 'نظام المحاسبة لمطاعم تراث المندي';

// Storage keys
const storageKeys = {
  auth: 'auth-storage',
  settings: 'settings',
  theme: 'theme-mode',
} as const;

// Router mode: 'frontend' | 'backend'
const routerMode = 'frontend';

const GLOBAL_CONFIG = {
  apiBaseUrl,
  defaultRoute,
  appName,
  appDescription,
  storageKeys,
  routerMode,
} as const;

export default GLOBAL_CONFIG;
