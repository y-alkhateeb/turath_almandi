-- Migration: Add selling_price to inventory_items and transaction_id to employee_advances
-- Date: 2024-11-28

-- Step 1: Add selling_price column to inventory_items table
-- سعر البيع - اختياري
ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "selling_price" DECIMAL(15, 2);

-- Step 2: Add transaction_id column to employee_advances table
-- ربط السلفة بمعاملة المصروف
ALTER TABLE "employee_advances" ADD COLUMN IF NOT EXISTS "transaction_id" UUID;

-- Step 3: Create unique index on transaction_id (since each advance links to one transaction)
CREATE UNIQUE INDEX IF NOT EXISTS "employee_advances_transaction_id_key" ON "employee_advances"("transaction_id");

-- Step 4: Add foreign key constraint for transaction_id
-- Using DO block to check if constraint exists before adding
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'employee_advances_transaction_id_fkey'
    ) THEN
        ALTER TABLE "employee_advances"
        ADD CONSTRAINT "employee_advances_transaction_id_fkey"
        FOREIGN KEY ("transaction_id")
        REFERENCES "transactions"("id")
        ON DELETE SET NULL
        ON UPDATE CASCADE;
    END IF;
END $$;
