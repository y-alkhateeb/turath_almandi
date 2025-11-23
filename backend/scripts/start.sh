#!/bin/sh

# تراث المندي - Production Startup Script
# This script runs database migrations, seeding, and starts the application

set -e

echo "🚀 Starting تراث المندي Backend..."

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Clean up any failed migrations
echo "🧹 Cleaning up failed migrations..."
node scripts/clean-failed-migrations.js

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
