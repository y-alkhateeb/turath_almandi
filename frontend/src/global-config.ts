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

// Branding assets
const loginBackgroundImage = '/images/login-bg.jpg'; // Admin can change this from dashboard
const useFallbackGradient = true; // Set to false once image is uploaded

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
  loginBackgroundImage,
  useFallbackGradient,
  storageKeys,
  routerMode,
} as const;

export default GLOBAL_CONFIG;
