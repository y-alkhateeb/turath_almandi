-- Add soft delete fields to transactions, debts, and inventory_items tables

-- Add deletedAt column to transactions table
ALTER TABLE "transactions" ADD COLUMN "deleted_at" TIMESTAMPTZ;

-- Add deletedAt column to debts table
ALTER TABLE "debts" ADD COLUMN "deleted_at" TIMESTAMPTZ;

-- Add deletedAt column to inventory_items table
ALTER TABLE "inventory_items" ADD COLUMN "deleted_at" TIMESTAMPTZ;

-- Create indexes for better query performance
CREATE INDEX "transactions_deleted_at_idx" ON "transactions"("deleted_at");
CREATE INDEX "debts_deleted_at_idx" ON "debts"("deleted_at");
CREATE INDEX "inventory_items_deleted_at_idx" ON "inventory_items"("deleted_at");

-- Add comments for documentation
COMMENT ON COLUMN "transactions"."deleted_at" IS 'Soft delete timestamp - NULL means not deleted';
COMMENT ON COLUMN "debts"."deleted_at" IS 'Soft delete timestamp - NULL means not deleted';
COMMENT ON COLUMN "inventory_items"."deleted_at" IS 'Soft delete timestamp - NULL means not deleted';
