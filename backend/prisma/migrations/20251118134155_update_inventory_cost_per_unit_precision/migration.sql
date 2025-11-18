-- AlterTable: Update InventoryItem.cost_per_unit precision from DECIMAL(12,2) to DECIMAL(15,2)
-- This allows storing larger cost values (up to 9,999,999,999,999.99)
ALTER TABLE "inventory_items"
  ALTER COLUMN "cost_per_unit" TYPE DECIMAL(15, 2);
