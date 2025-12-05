-- Migration: Add is_internal_consumption field to inventory_items
-- This field marks items as internal consumption only (not for sale)

-- Add the column with default value (idempotent)
ALTER TABLE "inventory_items" 
ADD COLUMN IF NOT EXISTS "is_internal_consumption" BOOLEAN NOT NULL DEFAULT false;

-- Add index for filtering
CREATE INDEX IF NOT EXISTS "inventory_items_is_internal_consumption_idx" 
ON "inventory_items"("is_internal_consumption");
