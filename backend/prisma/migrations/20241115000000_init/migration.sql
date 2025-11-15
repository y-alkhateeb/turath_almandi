-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'ACCOUNTANT');

-- CreateEnum
CREATE TYPE "transaction_type" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('CASH', 'MASTER');

-- CreateEnum
CREATE TYPE "currency" AS ENUM ('USD', 'EUR', 'IQD', 'SAR', 'AED');

-- CreateEnum
CREATE TYPE "debt_status" AS ENUM ('ACTIVE', 'PAID', 'PARTIAL');

-- CreateEnum
CREATE TYPE "inventory_unit" AS ENUM ('KG', 'PIECE', 'LITER', 'OTHER');

-- CreateEnum
CREATE TYPE "notification_severity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "display_method" AS ENUM ('POPUP', 'TOAST', 'EMAIL', 'SMS');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'ACCOUNTANT',
    "branch_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "location" VARCHAR(500) NOT NULL,
    "manager_name" VARCHAR(200) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "type" "transaction_type" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" "currency" NOT NULL DEFAULT 'USD',
    "payment_method" "payment_method",
    "category" VARCHAR(100) NOT NULL,
    "date" DATE NOT NULL,
    "employee_vendor_name" VARCHAR(200) NOT NULL,
    "notes" TEXT,
    "inventory_item_id" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debts" (
    "id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "creditor_name" VARCHAR(200) NOT NULL,
    "original_amount" DECIMAL(15,2) NOT NULL,
    "remaining_amount" DECIMAL(15,2) NOT NULL,
    "date" DATE NOT NULL,
    "due_date" DATE,
    "status" "debt_status" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debt_payments" (
    "id" UUID NOT NULL,
    "debt_id" UUID NOT NULL,
    "amount_paid" DECIMAL(15,2) NOT NULL,
    "payment_date" DATE NOT NULL,
    "notes" TEXT,
    "recorded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debt_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" "inventory_unit" NOT NULL,
    "cost_per_unit" DECIMAL(12,2) NOT NULL,
    "last_updated" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "related_id" UUID,
    "related_type" VARCHAR(50),
    "branch_id" UUID,
    "created_by" UUID NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ,
    "severity" "notification_severity" NOT NULL DEFAULT 'INFO',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "notification_type" VARCHAR(100) NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "min_amount" DECIMAL(15,2),
    "selected_branches" JSONB,
    "display_method" "display_method" NOT NULL DEFAULT 'POPUP',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "changes" JSONB NOT NULL,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_branch_id_idx" ON "users"("branch_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "branches_is_active_idx" ON "branches"("is_active");

-- CreateIndex
CREATE INDEX "branches_name_idx" ON "branches"("name");

-- CreateIndex
CREATE INDEX "transactions_branch_id_idx" ON "transactions"("branch_id");

-- CreateIndex
CREATE INDEX "transactions_type_idx" ON "transactions"("type");

-- CreateIndex
CREATE INDEX "transactions_date_idx" ON "transactions"("date");

-- CreateIndex
CREATE INDEX "transactions_category_idx" ON "transactions"("category");

-- CreateIndex
CREATE INDEX "transactions_created_by_idx" ON "transactions"("created_by");

-- CreateIndex
CREATE INDEX "transactions_payment_method_idx" ON "transactions"("payment_method");

-- CreateIndex
CREATE INDEX "transactions_currency_idx" ON "transactions"("currency");

-- CreateIndex
CREATE INDEX "transactions_inventory_item_id_idx" ON "transactions"("inventory_item_id");

-- CreateIndex
CREATE INDEX "debts_branch_id_idx" ON "debts"("branch_id");

-- CreateIndex
CREATE INDEX "debts_status_idx" ON "debts"("status");

-- CreateIndex
CREATE INDEX "debts_due_date_idx" ON "debts"("due_date");

-- CreateIndex
CREATE INDEX "debts_created_by_idx" ON "debts"("created_by");

-- CreateIndex
CREATE INDEX "debts_date_idx" ON "debts"("date");

-- CreateIndex
CREATE INDEX "debt_payments_debt_id_idx" ON "debt_payments"("debt_id");

-- CreateIndex
CREATE INDEX "debt_payments_payment_date_idx" ON "debt_payments"("payment_date");

-- CreateIndex
CREATE INDEX "debt_payments_recorded_by_idx" ON "debt_payments"("recorded_by");

-- CreateIndex
CREATE INDEX "inventory_items_branch_id_idx" ON "inventory_items"("branch_id");

-- CreateIndex
CREATE INDEX "inventory_items_name_idx" ON "inventory_items"("name");

-- CreateIndex
CREATE INDEX "inventory_items_unit_idx" ON "inventory_items"("unit");

-- CreateIndex
CREATE INDEX "inventory_items_last_updated_idx" ON "inventory_items"("last_updated");

-- CreateIndex
CREATE INDEX "notifications_branch_id_idx" ON "notifications"("branch_id");

-- CreateIndex
CREATE INDEX "notifications_created_by_idx" ON "notifications"("created_by");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_severity_idx" ON "notifications"("severity");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_user_id_notification_type_key" ON "notification_settings"("user_id", "notification_type");

-- CreateIndex
CREATE INDEX "notification_settings_user_id_idx" ON "notification_settings"("user_id");

-- CreateIndex
CREATE INDEX "notification_settings_notification_type_idx" ON "notification_settings"("notification_type");

-- CreateIndex
CREATE INDEX "notification_settings_is_enabled_idx" ON "notification_settings"("is_enabled");

-- CreateIndex
CREATE INDEX "audit_log_user_id_idx" ON "audit_log"("user_id");

-- CreateIndex
CREATE INDEX "audit_log_entity_type_idx" ON "audit_log"("entity_type");

-- CreateIndex
CREATE INDEX "audit_log_entity_id_idx" ON "audit_log"("entity_id");

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- CreateIndex
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_debt_id_fkey" FOREIGN KEY ("debt_id") REFERENCES "debts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
