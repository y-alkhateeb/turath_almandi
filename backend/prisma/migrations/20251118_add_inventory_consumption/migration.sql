-- CreateTable: inventory_consumption
CREATE TABLE "inventory_consumption" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inventory_item_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "reason" VARCHAR(500),
    "consumed_at" TIMESTAMPTZ NOT NULL,
    "recorded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_consumption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_consumption_inventory_item_id_idx" ON "inventory_consumption"("inventory_item_id");
CREATE INDEX "inventory_consumption_branch_id_idx" ON "inventory_consumption"("branch_id");
CREATE INDEX "inventory_consumption_consumed_at_idx" ON "inventory_consumption"("consumed_at");
CREATE INDEX "inventory_consumption_recorded_by_idx" ON "inventory_consumption"("recorded_by");

-- AddForeignKey
ALTER TABLE "inventory_consumption" ADD CONSTRAINT "inventory_consumption_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_consumption" ADD CONSTRAINT "inventory_consumption_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_consumption" ADD CONSTRAINT "inventory_consumption_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
