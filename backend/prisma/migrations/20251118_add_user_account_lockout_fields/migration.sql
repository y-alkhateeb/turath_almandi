-- Add account lockout fields to users table
-- Enables account-level lockout after failed login attempts

-- Add failed_login_attempts column (default 0)
ALTER TABLE "users" ADD COLUMN "failed_login_attempts" INTEGER NOT NULL DEFAULT 0;

-- Add locked_until column (nullable timestamp)
ALTER TABLE "users" ADD COLUMN "locked_until" TIMESTAMPTZ;

-- Add index on locked_until for efficient queries
CREATE INDEX "users_locked_until_idx" ON "users"("locked_until");

-- Add comment to document the columns
COMMENT ON COLUMN "users"."failed_login_attempts" IS 'Number of consecutive failed login attempts';
COMMENT ON COLUMN "users"."locked_until" IS 'Account locked until this timestamp (null if not locked)';
