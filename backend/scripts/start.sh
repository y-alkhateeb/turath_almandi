#!/bin/sh

# تراث المندي - Production Startup Script
# This script runs database migrations, seeding, and starts the application

set -e

echo "🚀 Starting تراث المندي Backend..."
echo ""
echo "=== Backend Environment Validation ==="

# Validate required environment variables
validate_required() {
  var_name=$1
  var_value=$(eval echo \$$var_name)
  if [ -z "$var_value" ]; then
    echo "ERROR: $var_name is required but not set"
    return 1
  fi
  echo "✓ $var_name is set"
}

validate_min_length() {
  var_name=$1
  min_length=$2
  var_value=$(eval echo \$$var_name)
  if [ ${#var_value} -lt $min_length ]; then
    echo "ERROR: $var_name must be at least $min_length characters (current: ${#var_value})"
    return 1
  fi
}

# Check required variables
validate_required "DATABASE_URL" || exit 1
validate_required "JWT_SECRET" || exit 1
validate_required "JWT_REFRESH_SECRET" || exit 1
validate_required "FRONTEND_URL" || exit 1

# Validate JWT secrets length (security)
validate_min_length "JWT_SECRET" 32 || exit 1
validate_min_length "JWT_REFRESH_SECRET" 32 || exit 1

echo "✓ All required environment variables validated"
echo ""

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Seed database if enabled
if [ "$RUN_SEED" = "true" ]; then
  echo "🌱 Seeding database..."
  npm run deploy:seed
else
  echo "⏭️  Skipping database seed"
fi

# Start the application
echo "✅ Starting application..."
exec node dist/main
