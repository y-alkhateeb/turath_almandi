-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "inventory_item_id" UUID;

-- CreateIndex
CREATE INDEX "transactions_inventory_item_id_idx" ON "transactions"("inventory_item_id");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
