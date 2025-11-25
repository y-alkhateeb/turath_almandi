// This is a placeholder for development/build time
// In production (Docker), this file will be replaced by docker-entrypoint.sh
// with runtime environment variables
window.ENV = {
  VITE_API_URL: import.meta?.env?.VITE_API_URL || 'http://localhost:3000/api/v1',
};
