-- Migration to add soft delete columns to existing tables
-- This migration is safe to run on a database that was created with old migrations

-- Add soft delete columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add soft delete columns to refresh_tokens table  
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add soft delete columns to branches table
ALTER TABLE branches ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add soft delete columns to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add soft delete columns to contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add soft delete columns to accounts_payable table
ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add soft delete columns to accounts_receivable table
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add soft delete columns to payable_payments table
ALTER TABLE payable_payments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE payable_payments ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE payable_payments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add soft delete columns to receivable_payments table
ALTER TABLE receivable_payments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE receivable_payments ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE receivable_payments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add soft delete columns to discount_reasons table
ALTER TABLE discount_reasons ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE discount_reasons ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE discount_reasons ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add soft delete columns to inventory_items table
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add soft delete columns to inventory_consumption table
ALTER TABLE inventory_consumption ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE inventory_consumption ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE inventory_consumption ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add soft delete columns to notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add soft delete columns to notification_settings table
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add soft delete columns to currency_settings table
ALTER TABLE currency_settings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE currency_settings ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE currency_settings ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add soft delete columns to app_settings table
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add soft delete columns to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add soft delete columns to employee_adjustments table
ALTER TABLE employee_adjustments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE employee_adjustments ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE employee_adjustments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add soft delete columns to salary_payments table
ALTER TABLE salary_payments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE salary_payments ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE salary_payments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add soft delete columns to transaction_inventory_items table
ALTER TABLE transaction_inventory_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE transaction_inventory_items ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE transaction_inventory_items ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add soft delete columns to report_templates table
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add soft delete columns to report_field_metadata table
ALTER TABLE report_field_metadata ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE report_field_metadata ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE report_field_metadata ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Create indexes for soft delete columns
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_deleted_by ON users(deleted_by);
CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users(is_deleted);

CREATE INDEX IF NOT EXISTS idx_branches_deleted_at ON branches(deleted_at);
CREATE INDEX IF NOT EXISTS idx_branches_deleted_by ON branches(deleted_by);
CREATE INDEX IF NOT EXISTS idx_branches_is_deleted ON branches(is_deleted);

CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at ON transactions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_transactions_is_deleted ON transactions(is_deleted);

CREATE INDEX IF NOT EXISTS idx_contacts_deleted_at ON contacts(deleted_at);
CREATE INDEX IF NOT EXISTS idx_contacts_is_deleted ON contacts(is_deleted);

CREATE INDEX IF NOT EXISTS idx_accounts_payable_deleted_at ON accounts_payable(deleted_at);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_is_deleted ON accounts_payable(is_deleted);

CREATE INDEX IF NOT EXISTS idx_accounts_receivable_deleted_at ON accounts_receivable(deleted_at);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_is_deleted ON accounts_receivable(is_deleted);

CREATE INDEX IF NOT EXISTS idx_payable_payments_deleted_at ON payable_payments(deleted_at);
CREATE INDEX IF NOT EXISTS idx_payable_payments_is_deleted ON payable_payments(is_deleted);

CREATE INDEX IF NOT EXISTS idx_receivable_payments_deleted_at ON receivable_payments(deleted_at);
CREATE INDEX IF NOT EXISTS idx_receivable_payments_is_deleted ON receivable_payments(is_deleted);

CREATE INDEX IF NOT EXISTS idx_discount_reasons_deleted_at ON discount_reasons(deleted_at);
CREATE INDEX IF NOT EXISTS idx_discount_reasons_is_deleted ON discount_reasons(is_deleted);

CREATE INDEX IF NOT EXISTS idx_inventory_items_deleted_at ON inventory_items(deleted_at);
CREATE INDEX IF NOT EXISTS idx_inventory_items_is_deleted ON inventory_items(is_deleted);

CREATE INDEX IF NOT EXISTS idx_inventory_consumption_deleted_at ON inventory_consumption(deleted_at);
CREATE INDEX IF NOT EXISTS idx_inventory_consumption_is_deleted ON inventory_consumption(is_deleted);

CREATE INDEX IF NOT EXISTS idx_notifications_deleted_at ON notifications(deleted_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_deleted ON notifications(is_deleted);

CREATE INDEX IF NOT EXISTS idx_notification_settings_deleted_at ON notification_settings(deleted_at);
CREATE INDEX IF NOT EXISTS idx_notification_settings_is_deleted ON notification_settings(is_deleted);

CREATE INDEX IF NOT EXISTS idx_currency_settings_deleted_at ON currency_settings(deleted_at);
CREATE INDEX IF NOT EXISTS idx_currency_settings_is_deleted ON currency_settings(is_deleted);

CREATE INDEX IF NOT EXISTS idx_app_settings_deleted_at ON app_settings(deleted_at);
CREATE INDEX IF NOT EXISTS idx_app_settings_is_deleted ON app_settings(is_deleted);

CREATE INDEX IF NOT EXISTS idx_employees_deleted_at ON employees(deleted_at);
CREATE INDEX IF NOT EXISTS idx_employees_is_deleted ON employees(is_deleted);

CREATE INDEX IF NOT EXISTS idx_employee_adjustments_deleted_at ON employee_adjustments(deleted_at);
CREATE INDEX IF NOT EXISTS idx_employee_adjustments_is_deleted ON employee_adjustments(is_deleted);

CREATE INDEX IF NOT EXISTS idx_salary_payments_deleted_at ON salary_payments(deleted_at);
CREATE INDEX IF NOT EXISTS idx_salary_payments_is_deleted ON salary_payments(is_deleted);

CREATE INDEX IF NOT EXISTS idx_transaction_inventory_items_deleted_at ON transaction_inventory_items(deleted_at);
CREATE INDEX IF NOT EXISTS idx_transaction_inventory_items_is_deleted ON transaction_inventory_items(is_deleted);

CREATE INDEX IF NOT EXISTS idx_report_templates_deleted_at ON report_templates(deleted_at);
CREATE INDEX IF NOT EXISTS idx_report_templates_is_deleted ON report_templates(is_deleted);

CREATE INDEX IF NOT EXISTS idx_report_field_metadata_deleted_at ON report_field_metadata(deleted_at);
CREATE INDEX IF NOT EXISTS idx_report_field_metadata_is_deleted ON report_field_metadata(is_deleted);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_deleted_at ON refresh_tokens(deleted_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_is_deleted ON refresh_tokens(is_deleted);
