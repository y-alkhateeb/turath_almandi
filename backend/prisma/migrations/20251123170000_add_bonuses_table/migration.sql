-- CreateTable
CREATE TABLE "bonuses" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "bonus_date" DATE NOT NULL,
    "reason" TEXT,
    "transaction_id" UUID,
    "recorded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "bonuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bonuses_transaction_id_key" ON "bonuses"("transaction_id");

-- CreateIndex
CREATE INDEX "bonuses_employee_id_idx" ON "bonuses"("employee_id");

-- CreateIndex
CREATE INDEX "bonuses_bonus_date_idx" ON "bonuses"("bonus_date");

-- CreateIndex
CREATE INDEX "bonuses_recorded_by_idx" ON "bonuses"("recorded_by");

-- CreateIndex
CREATE INDEX "bonuses_transaction_id_idx" ON "bonuses"("transaction_id");

-- CreateIndex
CREATE INDEX "bonuses_deleted_at_idx" ON "bonuses"("deleted_at");

-- CreateIndex
CREATE INDEX "bonuses_employee_id_bonus_date_idx" ON "bonuses"("employee_id", "bonus_date");

-- AddForeignKey
ALTER TABLE "bonuses" ADD CONSTRAINT "bonuses_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonuses" ADD CONSTRAINT "bonuses_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonuses" ADD CONSTRAINT "bonuses_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
