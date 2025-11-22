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

// Branding assets
const loginBackgroundImage =
  'https://scontent-ham3-1.xx.fbcdn.net/v/t39.30808-6/490910684_606105959129344_589045621789059215_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=XyunuxQxn-4Q7kNvwHHmV0s&_nc_oc=Admc3MkNuTk7L14zxbrvoEmFr28NelBAfDaY8lmeuuAVV8rvVvrU8EIlOzijUSC_0OA&_nc_zt=23&_nc_ht=scontent-ham3-1.xx&_nc_gid=vzZ1ZuF2EPOludLIPQkBRQ&oh=00_AfiWqkTMuSX7YW3p68dAjm9PlyqHajlah6LodsUALpgPfQ&oe=691FA85E'; // Admin can change this from dashboard
const useFallbackGradient = false; // Set to false once image is uploaded

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
  loginBackgroundImage,
  useFallbackGradient,
  storageKeys,
  routerMode,
} as const;

export default GLOBAL_CONFIG;
