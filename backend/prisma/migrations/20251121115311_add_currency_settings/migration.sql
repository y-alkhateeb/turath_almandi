-- CreateTable: Currency Settings
-- This migration creates the currency_settings table and seeds IQD as the default currency
-- It also updates all existing records to use IQD as their currency

-- Step 1: Create the currency_settings table
CREATE TABLE "currency_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(3) NOT NULL,
    "name_ar" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100) NOT NULL,
    "symbol" VARCHAR(10) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "currency_settings_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create unique index on code
CREATE UNIQUE INDEX "currency_settings_code_key" ON "currency_settings"("code");

-- Step 3: Create index on is_default for query performance
CREATE INDEX "currency_settings_is_default_idx" ON "currency_settings"("is_default");

-- Step 4: Create unique partial index to ensure only one currency can have is_default=true
CREATE UNIQUE INDEX "currency_settings_single_default_idx" ON "currency_settings"("is_default") WHERE "is_default" = true;

-- Step 5: Seed IQD as the default currency
INSERT INTO "currency_settings" ("id", "code", "name_ar", "name_en", "symbol", "is_default", "created_at", "updated_at")
VALUES (
    gen_random_uuid(),
    'IQD',
    'دينار عراقي',
    'Iraqi Dinar',
    'د.ع',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Step 6: Seed USD as an additional currency option
INSERT INTO "currency_settings" ("id", "code", "name_ar", "name_en", "symbol", "is_default", "created_at", "updated_at")
VALUES (
    gen_random_uuid(),
    'USD',
    'دولار أمريكي',
    'US Dollar',
    '$',
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Step 7: Update all existing transactions to use IQD
UPDATE "transactions"
SET "currency" = 'IQD'::"currency"
WHERE "currency" IS NOT NULL;

-- Step 8: Update all existing debts to use IQD
UPDATE "debts"
SET "currency" = 'IQD'::"currency"
WHERE "currency" IS NOT NULL;

-- Step 9: Update all existing debt payments to use IQD
UPDATE "debt_payments"
SET "currency" = 'IQD'::"currency"
WHERE "currency" IS NOT NULL;
