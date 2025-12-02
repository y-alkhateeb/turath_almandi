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

# Try to resolve any failed migrations before deploying
# This handles the case where a migration failed previously and needs to be re-applied
MIGRATION_NAME="20251130141243_make_branch_id_nullable_in_payables_receivables"
echo "Checking for failed migrations..."

# Check if there are failed migrations (suppress errors to avoid script exit)
set +e
MIGRATE_STATUS=$(npx prisma migrate status 2>&1)
HAS_FAILED=$(echo "$MIGRATE_STATUS" | grep -i "failed" || true)
set -e

if [ -n "$HAS_FAILED" ]; then
  echo "⚠️  Found failed migrations. Attempting to resolve..."
  echo "Resolving failed migration: $MIGRATION_NAME"
  # Mark the migration as rolled back so it can be re-applied with the fixed SQL
  set +e
  npx prisma migrate resolve --rolled-back "$MIGRATION_NAME" 2>&1
  RESOLVE_EXIT=$?
  set -e
  if [ $RESOLVE_EXIT -ne 0 ]; then
    echo "⚠️  Note: Migration resolution returned non-zero exit code."
    echo "This may be normal if the migration is not in a failed state."
    echo "Continuing with migration deploy..."
  else
    echo "✓ Migration marked as rolled back. It will be re-applied with fixed SQL."
  fi
fi

# Deploy migrations (this will re-apply the fixed migration if it was rolled back)
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
