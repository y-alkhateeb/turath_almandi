#!/bin/sh

# تراث المندي - Production Startup Script
# This script runs database migrations, seeding, and starts the application

set -e

echo "🚀 Starting تراث المندي Backend..."

# Function to wait for database to be ready
wait_for_db() {
  echo "⏳ Waiting for database to be ready..."
  local max_attempts=30
  local attempt=1
  local wait_time=2

  while [ $attempt -le $max_attempts ]; do
    echo "🔍 Attempt $attempt/$max_attempts: Checking database connection..."

    if npx prisma db execute --stdin <<EOF 2>/dev/null
SELECT 1;
EOF
    then
      echo "✅ Database is ready!"
      return 0
    fi

    echo "⏸️  Database not ready yet, waiting ${wait_time}s..."
    sleep $wait_time
    attempt=$((attempt + 1))
  done

  echo "❌ Database failed to become ready after $max_attempts attempts"
  return 1
}

# Wait for database to be ready
wait_for_db

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
