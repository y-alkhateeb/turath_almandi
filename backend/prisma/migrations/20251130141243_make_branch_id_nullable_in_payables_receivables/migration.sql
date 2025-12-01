/*
  Warnings:

  - You are about to drop the column `is_active` on the `branches` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `branches` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `users` table. All the data in the column will be lost.
  - Changed the type of `unit` on the `inventory_consumption` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "contact_type" AS ENUM ('SUPPLIER', 'CUSTOMER', 'BOTH', 'OTHER');

-- DropIndex
DROP INDEX "branches_is_active_idx";

-- DropIndex
DROP INDEX "users_is_active_idx";

-- AlterTable
ALTER TABLE "advance_deductions" ADD COLUMN     "deleted_at" TIMESTAMPTZ,
ADD COLUMN     "deleted_by" UUID,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "app_settings" ADD COLUMN     "deleted_at" TIMESTAMPTZ,
ADD COLUMN     "deleted_by" UUID,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "audit_log" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "bonuses" ADD COLUMN     "deleted_by" UUID,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "branches" DROP COLUMN "is_active",
DROP COLUMN "phone",
ADD COLUMN     "deleted_at" TIMESTAMPTZ,
ADD COLUMN     "deleted_by" UUID,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "currency_settings" ADD COLUMN     "deleted_at" TIMESTAMPTZ,
ADD COLUMN     "deleted_by" UUID,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "debt_payments" ADD COLUMN     "deleted_at" TIMESTAMPTZ,
ADD COLUMN     "deleted_by" UUID,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "employee_advances" ADD COLUMN     "deleted_by" UUID,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "deleted_by" UUID,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "inventory_consumption" ADD COLUMN     "deleted_at" TIMESTAMPTZ,
ADD COLUMN     "deleted_by" UUID,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id" DROP DEFAULT,
DROP COLUMN "unit",
ADD COLUMN     "unit" "inventory_unit" NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "inventory_items" ADD COLUMN     "allow_sub_units" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deleted_by" UUID,
ADD COLUMN     "include_in_revenue" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "notification_settings" ADD COLUMN     "deleted_at" TIMESTAMPTZ,
ADD COLUMN     "deleted_by" UUID,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "deleted_at" TIMESTAMPTZ,
ADD COLUMN     "deleted_by" UUID,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "deleted_at" TIMESTAMPTZ,
ADD COLUMN     "deleted_by" UUID,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "report_executions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "report_field_metadata" ADD COLUMN     "deleted_at" TIMESTAMPTZ,
ADD COLUMN     "deleted_by" UUID,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "report_templates" ADD COLUMN     "deleted_by" UUID,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "salary_increases" ADD COLUMN     "deleted_at" TIMESTAMPTZ,
ADD COLUMN     "deleted_by" UUID,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "salary_payments" ADD COLUMN     "deleted_by" UUID,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "transaction_inventory_items" ADD COLUMN     "deleted_at" TIMESTAMPTZ,
ADD COLUMN     "deleted_by" UUID,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "contact_id" UUID,
ADD COLUMN     "deleted_by" UUID,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "linked_payable_id" UUID,
ADD COLUMN     "linked_receivable_id" UUID;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "is_active",
ADD COLUMN     "deleted_at" TIMESTAMPTZ,
ADD COLUMN     "deleted_by" UUID,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "type" "contact_type" NOT NULL,
    "phone" VARCHAR(20),
    "email" VARCHAR(100),
    "address" TEXT,
    "taxNumber" VARCHAR(50),
    "creditLimit" DECIMAL(15,2),
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "branch_id" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts_payable" (
    "id" UUID NOT NULL,
    "contact_id" UUID NOT NULL,
    "original_amount" DECIMAL(15,2) NOT NULL,
    "remaining_amount" DECIMAL(15,2) NOT NULL,
    "date" DATE NOT NULL,
    "due_date" DATE,
    "status" "debt_status" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "invoice_number" VARCHAR(50),
    "notes" TEXT,
    "linked_purchase_transaction_id" UUID,
    "branch_id" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "accounts_payable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts_receivable" (
    "id" UUID NOT NULL,
    "contact_id" UUID NOT NULL,
    "original_amount" DECIMAL(15,2) NOT NULL,
    "remaining_amount" DECIMAL(15,2) NOT NULL,
    "date" DATE NOT NULL,
    "due_date" DATE,
    "status" "debt_status" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "invoice_number" VARCHAR(50),
    "notes" TEXT,
    "linked_sale_transaction_id" UUID,
    "branch_id" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "accounts_receivable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payable_payments" (
    "id" UUID NOT NULL,
    "payable_id" UUID NOT NULL,
    "amount_paid" DECIMAL(15,2) NOT NULL,
    "payment_date" DATE NOT NULL,
    "payment_method" "payment_method",
    "notes" TEXT,
    "transaction_id" UUID,
    "recorded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "payable_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receivable_payments" (
    "id" UUID NOT NULL,
    "receivable_id" UUID NOT NULL,
    "amount_paid" DECIMAL(15,2) NOT NULL,
    "payment_date" DATE NOT NULL,
    "payment_method" "payment_method",
    "notes" TEXT,
    "transaction_id" UUID,
    "recorded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "receivable_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_sub_units" (
    "id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "unit_name" VARCHAR(50) NOT NULL,
    "ratio" DECIMAL(10,4) NOT NULL,
    "selling_price" DECIMAL(15,2) NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "inventory_sub_units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contacts_name_idx" ON "contacts"("name");

-- CreateIndex
CREATE INDEX "contacts_type_idx" ON "contacts"("type");

-- CreateIndex
CREATE INDEX "contacts_is_active_idx" ON "contacts"("is_active");

-- CreateIndex
CREATE INDEX "contacts_branch_id_idx" ON "contacts"("branch_id");

-- CreateIndex
CREATE INDEX "contacts_is_deleted_idx" ON "contacts"("is_deleted");

-- CreateIndex
CREATE INDEX "contacts_deleted_at_idx" ON "contacts"("deleted_at");

-- CreateIndex
CREATE INDEX "contacts_created_by_idx" ON "contacts"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_payable_linked_purchase_transaction_id_key" ON "accounts_payable"("linked_purchase_transaction_id");

-- CreateIndex
CREATE INDEX "accounts_payable_contact_id_idx" ON "accounts_payable"("contact_id");

-- CreateIndex
CREATE INDEX "accounts_payable_status_idx" ON "accounts_payable"("status");

-- CreateIndex
CREATE INDEX "accounts_payable_due_date_idx" ON "accounts_payable"("due_date");

-- CreateIndex
CREATE INDEX "accounts_payable_branch_id_idx" ON "accounts_payable"("branch_id");

-- CreateIndex
CREATE INDEX "accounts_payable_is_deleted_idx" ON "accounts_payable"("is_deleted");

-- CreateIndex
CREATE INDEX "accounts_payable_deleted_at_idx" ON "accounts_payable"("deleted_at");

-- CreateIndex
CREATE INDEX "accounts_payable_created_by_idx" ON "accounts_payable"("created_by");

-- CreateIndex
CREATE INDEX "accounts_payable_date_idx" ON "accounts_payable"("date");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_receivable_linked_sale_transaction_id_key" ON "accounts_receivable"("linked_sale_transaction_id");

-- CreateIndex
CREATE INDEX "accounts_receivable_contact_id_idx" ON "accounts_receivable"("contact_id");

-- CreateIndex
CREATE INDEX "accounts_receivable_status_idx" ON "accounts_receivable"("status");

-- CreateIndex
CREATE INDEX "accounts_receivable_due_date_idx" ON "accounts_receivable"("due_date");

-- CreateIndex
CREATE INDEX "accounts_receivable_branch_id_idx" ON "accounts_receivable"("branch_id");

-- CreateIndex
CREATE INDEX "accounts_receivable_is_deleted_idx" ON "accounts_receivable"("is_deleted");

-- CreateIndex
CREATE INDEX "accounts_receivable_deleted_at_idx" ON "accounts_receivable"("deleted_at");

-- CreateIndex
CREATE INDEX "accounts_receivable_created_by_idx" ON "accounts_receivable"("created_by");

-- CreateIndex
CREATE INDEX "accounts_receivable_date_idx" ON "accounts_receivable"("date");

-- CreateIndex
CREATE UNIQUE INDEX "payable_payments_transaction_id_key" ON "payable_payments"("transaction_id");

-- CreateIndex
CREATE INDEX "payable_payments_payable_id_idx" ON "payable_payments"("payable_id");

-- CreateIndex
CREATE INDEX "payable_payments_payment_date_idx" ON "payable_payments"("payment_date");

-- CreateIndex
CREATE INDEX "payable_payments_is_deleted_idx" ON "payable_payments"("is_deleted");

-- CreateIndex
CREATE INDEX "payable_payments_deleted_at_idx" ON "payable_payments"("deleted_at");

-- CreateIndex
CREATE INDEX "payable_payments_recorded_by_idx" ON "payable_payments"("recorded_by");

-- CreateIndex
CREATE UNIQUE INDEX "receivable_payments_transaction_id_key" ON "receivable_payments"("transaction_id");

-- CreateIndex
CREATE INDEX "receivable_payments_receivable_id_idx" ON "receivable_payments"("receivable_id");

-- CreateIndex
CREATE INDEX "receivable_payments_payment_date_idx" ON "receivable_payments"("payment_date");

-- CreateIndex
CREATE INDEX "receivable_payments_is_deleted_idx" ON "receivable_payments"("is_deleted");

-- CreateIndex
CREATE INDEX "receivable_payments_deleted_at_idx" ON "receivable_payments"("deleted_at");

-- CreateIndex
CREATE INDEX "receivable_payments_recorded_by_idx" ON "receivable_payments"("recorded_by");

-- CreateIndex
CREATE INDEX "inventory_sub_units_inventory_item_id_idx" ON "inventory_sub_units"("inventory_item_id");

-- CreateIndex
CREATE INDEX "inventory_sub_units_is_deleted_idx" ON "inventory_sub_units"("is_deleted");

-- CreateIndex
CREATE INDEX "inventory_sub_units_deleted_at_idx" ON "inventory_sub_units"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_sub_units_inventory_item_id_unit_name_key" ON "inventory_sub_units"("inventory_item_id", "unit_name");

-- CreateIndex
CREATE INDEX "advance_deductions_is_deleted_idx" ON "advance_deductions"("is_deleted");

-- CreateIndex
CREATE INDEX "advance_deductions_deleted_at_idx" ON "advance_deductions"("deleted_at");

-- CreateIndex
CREATE INDEX "app_settings_is_deleted_idx" ON "app_settings"("is_deleted");

-- CreateIndex
CREATE INDEX "app_settings_deleted_at_idx" ON "app_settings"("deleted_at");

-- CreateIndex
CREATE INDEX "bonuses_is_deleted_idx" ON "bonuses"("is_deleted");

-- CreateIndex
CREATE INDEX "branches_deleted_by_idx" ON "branches"("deleted_by");

-- CreateIndex
CREATE INDEX "branches_is_deleted_idx" ON "branches"("is_deleted");

-- CreateIndex
CREATE INDEX "branches_deleted_at_idx" ON "branches"("deleted_at");

-- CreateIndex
CREATE INDEX "currency_settings_is_deleted_idx" ON "currency_settings"("is_deleted");

-- CreateIndex
CREATE INDEX "currency_settings_deleted_at_idx" ON "currency_settings"("deleted_at");

-- CreateIndex
CREATE INDEX "debt_payments_is_deleted_idx" ON "debt_payments"("is_deleted");

-- CreateIndex
CREATE INDEX "debt_payments_deleted_at_idx" ON "debt_payments"("deleted_at");

-- CreateIndex
CREATE INDEX "employee_advances_transaction_id_idx" ON "employee_advances"("transaction_id");

-- CreateIndex
CREATE INDEX "employee_advances_is_deleted_idx" ON "employee_advances"("is_deleted");

-- CreateIndex
CREATE INDEX "employees_is_deleted_idx" ON "employees"("is_deleted");

-- CreateIndex
CREATE INDEX "inventory_consumption_is_deleted_idx" ON "inventory_consumption"("is_deleted");

-- CreateIndex
CREATE INDEX "inventory_consumption_deleted_at_idx" ON "inventory_consumption"("deleted_at");

-- CreateIndex
CREATE INDEX "inventory_items_is_deleted_idx" ON "inventory_items"("is_deleted");

-- CreateIndex
CREATE INDEX "notification_settings_is_deleted_idx" ON "notification_settings"("is_deleted");

-- CreateIndex
CREATE INDEX "notification_settings_deleted_at_idx" ON "notification_settings"("deleted_at");

-- CreateIndex
CREATE INDEX "notifications_is_deleted_idx" ON "notifications"("is_deleted");

-- CreateIndex
CREATE INDEX "notifications_deleted_at_idx" ON "notifications"("deleted_at");

-- CreateIndex
CREATE INDEX "refresh_tokens_is_deleted_idx" ON "refresh_tokens"("is_deleted");

-- CreateIndex
CREATE INDEX "refresh_tokens_deleted_at_idx" ON "refresh_tokens"("deleted_at");

-- CreateIndex
CREATE INDEX "report_field_metadata_is_deleted_idx" ON "report_field_metadata"("is_deleted");

-- CreateIndex
CREATE INDEX "report_field_metadata_deleted_at_idx" ON "report_field_metadata"("deleted_at");

-- CreateIndex
CREATE INDEX "report_templates_is_deleted_idx" ON "report_templates"("is_deleted");

-- CreateIndex
CREATE INDEX "salary_increases_is_deleted_idx" ON "salary_increases"("is_deleted");

-- CreateIndex
CREATE INDEX "salary_increases_deleted_at_idx" ON "salary_increases"("deleted_at");

-- CreateIndex
CREATE INDEX "salary_payments_is_deleted_idx" ON "salary_payments"("is_deleted");

-- CreateIndex
CREATE INDEX "transaction_inventory_items_is_deleted_idx" ON "transaction_inventory_items"("is_deleted");

-- CreateIndex
CREATE INDEX "transaction_inventory_items_deleted_at_idx" ON "transaction_inventory_items"("deleted_at");

-- CreateIndex
CREATE INDEX "transactions_contact_id_idx" ON "transactions"("contact_id");

-- CreateIndex
CREATE INDEX "transactions_linked_payable_id_idx" ON "transactions"("linked_payable_id");

-- CreateIndex
CREATE INDEX "transactions_linked_receivable_id_idx" ON "transactions"("linked_receivable_id");

-- CreateIndex
CREATE INDEX "transactions_is_deleted_idx" ON "transactions"("is_deleted");

-- CreateIndex
CREATE INDEX "users_deleted_by_idx" ON "users"("deleted_by");

-- CreateIndex
CREATE INDEX "users_is_deleted_idx" ON "users"("is_deleted");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_linked_purchase_transaction_id_fkey" FOREIGN KEY ("linked_purchase_transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_linked_sale_transaction_id_fkey" FOREIGN KEY ("linked_sale_transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payable_payments" ADD CONSTRAINT "payable_payments_payable_id_fkey" FOREIGN KEY ("payable_id") REFERENCES "accounts_payable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payable_payments" ADD CONSTRAINT "payable_payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payable_payments" ADD CONSTRAINT "payable_payments_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payable_payments" ADD CONSTRAINT "payable_payments_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receivable_payments" ADD CONSTRAINT "receivable_payments_receivable_id_fkey" FOREIGN KEY ("receivable_id") REFERENCES "accounts_receivable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receivable_payments" ADD CONSTRAINT "receivable_payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receivable_payments" ADD CONSTRAINT "receivable_payments_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receivable_payments" ADD CONSTRAINT "receivable_payments_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_sub_units" ADD CONSTRAINT "inventory_sub_units_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_sub_units" ADD CONSTRAINT "inventory_sub_units_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_sub_units" ADD CONSTRAINT "inventory_sub_units_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_consumption" ADD CONSTRAINT "inventory_consumption_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "currency_settings" ADD CONSTRAINT "currency_settings_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_payments" ADD CONSTRAINT "salary_payments_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_increases" ADD CONSTRAINT "salary_increases_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonuses" ADD CONSTRAINT "bonuses_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_advances" ADD CONSTRAINT "employee_advances_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advance_deductions" ADD CONSTRAINT "advance_deductions_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_inventory_items" ADD CONSTRAINT "transaction_inventory_items_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_field_metadata" ADD CONSTRAINT "report_field_metadata_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "debts_status_dueDate_idx" RENAME TO "debts_status_due_date_idx";

-- RenameIndex
ALTER INDEX "transactions_branchId_date_idx" RENAME TO "transactions_branch_id_date_idx";
