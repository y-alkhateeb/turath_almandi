-- Add remaining_amount column to employee_adjustments (for partial advance deductions)
ALTER TABLE "employee_adjustments" ADD COLUMN "remaining_amount" DECIMAL(15,2);

-- Initialize remaining_amount with amount for existing ADVANCE adjustments that are PENDING
UPDATE "employee_adjustments"
SET "remaining_amount" = "amount"
WHERE "type" = 'ADVANCE' AND "status" = 'PENDING';

-- Add salary_month column to salary_payments
ALTER TABLE "salary_payments" ADD COLUMN "salary_month" VARCHAR(7);

-- Generate salary_month from payment_date for existing records
UPDATE "salary_payments"
SET "salary_month" = TO_CHAR("payment_date", 'YYYY-MM')
WHERE "salary_month" IS NULL;

-- Make salary_month NOT NULL after populating existing data
ALTER TABLE "salary_payments" ALTER COLUMN "salary_month" SET NOT NULL;

-- Add index on salary_month
CREATE INDEX "salary_payments_salary_month_idx" ON "salary_payments"("salary_month");

-- Add unique constraint (only for non-deleted records)
CREATE UNIQUE INDEX "unique_employee_salary_month" ON "salary_payments"("employee_id", "salary_month") WHERE "is_deleted" = false;
