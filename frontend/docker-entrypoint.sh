#!/bin/sh
set -e

# Validate required environment variables
if [ -z "$VITE_API_URL" ]; then
  echo "ERROR: VITE_API_URL environment variable is required"
  echo "Example: VITE_API_URL=https://your-backend-url.com/api/v1"
  exit 1
fi

echo "Injecting runtime environment variables..."
echo "VITE_API_URL=${VITE_API_URL}"

# Substitute environment variables in config template
envsubst '${VITE_API_URL}' < /usr/share/nginx/html/env-config.js.template > /usr/share/nginx/html/env-config.js

# Remove template file
rm /usr/share/nginx/html/env-config.js.template

echo "Environment configuration completed successfully"

# Execute the CMD
exec "$@"
