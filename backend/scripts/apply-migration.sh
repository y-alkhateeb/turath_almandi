#!/bin/sh

# Script to manually apply is_internal_consumption migration
# This can be run directly on production database if needed

set -e

echo "🔄 Applying is_internal_consumption migration manually..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Extract connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_URL="$DATABASE_URL"

echo "📦 Applying migration SQL..."

# Apply migration using psql if available, or via Prisma
if command -v psql > /dev/null 2>&1; then
    echo "Using psql to apply migration..."
    psql "$DB_URL" -f scripts/apply-migration-manual.sql
elif command -v docker > /dev/null 2>&1; then
    # Try to run via Docker if psql is not available
    echo "Using Docker to apply migration..."
    # Extract database name from URL for docker exec
    DB_NAME=$(echo "$DB_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    if [ -z "$DB_NAME" ]; then
        DB_NAME="turath_almandi"
    fi
    docker exec -i turath-almandi-db-prod psql -U postgres -d "$DB_NAME" < scripts/apply-migration-manual.sql || {
        echo "⚠️  Docker method failed, trying Prisma..."
        npx prisma db execute --file scripts/apply-migration-manual.sql --schema prisma/schema.prisma
    }
else
    echo "Using Prisma to apply migration..."
    npx prisma db execute --file scripts/apply-migration-manual.sql --schema prisma/schema.prisma
fi

echo "✅ Migration applied successfully!"
echo ""
echo "🔄 Regenerating Prisma Client..."
npx prisma generate

echo "✅ Done!"
