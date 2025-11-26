-- CreateEnum: Advance Status
-- This migration adds employee advances (سلف) and advance deductions functionality

-- Step 1: Create advance_status enum
CREATE TYPE "advance_status" AS ENUM ('ACTIVE', 'PAID', 'CANCELLED');

-- Step 2: Create employee_advances table
CREATE TABLE "employee_advances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "amount" DECIMAL(15, 2) NOT NULL,
    "remaining_amount" DECIMAL(15, 2) NOT NULL,
    "monthly_deduction" DECIMAL(15, 2) NOT NULL,
    "advance_date" DATE NOT NULL,
    "reason" TEXT,
    "status" "advance_status" NOT NULL DEFAULT 'ACTIVE',
    "recorded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "employee_advances_pkey" PRIMARY KEY ("id")
);

-- Step 3: Create advance_deductions table
CREATE TABLE "advance_deductions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "advance_id" UUID NOT NULL,
    "amount" DECIMAL(15, 2) NOT NULL,
    "deduction_date" DATE NOT NULL,
    "salary_payment_id" UUID,
    "notes" TEXT,
    "recorded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "advance_deductions_pkey" PRIMARY KEY ("id")
);

-- Step 4: Create indexes on employee_advances table
CREATE INDEX "employee_advances_employee_id_idx" ON "employee_advances"("employee_id");
CREATE INDEX "employee_advances_advance_date_idx" ON "employee_advances"("advance_date");
CREATE INDEX "employee_advances_status_idx" ON "employee_advances"("status");
CREATE INDEX "employee_advances_recorded_by_idx" ON "employee_advances"("recorded_by");
CREATE INDEX "employee_advances_deleted_at_idx" ON "employee_advances"("deleted_at");
CREATE INDEX "employee_advances_employee_id_status_idx" ON "employee_advances"("employee_id", "status");

-- Step 5: Create indexes on advance_deductions table
CREATE INDEX "advance_deductions_advance_id_idx" ON "advance_deductions"("advance_id");
CREATE INDEX "advance_deductions_deduction_date_idx" ON "advance_deductions"("deduction_date");
CREATE INDEX "advance_deductions_salary_payment_id_idx" ON "advance_deductions"("salary_payment_id");
CREATE INDEX "advance_deductions_recorded_by_idx" ON "advance_deductions"("recorded_by");

-- Step 6: Add foreign key constraints for employee_advances table
ALTER TABLE "employee_advances" ADD CONSTRAINT "employee_advances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_advances" ADD CONSTRAINT "employee_advances_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 7: Add foreign key constraints for advance_deductions table
ALTER TABLE "advance_deductions" ADD CONSTRAINT "advance_deductions_advance_id_fkey" FOREIGN KEY ("advance_id") REFERENCES "employee_advances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "advance_deductions" ADD CONSTRAINT "advance_deductions_salary_payment_id_fkey" FOREIGN KEY ("salary_payment_id") REFERENCES "salary_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "advance_deductions" ADD CONSTRAINT "advance_deductions_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
