-- Migration: Remove currency columns from all tables
-- Currency is now ONLY managed via CurrencySettings table
-- Frontend will fetch default currency and display it next to amounts
-- Database only stores numeric amounts without currency information

-- Step 1: Drop currency columns from all tables
ALTER TABLE "transactions" DROP COLUMN "currency";
ALTER TABLE "debts" DROP COLUMN "currency";
ALTER TABLE "debt_payments" DROP COLUMN "currency";

-- Step 2: Drop the Currency enum (no longer needed)
DROP TYPE "currency";

-- Note: CurrencySettings table remains and is the ONLY source of currency data
-- Admin manages currencies through CurrencySettings
-- Frontend fetches default currency and displays symbol next to amounts
