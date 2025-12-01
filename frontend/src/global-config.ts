/**
 * Global configuration for the application
 */

// Extend Window interface to include runtime environment
declare global {
  interface Window {
    ENV?: {
      VITE_API_URL?: string;
    };
  }
}

// API configuration
const apiBaseUrl = (() => {
  // In production (Docker), use runtime environment from env-config.js
  if (window.ENV?.VITE_API_URL) {
    return window.ENV.VITE_API_URL;
  }

  // In development, use Vite's build-time env or default to localhost
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }

  // Fallback for local development
  if (import.meta.env.DEV) {
    return 'http://localhost:3000/api/v1';
  }

  // Production without config - fail fast
  throw new Error(
    'VITE_API_URL is not configured. ' +
    'Ensure env-config.js is loaded or VITE_API_URL is set in environment.'
  );
})();

// WebSocket configuration
// Convert HTTP(S) URL to WS(S) URL
const getWebSocketUrl = (): string => {
  const url = import.meta.env.VITE_WS_URL;
  if (url) return url;

  // Derive from API URL if not explicitly set
  return apiBaseUrl.replace(/^http/, 'ws').replace(/\/api\/v1$/, '');
};

const wsUrl = getWebSocketUrl();

// Default route after login
const defaultRoute = '/dashboard';

// Application metadata
const appName = 'تراث المندي';
const appDescription = 'نظام المحاسبة لمطاعم تراث المندي';

// Branding assets - served from frontend public directory
const logoUrl = '/logo.jpg';
const loginBackgroundUrl = '/logo.jpg';
const useFallbackGradient = false;

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
  wsUrl,
  defaultRoute,
  appName,
  appDescription,
  logoUrl,
  loginBackgroundUrl,
  useFallbackGradient,
  storageKeys,
  routerMode,
} as const;

export default GLOBAL_CONFIG;
