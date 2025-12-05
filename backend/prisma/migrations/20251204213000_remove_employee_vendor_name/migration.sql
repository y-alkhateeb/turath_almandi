-- Migration: Remove employee_vendor_name column from transactions table
-- This field was deprecated and is no longer used

-- Drop the column
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "employee_vendor_name";
