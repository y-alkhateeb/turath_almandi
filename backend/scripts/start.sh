#!/bin/sh

# تراث المندي - Production Startup Script
# This script runs database migrations, seeding, and starts the application

set -e

echo "🚀 Starting تراث المندي Backend..."

# Display environment info for debugging
echo "📊 Environment Information:"
echo "   NODE_ENV: ${NODE_ENV}"
echo "   PORT: ${PORT}"
if [ -n "$DATABASE_URL" ]; then
  # Mask password in DATABASE_URL for security
  MASKED_URL=$(echo "$DATABASE_URL" | sed -E 's/:([^:@]+)@/:****@/')
  echo "   DATABASE_URL: ${MASKED_URL}"

  # Extract and test hostname
  HOSTNAME=$(echo "$DATABASE_URL" | sed -E 's|postgresql://[^@]+@([^:/]+).*|\1|')
  echo "   Database Host: ${HOSTNAME}"

  # Test DNS resolution
  echo "🔍 Testing DNS resolution..."
  if nslookup "$HOSTNAME" >/dev/null 2>&1; then
    echo "   ✅ DNS resolves successfully"
  else
    echo "   ⚠️  DNS resolution failed for: ${HOSTNAME}"
    echo "   💡 This might be normal for Render internal hostnames"
  fi
else
  echo "   ⚠️  DATABASE_URL: NOT SET!"
  echo "   ❌ ERROR: DATABASE_URL environment variable is required"
  exit 1
fi

# Test database connection once - show actual error if it fails
echo "🔍 Testing database connection..."
echo ""
if echo "SELECT 1;" | npx prisma db execute --stdin 2>&1; then
  echo ""
  echo "✅ Database connection successful!"
else
  echo ""
  echo "❌ Database connection failed!"
  echo "🔍 Check Render Dashboard:"
  echo "   1. Database service status should be 'Available'"
  echo "   2. Database and backend must be in same region"
  echo "   3. DATABASE_URL must be correct"
  exit 1
fi

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Run database migrations with retry logic
echo "🔄 Running database migrations..."
max_retries=3
retry_count=0

while [ $retry_count -lt $max_retries ]; do
  if npx prisma migrate deploy; then
    echo "✅ Migrations completed successfully"
    break
  else
    retry_count=$((retry_count + 1))
    if [ $retry_count -lt $max_retries ]; then
      echo "⚠️  Migration attempt $retry_count failed, retrying in 5s..."
      sleep 5
    else
      echo "❌ Migrations failed after $max_retries attempts"
      exit 1
    fi
  fi
done

# Check if we should run seed (controlled by environment variable)
if [ "$RUN_SEED" = "true" ]; then
  echo "🌱 Seeding database..."
  npm run deploy:seed
else
  echo "⏭️  Skipping database seed (set RUN_SEED=true to enable)"
fi

# Start the application
echo "✅ Starting application..."
exec node dist/main
