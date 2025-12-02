-- AlterTable
ALTER TABLE "transaction_inventory_items" ADD COLUMN     "inventory_sub_unit_id" UUID;

-- CreateIndex
CREATE INDEX "transaction_inventory_items_inventory_sub_unit_id_idx" ON "transaction_inventory_items"("inventory_sub_unit_id");

-- AddForeignKey
ALTER TABLE "transaction_inventory_items" ADD CONSTRAINT "transaction_inventory_items_inventory_sub_unit_id_fkey" FOREIGN KEY ("inventory_sub_unit_id") REFERENCES "inventory_sub_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
