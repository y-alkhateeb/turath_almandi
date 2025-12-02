-- AlterTable: Add notes column to transaction_inventory_items
ALTER TABLE "transaction_inventory_items" ADD COLUMN "notes" VARCHAR(500);

-- DropForeignKey
ALTER TABLE "transaction_inventory_items" DROP CONSTRAINT IF EXISTS "transaction_inventory_items_inventory_sub_unit_id_fkey";

-- DropIndex
DROP INDEX IF EXISTS "transaction_inventory_items_inventory_sub_unit_id_idx";

-- AlterTable: Drop inventory_sub_unit_id column from transaction_inventory_items
ALTER TABLE "transaction_inventory_items" DROP COLUMN IF EXISTS "inventory_sub_unit_id";

-- DropTable: inventory_sub_units
DROP TABLE IF EXISTS "inventory_sub_units";

-- AlterTable: Drop allow_sub_units column from inventory_items
ALTER TABLE "inventory_items" DROP COLUMN IF EXISTS "allow_sub_units";

