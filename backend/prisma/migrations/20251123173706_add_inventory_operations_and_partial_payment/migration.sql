-- CreateEnum
CREATE TYPE "inventory_operation_type" AS ENUM ('PURCHASE', 'CONSUMPTION');

-- AlterTable
ALTER TABLE "transactions"
ADD COLUMN "paid_amount" DECIMAL(15,2),
ADD COLUMN "total_amount" DECIMAL(15,2),
ADD COLUMN "linked_debt_id" UUID;

-- CreateTable
CREATE TABLE "transaction_inventory_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transaction_id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "operation_type" "inventory_operation_type" NOT NULL,
    "unit_price" DECIMAL(15,2),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "transaction_inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transaction_inventory_items_transaction_id_idx" ON "transaction_inventory_items"("transaction_id");

-- CreateIndex
CREATE INDEX "transaction_inventory_items_inventory_item_id_idx" ON "transaction_inventory_items"("inventory_item_id");

-- CreateIndex
CREATE INDEX "transaction_inventory_items_operation_type_idx" ON "transaction_inventory_items"("operation_type");

-- CreateIndex
CREATE INDEX "transactions_linked_debt_id_idx" ON "transactions"("linked_debt_id");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_linked_debt_id_fkey" FOREIGN KEY ("linked_debt_id") REFERENCES "debts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_inventory_items" ADD CONSTRAINT "transaction_inventory_items_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_inventory_items" ADD CONSTRAINT "transaction_inventory_items_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
