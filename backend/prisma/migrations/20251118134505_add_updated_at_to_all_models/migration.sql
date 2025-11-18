-- AlterTable: Add updatedAt timestamp to models that were missing it
-- This ensures all models have consistent timestamp tracking (createdAt + updatedAt)

-- Add updated_at to RefreshToken
ALTER TABLE "refresh_tokens"
  ADD COLUMN "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add updated_at to DebtPayment
ALTER TABLE "debt_payments"
  ADD COLUMN "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add updated_at to InventoryConsumption
ALTER TABLE "inventory_consumption"
  ADD COLUMN "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add updated_at to Notification
ALTER TABLE "notifications"
  ADD COLUMN "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add updated_at to AuditLog
ALTER TABLE "audit_log"
  ADD COLUMN "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
