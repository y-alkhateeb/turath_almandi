-- CreateEnum: Employee Status
-- This migration creates the HR/Payroll module with employees, salary payments, and salary increases

-- Step 1: Create employee_status enum
CREATE TYPE "employee_status" AS ENUM ('ACTIVE', 'RESIGNED');

-- Step 2: Create employees table
CREATE TABLE "employees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "status" "employee_status" NOT NULL DEFAULT 'ACTIVE',
    "position" VARCHAR(100) NOT NULL,
    "base_salary" DECIMAL(15, 2) NOT NULL,
    "allowance" DECIMAL(15, 2) NOT NULL DEFAULT 0,
    "hire_date" DATE NOT NULL,
    "resign_date" DATE,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- Step 3: Create salary_payments table
CREATE TABLE "salary_payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "amount" DECIMAL(15, 2) NOT NULL,
    "payment_date" DATE NOT NULL,
    "notes" TEXT,
    "transaction_id" UUID,
    "recorded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "salary_payments_pkey" PRIMARY KEY ("id")
);

-- Step 4: Create salary_increases table
CREATE TABLE "salary_increases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "old_salary" DECIMAL(15, 2) NOT NULL,
    "new_salary" DECIMAL(15, 2) NOT NULL,
    "increase_amount" DECIMAL(15, 2) NOT NULL,
    "effective_date" DATE NOT NULL,
    "reason" TEXT,
    "recorded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "salary_increases_pkey" PRIMARY KEY ("id")
);

-- Step 5: Create unique index on salary_payments.transaction_id
CREATE UNIQUE INDEX "salary_payments_transaction_id_key" ON "salary_payments"("transaction_id");

-- Step 6: Create indexes on employees table
CREATE INDEX "employees_branch_id_idx" ON "employees"("branch_id");
CREATE INDEX "employees_status_idx" ON "employees"("status");
CREATE INDEX "employees_hire_date_idx" ON "employees"("hire_date");
CREATE INDEX "employees_resign_date_idx" ON "employees"("resign_date");
CREATE INDEX "employees_deleted_at_idx" ON "employees"("deleted_at");
CREATE INDEX "employees_created_by_idx" ON "employees"("created_by");
CREATE INDEX "employees_branch_id_status_idx" ON "employees"("branch_id", "status");

-- Step 7: Create indexes on salary_payments table
CREATE INDEX "salary_payments_employee_id_idx" ON "salary_payments"("employee_id");
CREATE INDEX "salary_payments_payment_date_idx" ON "salary_payments"("payment_date");
CREATE INDEX "salary_payments_recorded_by_idx" ON "salary_payments"("recorded_by");
CREATE INDEX "salary_payments_transaction_id_idx" ON "salary_payments"("transaction_id");
CREATE INDEX "salary_payments_deleted_at_idx" ON "salary_payments"("deleted_at");
CREATE INDEX "salary_payments_employee_id_payment_date_idx" ON "salary_payments"("employee_id", "payment_date");

-- Step 8: Create indexes on salary_increases table
CREATE INDEX "salary_increases_employee_id_idx" ON "salary_increases"("employee_id");
CREATE INDEX "salary_increases_effective_date_idx" ON "salary_increases"("effective_date");
CREATE INDEX "salary_increases_recorded_by_idx" ON "salary_increases"("recorded_by");
CREATE INDEX "salary_increases_employee_id_effective_date_idx" ON "salary_increases"("employee_id", "effective_date");

-- Step 9: Add foreign key constraints for employees table
ALTER TABLE "employees" ADD CONSTRAINT "employees_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employees" ADD CONSTRAINT "employees_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 10: Add foreign key constraints for salary_payments table
ALTER TABLE "salary_payments" ADD CONSTRAINT "salary_payments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "salary_payments" ADD CONSTRAINT "salary_payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "salary_payments" ADD CONSTRAINT "salary_payments_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 11: Add foreign key constraints for salary_increases table
ALTER TABLE "salary_increases" ADD CONSTRAINT "salary_increases_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "salary_increases" ADD CONSTRAINT "salary_increases_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
