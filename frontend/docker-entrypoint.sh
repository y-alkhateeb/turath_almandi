#!/bin/sh
set -e

echo "=== Frontend Environment Validation ==="

# Validate required environment variables
if [ -z "$VITE_API_URL" ]; then
  echo "ERROR: VITE_API_URL environment variable is required"
  echo "Example: VITE_API_URL=https://your-backend-url.com/api/v1"
  exit 1
fi

# Validate URL format
if ! echo "$VITE_API_URL" | grep -qE '^https?://'; then
  echo "ERROR: VITE_API_URL must be a valid URL starting with http:// or https://"
  echo "Provided: $VITE_API_URL"
  exit 1
fi

# Validate /api/v1 suffix
if ! echo "$VITE_API_URL" | grep -qE '/api/v1$'; then
  echo "ERROR: VITE_API_URL must end with /api/v1"
  echo "Provided: $VITE_API_URL"
  echo "Expected format: https://your-backend.com/api/v1"
  exit 1
fi

echo "✓ VITE_API_URL: $VITE_API_URL"

# Inject environment variables into config
echo "Injecting runtime configuration..."
envsubst '${VITE_API_URL}' < /usr/share/nginx/html/env-config.js.template > /usr/share/nginx/html/env-config.js

# Remove template file
rm /usr/share/nginx/html/env-config.js.template

echo "✓ Environment configuration completed"
echo "=== Starting nginx ==="

# Execute the CMD
exec "$@"
