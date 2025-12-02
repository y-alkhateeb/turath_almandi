/*
  Warnings:

  - You are about to drop the column `linked_debt_id` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the `advance_deductions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `bonuses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `debt_payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `debts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_advances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `salary_increases` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "employee_adjustment_type" AS ENUM ('BONUS', 'DEDUCTION', 'ADVANCE');

-- CreateEnum
CREATE TYPE "employee_adjustment_status" AS ENUM ('PENDING', 'PROCESSED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "advance_deductions" DROP CONSTRAINT "advance_deductions_advance_id_fkey";

-- DropForeignKey
ALTER TABLE "advance_deductions" DROP CONSTRAINT "advance_deductions_deleted_by_fkey";

-- DropForeignKey
ALTER TABLE "advance_deductions" DROP CONSTRAINT "advance_deductions_recorded_by_fkey";

-- DropForeignKey
ALTER TABLE "advance_deductions" DROP CONSTRAINT "advance_deductions_salary_payment_id_fkey";

-- DropForeignKey
ALTER TABLE "bonuses" DROP CONSTRAINT "bonuses_deleted_by_fkey";

-- DropForeignKey
ALTER TABLE "bonuses" DROP CONSTRAINT "bonuses_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "bonuses" DROP CONSTRAINT "bonuses_recorded_by_fkey";

-- DropForeignKey
ALTER TABLE "bonuses" DROP CONSTRAINT "bonuses_transaction_id_fkey";

-- DropForeignKey
ALTER TABLE "debt_payments" DROP CONSTRAINT "debt_payments_debt_id_fkey";

-- DropForeignKey
ALTER TABLE "debt_payments" DROP CONSTRAINT "debt_payments_deleted_by_fkey";

-- DropForeignKey
ALTER TABLE "debt_payments" DROP CONSTRAINT "debt_payments_recorded_by_fkey";

-- DropForeignKey
ALTER TABLE "debts" DROP CONSTRAINT "debts_branch_id_fkey";

-- DropForeignKey
ALTER TABLE "debts" DROP CONSTRAINT "debts_created_by_fkey";

-- DropForeignKey
ALTER TABLE "employee_advances" DROP CONSTRAINT "employee_advances_deleted_by_fkey";

-- DropForeignKey
ALTER TABLE "employee_advances" DROP CONSTRAINT "employee_advances_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "employee_advances" DROP CONSTRAINT "employee_advances_recorded_by_fkey";

-- DropForeignKey
ALTER TABLE "employee_advances" DROP CONSTRAINT "employee_advances_transaction_id_fkey";

-- DropForeignKey
ALTER TABLE "salary_increases" DROP CONSTRAINT "salary_increases_deleted_by_fkey";

-- DropForeignKey
ALTER TABLE "salary_increases" DROP CONSTRAINT "salary_increases_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "salary_increases" DROP CONSTRAINT "salary_increases_recorded_by_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_linked_debt_id_fkey";

-- DropIndex
DROP INDEX "transactions_linked_debt_id_idx";

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "linked_debt_id",
ADD COLUMN     "employee_id" UUID;

-- DropTable
DROP TABLE "advance_deductions";

-- DropTable
DROP TABLE "bonuses";

-- DropTable
DROP TABLE "debt_payments";

-- DropTable
DROP TABLE "debts";

-- DropTable
DROP TABLE "employee_advances";

-- DropTable
DROP TABLE "salary_increases";

-- CreateTable
CREATE TABLE "employee_adjustments" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "type" "employee_adjustment_type" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT,
    "status" "employee_adjustment_status" NOT NULL DEFAULT 'PENDING',
    "salary_payment_id" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "employee_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_adjustments_employee_id_idx" ON "employee_adjustments"("employee_id");

-- CreateIndex
CREATE INDEX "employee_adjustments_type_idx" ON "employee_adjustments"("type");

-- CreateIndex
CREATE INDEX "employee_adjustments_status_idx" ON "employee_adjustments"("status");

-- CreateIndex
CREATE INDEX "employee_adjustments_date_idx" ON "employee_adjustments"("date");

-- CreateIndex
CREATE INDEX "employee_adjustments_salary_payment_id_idx" ON "employee_adjustments"("salary_payment_id");

-- CreateIndex
CREATE INDEX "employee_adjustments_created_by_idx" ON "employee_adjustments"("created_by");

-- CreateIndex
CREATE INDEX "employee_adjustments_deleted_at_idx" ON "employee_adjustments"("deleted_at");

-- CreateIndex
CREATE INDEX "employee_adjustments_is_deleted_idx" ON "employee_adjustments"("is_deleted");

-- CreateIndex
CREATE INDEX "transactions_employee_id_idx" ON "transactions"("employee_id");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_adjustments" ADD CONSTRAINT "employee_adjustments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_adjustments" ADD CONSTRAINT "employee_adjustments_salary_payment_id_fkey" FOREIGN KEY ("salary_payment_id") REFERENCES "salary_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_adjustments" ADD CONSTRAINT "employee_adjustments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_adjustments" ADD CONSTRAINT "employee_adjustments_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
