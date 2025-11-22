-- Migration: Remove Currency enum and convert to VARCHAR
-- This allows dynamic currency management via CurrencySettings table

-- Step 1: Drop the default constraint that uses the enum
ALTER TABLE "transactions" ALTER COLUMN "currency" DROP DEFAULT;
ALTER TABLE "debts" ALTER COLUMN "currency" DROP DEFAULT;
ALTER TABLE "debt_payments" ALTER COLUMN "currency" DROP DEFAULT;

-- Step 2: Convert currency columns to VARCHAR(3)
ALTER TABLE "transactions" ALTER COLUMN "currency" TYPE VARCHAR(3) USING currency::text;
ALTER TABLE "debts" ALTER COLUMN "currency" TYPE VARCHAR(3) USING currency::text;
ALTER TABLE "debt_payments" ALTER COLUMN "currency" TYPE VARCHAR(3) USING currency::text;

-- Step 3: Re-add defaults using the string values
ALTER TABLE "transactions" ALTER COLUMN "currency" SET DEFAULT 'USD';
ALTER TABLE "debts" ALTER COLUMN "currency" SET DEFAULT 'USD';
ALTER TABLE "debt_payments" ALTER COLUMN "currency" SET DEFAULT 'USD';

-- Step 4: Drop the Currency enum type
DROP TYPE "currency";

-- Step 5: Add check constraints to ensure currency codes are uppercase 3-letter codes
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_currency_format" CHECK (currency ~ '^[A-Z]{3}$');
ALTER TABLE "debts" ADD CONSTRAINT "debts_currency_format" CHECK (currency ~ '^[A-Z]{3}$');
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_currency_format" CHECK (currency ~ '^[A-Z]{3}$');

-- Note: Application-level validation should ensure currency exists in currency_settings table
