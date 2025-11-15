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
else
  echo "   ⚠️  DATABASE_URL: NOT SET!"
  echo "   ❌ ERROR: DATABASE_URL environment variable is required"
  exit 1
fi

# Function to wait for database to be ready
wait_for_db() {
  echo "⏳ Waiting for database to be ready..."
  echo "   This may take up to 2 minutes on first deployment..."
  local max_attempts=60  # Increased from 30 to 60
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

    # Show helpful message at certain milestones
    if [ $attempt -eq 15 ]; then
      echo "ℹ️  Still waiting... Database might still be provisioning"
    elif [ $attempt -eq 30 ]; then
      echo "⚠️  Taking longer than expected. Checking connection..."
    elif [ $attempt -eq 45 ]; then
      echo "⚠️  If this persists, check Render Dashboard for database status"
    fi
  done

  echo "❌ Database failed to become ready after $max_attempts attempts ($(($max_attempts * $wait_time)) seconds)"
  echo "🔍 Troubleshooting steps:"
  echo "   1. Verify database service is 'Available' in Render Dashboard"
  echo "   2. Check DATABASE_URL is set correctly in backend environment variables"
  echo "   3. Ensure database and backend are in the same region"
  echo "   4. Try using the Internal Database URL (not External)"
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
