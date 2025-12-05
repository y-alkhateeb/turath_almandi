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
if ! npx prisma migrate deploy; then
  echo "⚠️  Standard migration deployment failed, attempting manual migration..."
  
  # Try to apply is_internal_consumption migration manually if it exists
  if [ -f "prisma/migrations/20251205200000_add_is_internal_consumption_to_inventory_item/migration.sql" ]; then
    echo "📦 Applying is_internal_consumption migration manually..."
    if command -v psql > /dev/null 2>&1; then
      psql "$DATABASE_URL" -f "prisma/migrations/20251205200000_add_is_internal_consumption_to_inventory_item/migration.sql" || {
        echo "❌ Manual migration via psql failed"
        exit 1
      }
    elif command -v docker > /dev/null 2>&1 && docker ps | grep -q turath-almandi-db-prod; then
      # Try via Docker
      DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p' || echo "turath_almandi")
      docker exec -i turath-almandi-db-prod psql -U postgres -d "$DB_NAME" < "prisma/migrations/20251205200000_add_is_internal_consumption_to_inventory_item/migration.sql" || {
        echo "❌ Manual migration via Docker failed"
        exit 1
      }
    else
      echo "❌ Cannot apply migration automatically. Please apply manually:"
      echo "   Run: psql \$DATABASE_URL -f prisma/migrations/20251205200000_add_is_internal_consumption_to_inventory_item/migration.sql"
      exit 1
    fi
    echo "✅ Manual migration applied successfully"
  else
    echo "❌ Migration deployment failed and migration file not found"
    exit 1
  fi
fi
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
