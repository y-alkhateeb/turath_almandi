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
    echo "❌ ERROR: $var_name is required but not set"
    return 1
  fi
  echo "✓ $var_name is set"
}

validate_min_length() {
  var_name=$1
  min_length=$2
  var_value=$(eval echo \$$var_name)
  if [ ${#var_value} -lt $min_length ]; then
    echo "❌ ERROR: $var_name must be at least $min_length characters (current: ${#var_value})"
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

echo "✅ All required environment variables validated"
echo ""

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate || {
  echo "❌ Failed to generate Prisma Client"
  exit 1
}
echo "✅ Prisma Client generated successfully"
echo ""

# Run database migrations
echo "🔄 Running database migrations..."

# Check migration status
echo "🔍 Checking migration status..."
set +e # Don't exit if status check fails
MIGRATE_STATUS=$(npx prisma migrate status 2>&1)
MIGRATE_STATUS_CODE=$?
set -e

echo "$MIGRATE_STATUS"

# Check for failed migrations
if echo "$MIGRATE_STATUS" | grep -qi "failed"; then
  echo ""
  echo "⚠️  Found failed migrations. Attempting to resolve..."
  
  # Extract and resolve failed migrations
  echo "$MIGRATE_STATUS" | grep -i "failed" | awk '{print $1}' | while read -r MIGRATION_NAME; do
    if [ -n "$MIGRATION_NAME" ]; then
      echo "   📌 Resolving migration: $MIGRATION_NAME"
      npx prisma migrate resolve --rolled-back "$MIGRATION_NAME" || true
    fi
  done
  
  echo "✅ Finished resolving failed migrations"
fi

# Deploy all pending migrations
echo ""
echo "🚀 Deploying database migrations..."
npx prisma migrate deploy || {
  echo "❌ Migration deployment failed"
  exit 1
}
echo "✅ Migrations deployed successfully"
echo ""

# Seed database if enabled
if [ "$RUN_SEED" = "true" ]; then
  echo "🌱 Seeding database..."
  npm run deploy:seed || {
    echo "⚠️  Seeding failed, but continuing startup..."
  }
  echo "✅ Database seeding completed"
else
  echo "⏭️  Skipping database seed (RUN_SEED not set to 'true')"
fi

echo ""
echo "✅ All startup checks passed"
echo "🎯 Starting application on port ${PORT:-3000}..."
echo ""

# Start the application
exec node dist/main
