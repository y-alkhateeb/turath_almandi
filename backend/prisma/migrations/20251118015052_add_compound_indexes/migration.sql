-- CreateIndex: Add compound index on transactions (branchId, date) for optimized queries filtering by branch and date range
CREATE INDEX "transactions_branchId_date_idx" ON "transactions"("branch_id", "date");

-- CreateIndex: Add compound index on transactions (type, date) for optimized queries filtering by transaction type and date range
CREATE INDEX "transactions_type_date_idx" ON "transactions"("type", "date");

-- CreateIndex: Add compound index on debts (status, dueDate) for optimized queries on debt status with due date sorting/filtering
CREATE INDEX "debts_status_dueDate_idx" ON "debts"("status", "due_date");
