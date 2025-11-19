-- Add soft delete columns to tables that support soft deletes

-- Add deleted_at to transactions table
ALTER TABLE "transactions" ADD COLUMN "deleted_at" TIMESTAMPTZ;

-- Add deleted_at to debts table
ALTER TABLE "debts" ADD COLUMN "deleted_at" TIMESTAMPTZ;

-- Add deleted_at to inventory_items table
ALTER TABLE "inventory_items" ADD COLUMN "deleted_at" TIMESTAMPTZ;

-- Create indexes for better query performance on deleted_at columns
CREATE INDEX "transactions_deleted_at_idx" ON "transactions"("deleted_at");
CREATE INDEX "debts_deleted_at_idx" ON "debts"("deleted_at");
CREATE INDEX "inventory_items_deleted_at_idx" ON "inventory_items"("deleted_at");
