-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'ACCOUNTANT');

-- CreateEnum
CREATE TYPE "transaction_type" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('CASH', 'MASTER');

-- CreateEnum
CREATE TYPE "debt_status" AS ENUM ('ACTIVE', 'PAID', 'PARTIAL');

-- CreateEnum
CREATE TYPE "inventory_unit" AS ENUM ('KG', 'PIECE', 'LITER', 'OTHER');

-- CreateEnum
CREATE TYPE "inventory_operation_type" AS ENUM ('PURCHASE', 'CONSUMPTION');

-- CreateEnum
CREATE TYPE "notification_severity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "display_method" AS ENUM ('POPUP', 'TOAST', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "employee_status" AS ENUM ('ACTIVE', 'RESIGNED');

-- CreateEnum
CREATE TYPE "employee_adjustment_type" AS ENUM ('BONUS', 'DEDUCTION', 'ADVANCE');

-- CreateEnum
CREATE TYPE "employee_adjustment_status" AS ENUM ('PENDING', 'PROCESSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "advance_status" AS ENUM ('ACTIVE', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "report_type" AS ENUM ('FINANCIAL', 'DEBTS', 'INVENTORY', 'SALARY', 'BRANCHES', 'CUSTOM');

-- CreateEnum
CREATE TYPE "contact_type" AS ENUM ('SUPPLIER', 'CUSTOMER', 'BOTH', 'OTHER');

-- CreateEnum
CREATE TYPE "discount_type" AS ENUM ('PERCENTAGE', 'AMOUNT');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'ACCOUNTANT',
    "branch_id" UUID,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "location" VARCHAR(500) NOT NULL,
    "manager_name" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "branch_id" UUID,
    "type" "transaction_type" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "payment_method" "payment_method",
    "category" VARCHAR(100) NOT NULL,
    "date" DATE NOT NULL,
    "employee_vendor_name" VARCHAR(200) NOT NULL,
    "notes" TEXT,
    "inventory_item_id" UUID,
    "paid_amount" DECIMAL(15,2),
    "total_amount" DECIMAL(15,2),
    "discount_type" "discount_type",
    "discount_value" DECIMAL(15,4),
    "discount_reason" VARCHAR(200),
    "subtotal" DECIMAL(15,2),
    "contact_id" UUID,
    "linked_payable_id" UUID,
    "employee_id" UUID,
    "linked_receivable_id" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "type" "contact_type" NOT NULL,
    "phone" VARCHAR(20),
    "email" VARCHAR(100),
    "address" TEXT,
    "creditLimit" DECIMAL(15,2),
    "notes" TEXT,
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
CREATE TABLE "discount_reasons" (
    "id" UUID NOT NULL,
    "reason" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 999,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "discount_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" "inventory_unit" NOT NULL,
    "cost_per_unit" DECIMAL(15,2) NOT NULL,
    "selling_price" DECIMAL(15,2),
    "include_in_revenue" BOOLEAN NOT NULL DEFAULT true,
    "last_updated" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_consumption" (
    "id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" "inventory_unit" NOT NULL,
    "reason" VARCHAR(500),
    "consumed_at" TIMESTAMPTZ NOT NULL,
    "recorded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "inventory_consumption_pkey" PRIMARY KEY ("id")
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
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

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
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

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
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currency_settings" (
    "id" UUID NOT NULL,
    "code" VARCHAR(3) NOT NULL,
    "name_ar" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100) NOT NULL,
    "symbol" VARCHAR(10) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "currency_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" UUID NOT NULL,
    "login_background_url" TEXT,
    "app_name" VARCHAR(200),
    "app_icon_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "status" "employee_status" NOT NULL DEFAULT 'ACTIVE',
    "position" VARCHAR(100) NOT NULL,
    "base_salary" DECIMAL(15,2) NOT NULL,
    "allowance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "hire_date" DATE NOT NULL,
    "resign_date" DATE,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "salary_payments" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "payment_date" DATE NOT NULL,
    "notes" TEXT,
    "transaction_id" UUID,
    "recorded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "salary_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_inventory_items" (
    "id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "operation_type" "inventory_operation_type" NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "discount_type" "discount_type",
    "discount_value" DECIMAL(15,4),
    "total" DECIMAL(15,2) NOT NULL,
    "notes" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "transaction_inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_templates" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "reportType" "report_type" NOT NULL,
    "config" JSONB NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_field_metadata" (
    "id" UUID NOT NULL,
    "dataSource" VARCHAR(50) NOT NULL,
    "field_name" VARCHAR(100) NOT NULL,
    "display_name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "data_type" VARCHAR(20) NOT NULL,
    "filterable" BOOLEAN NOT NULL DEFAULT true,
    "sortable" BOOLEAN NOT NULL DEFAULT true,
    "aggregatable" BOOLEAN NOT NULL DEFAULT false,
    "groupable" BOOLEAN NOT NULL DEFAULT false,
    "default_visible" BOOLEAN NOT NULL DEFAULT false,
    "default_order" INTEGER NOT NULL DEFAULT 999,
    "category" VARCHAR(100),
    "format" VARCHAR(50),
    "enum_values" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "report_field_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_executions" (
    "id" UUID NOT NULL,
    "template_id" UUID,
    "config" JSONB NOT NULL,
    "applied_filters" JSONB NOT NULL,
    "result_count" INTEGER NOT NULL,
    "execution_time" INTEGER NOT NULL,
    "export_format" VARCHAR(20),
    "file_size" INTEGER,
    "executed_by_id" UUID NOT NULL,
    "executed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_branch_id_idx" ON "users"("branch_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_deleted_by_idx" ON "users"("deleted_by");

-- CreateIndex
CREATE INDEX "users_is_deleted_idx" ON "users"("is_deleted");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_locked_until_idx" ON "users"("locked_until");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "refresh_tokens_is_deleted_idx" ON "refresh_tokens"("is_deleted");

-- CreateIndex
CREATE INDEX "refresh_tokens_deleted_at_idx" ON "refresh_tokens"("deleted_at");

-- CreateIndex
CREATE INDEX "branches_deleted_by_idx" ON "branches"("deleted_by");

-- CreateIndex
CREATE INDEX "branches_is_deleted_idx" ON "branches"("is_deleted");

-- CreateIndex
CREATE INDEX "branches_deleted_at_idx" ON "branches"("deleted_at");

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
CREATE INDEX "transactions_inventory_item_id_idx" ON "transactions"("inventory_item_id");

-- CreateIndex
CREATE INDEX "transactions_contact_id_idx" ON "transactions"("contact_id");

-- CreateIndex
CREATE INDEX "transactions_linked_payable_id_idx" ON "transactions"("linked_payable_id");

-- CreateIndex
CREATE INDEX "transactions_employee_id_idx" ON "transactions"("employee_id");

-- CreateIndex
CREATE INDEX "transactions_linked_receivable_id_idx" ON "transactions"("linked_receivable_id");

-- CreateIndex
CREATE INDEX "transactions_deleted_at_idx" ON "transactions"("deleted_at");

-- CreateIndex
CREATE INDEX "transactions_is_deleted_idx" ON "transactions"("is_deleted");

-- CreateIndex
CREATE INDEX "transactions_discount_type_idx" ON "transactions"("discount_type");

-- CreateIndex
CREATE INDEX "transactions_discount_reason_idx" ON "transactions"("discount_reason");

-- CreateIndex
CREATE INDEX "transactions_branch_id_date_idx" ON "transactions"("branch_id", "date");

-- CreateIndex
CREATE INDEX "transactions_type_date_idx" ON "transactions"("type", "date");

-- CreateIndex
CREATE INDEX "contacts_name_idx" ON "contacts"("name");

-- CreateIndex
CREATE INDEX "contacts_type_idx" ON "contacts"("type");

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
CREATE UNIQUE INDEX "discount_reasons_reason_key" ON "discount_reasons"("reason");

-- CreateIndex
CREATE INDEX "discount_reasons_reason_idx" ON "discount_reasons"("reason");

-- CreateIndex
CREATE INDEX "discount_reasons_is_default_idx" ON "discount_reasons"("is_default");

-- CreateIndex
CREATE INDEX "discount_reasons_sort_order_idx" ON "discount_reasons"("sort_order");

-- CreateIndex
CREATE INDEX "discount_reasons_is_deleted_idx" ON "discount_reasons"("is_deleted");

-- CreateIndex
CREATE INDEX "discount_reasons_deleted_at_idx" ON "discount_reasons"("deleted_at");

-- CreateIndex
CREATE INDEX "inventory_items_branch_id_idx" ON "inventory_items"("branch_id");

-- CreateIndex
CREATE INDEX "inventory_items_name_idx" ON "inventory_items"("name");

-- CreateIndex
CREATE INDEX "inventory_items_unit_idx" ON "inventory_items"("unit");

-- CreateIndex
CREATE INDEX "inventory_items_last_updated_idx" ON "inventory_items"("last_updated");

-- CreateIndex
CREATE INDEX "inventory_items_deleted_at_idx" ON "inventory_items"("deleted_at");

-- CreateIndex
CREATE INDEX "inventory_items_is_deleted_idx" ON "inventory_items"("is_deleted");

-- CreateIndex
CREATE INDEX "inventory_consumption_inventory_item_id_idx" ON "inventory_consumption"("inventory_item_id");

-- CreateIndex
CREATE INDEX "inventory_consumption_branch_id_idx" ON "inventory_consumption"("branch_id");

-- CreateIndex
CREATE INDEX "inventory_consumption_consumed_at_idx" ON "inventory_consumption"("consumed_at");

-- CreateIndex
CREATE INDEX "inventory_consumption_recorded_by_idx" ON "inventory_consumption"("recorded_by");

-- CreateIndex
CREATE INDEX "inventory_consumption_is_deleted_idx" ON "inventory_consumption"("is_deleted");

-- CreateIndex
CREATE INDEX "inventory_consumption_deleted_at_idx" ON "inventory_consumption"("deleted_at");

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
CREATE INDEX "notifications_is_deleted_idx" ON "notifications"("is_deleted");

-- CreateIndex
CREATE INDEX "notifications_deleted_at_idx" ON "notifications"("deleted_at");

-- CreateIndex
CREATE INDEX "notification_settings_user_id_idx" ON "notification_settings"("user_id");

-- CreateIndex
CREATE INDEX "notification_settings_notification_type_idx" ON "notification_settings"("notification_type");

-- CreateIndex
CREATE INDEX "notification_settings_is_enabled_idx" ON "notification_settings"("is_enabled");

-- CreateIndex
CREATE INDEX "notification_settings_is_deleted_idx" ON "notification_settings"("is_deleted");

-- CreateIndex
CREATE INDEX "notification_settings_deleted_at_idx" ON "notification_settings"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_user_id_notification_type_key" ON "notification_settings"("user_id", "notification_type");

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

-- CreateIndex
CREATE UNIQUE INDEX "currency_settings_code_key" ON "currency_settings"("code");

-- CreateIndex
CREATE INDEX "currency_settings_is_default_idx" ON "currency_settings"("is_default");

-- CreateIndex
CREATE INDEX "currency_settings_is_deleted_idx" ON "currency_settings"("is_deleted");

-- CreateIndex
CREATE INDEX "currency_settings_deleted_at_idx" ON "currency_settings"("deleted_at");

-- CreateIndex
CREATE INDEX "app_settings_is_deleted_idx" ON "app_settings"("is_deleted");

-- CreateIndex
CREATE INDEX "app_settings_deleted_at_idx" ON "app_settings"("deleted_at");

-- CreateIndex
CREATE INDEX "employees_branch_id_idx" ON "employees"("branch_id");

-- CreateIndex
CREATE INDEX "employees_status_idx" ON "employees"("status");

-- CreateIndex
CREATE INDEX "employees_hire_date_idx" ON "employees"("hire_date");

-- CreateIndex
CREATE INDEX "employees_resign_date_idx" ON "employees"("resign_date");

-- CreateIndex
CREATE INDEX "employees_deleted_at_idx" ON "employees"("deleted_at");

-- CreateIndex
CREATE INDEX "employees_is_deleted_idx" ON "employees"("is_deleted");

-- CreateIndex
CREATE INDEX "employees_created_by_idx" ON "employees"("created_by");

-- CreateIndex
CREATE INDEX "employees_branch_id_status_idx" ON "employees"("branch_id", "status");

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
CREATE UNIQUE INDEX "salary_payments_transaction_id_key" ON "salary_payments"("transaction_id");

-- CreateIndex
CREATE INDEX "salary_payments_employee_id_idx" ON "salary_payments"("employee_id");

-- CreateIndex
CREATE INDEX "salary_payments_payment_date_idx" ON "salary_payments"("payment_date");

-- CreateIndex
CREATE INDEX "salary_payments_recorded_by_idx" ON "salary_payments"("recorded_by");

-- CreateIndex
CREATE INDEX "salary_payments_transaction_id_idx" ON "salary_payments"("transaction_id");

-- CreateIndex
CREATE INDEX "salary_payments_deleted_at_idx" ON "salary_payments"("deleted_at");

-- CreateIndex
CREATE INDEX "salary_payments_is_deleted_idx" ON "salary_payments"("is_deleted");

-- CreateIndex
CREATE INDEX "salary_payments_employee_id_payment_date_idx" ON "salary_payments"("employee_id", "payment_date");

-- CreateIndex
CREATE INDEX "transaction_inventory_items_transaction_id_idx" ON "transaction_inventory_items"("transaction_id");

-- CreateIndex
CREATE INDEX "transaction_inventory_items_inventory_item_id_idx" ON "transaction_inventory_items"("inventory_item_id");

-- CreateIndex
CREATE INDEX "transaction_inventory_items_operation_type_idx" ON "transaction_inventory_items"("operation_type");

-- CreateIndex
CREATE INDEX "transaction_inventory_items_is_deleted_idx" ON "transaction_inventory_items"("is_deleted");

-- CreateIndex
CREATE INDEX "transaction_inventory_items_deleted_at_idx" ON "transaction_inventory_items"("deleted_at");

-- CreateIndex
CREATE INDEX "report_templates_created_by_id_idx" ON "report_templates"("created_by_id");

-- CreateIndex
CREATE INDEX "report_templates_reportType_idx" ON "report_templates"("reportType");

-- CreateIndex
CREATE INDEX "report_templates_is_public_idx" ON "report_templates"("is_public");

-- CreateIndex
CREATE INDEX "report_templates_is_default_idx" ON "report_templates"("is_default");

-- CreateIndex
CREATE INDEX "report_templates_deleted_at_idx" ON "report_templates"("deleted_at");

-- CreateIndex
CREATE INDEX "report_templates_is_deleted_idx" ON "report_templates"("is_deleted");

-- CreateIndex
CREATE INDEX "report_field_metadata_dataSource_idx" ON "report_field_metadata"("dataSource");

-- CreateIndex
CREATE INDEX "report_field_metadata_is_deleted_idx" ON "report_field_metadata"("is_deleted");

-- CreateIndex
CREATE INDEX "report_field_metadata_deleted_at_idx" ON "report_field_metadata"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "report_field_metadata_dataSource_field_name_key" ON "report_field_metadata"("dataSource", "field_name");

-- CreateIndex
CREATE INDEX "report_executions_template_id_idx" ON "report_executions"("template_id");

-- CreateIndex
CREATE INDEX "report_executions_executed_by_id_idx" ON "report_executions"("executed_by_id");

-- CreateIndex
CREATE INDEX "report_executions_executed_at_idx" ON "report_executions"("executed_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "discount_reasons" ADD CONSTRAINT "discount_reasons_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_consumption" ADD CONSTRAINT "inventory_consumption_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_consumption" ADD CONSTRAINT "inventory_consumption_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_consumption" ADD CONSTRAINT "inventory_consumption_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_consumption" ADD CONSTRAINT "inventory_consumption_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "currency_settings" ADD CONSTRAINT "currency_settings_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_adjustments" ADD CONSTRAINT "employee_adjustments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_adjustments" ADD CONSTRAINT "employee_adjustments_salary_payment_id_fkey" FOREIGN KEY ("salary_payment_id") REFERENCES "salary_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_adjustments" ADD CONSTRAINT "employee_adjustments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_adjustments" ADD CONSTRAINT "employee_adjustments_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_payments" ADD CONSTRAINT "salary_payments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_payments" ADD CONSTRAINT "salary_payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_payments" ADD CONSTRAINT "salary_payments_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_payments" ADD CONSTRAINT "salary_payments_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_inventory_items" ADD CONSTRAINT "transaction_inventory_items_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_inventory_items" ADD CONSTRAINT "transaction_inventory_items_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_inventory_items" ADD CONSTRAINT "transaction_inventory_items_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_field_metadata" ADD CONSTRAINT "report_field_metadata_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_executions" ADD CONSTRAINT "report_executions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "report_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_executions" ADD CONSTRAINT "report_executions_executed_by_id_fkey" FOREIGN KEY ("executed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

