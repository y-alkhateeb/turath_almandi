-- Update Currency enum to only include USD and IQD
-- This removes EUR, SAR, and AED from the Currency enum

-- WARNING: This migration will fail if any records use EUR, SAR, or AED currencies
-- Make sure to update all existing records to use USD or IQD before running this migration

-- Step 1: Create new enum type with only USD and IQD
CREATE TYPE "currency_new" AS ENUM ('USD', 'IQD');

-- Step 2: Update all tables using currency to use the new type
-- Transactions table
ALTER TABLE "transactions"
  ALTER COLUMN "currency" DROP DEFAULT,
  ALTER COLUMN "currency" TYPE "currency_new" USING (currency::text::"currency_new"),
  ALTER COLUMN "currency" SET DEFAULT 'USD'::"currency_new";

-- Debts table
ALTER TABLE "debts"
  ALTER COLUMN "currency" DROP DEFAULT,
  ALTER COLUMN "currency" TYPE "currency_new" USING (currency::text::"currency_new"),
  ALTER COLUMN "currency" SET DEFAULT 'USD'::"currency_new";

-- Debt Payments table
ALTER TABLE "debt_payments"
  ALTER COLUMN "currency" DROP DEFAULT,
  ALTER COLUMN "currency" TYPE "currency_new" USING (currency::text::"currency_new"),
  ALTER COLUMN "currency" SET DEFAULT 'USD'::"currency_new";

-- Step 3: Drop old enum type
DROP TYPE "currency";

-- Step 4: Rename new enum type to original name
ALTER TYPE "currency_new" RENAME TO "currency";
