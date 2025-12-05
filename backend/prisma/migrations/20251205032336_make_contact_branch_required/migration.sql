-- Migration: Make contact branch_id required (NOT NULL)
-- This migration ensures all contacts are linked to a branch

-- First, check if there are any contacts without a branch_id
-- If there are, they need to be handled before applying the constraint
-- For now, we'll delete any contacts without a branch_id (soft-deleted ones are fine)
-- In production, you may want to assign them to a default branch instead

-- Delete any contacts that don't have a branch_id and are not already deleted
DELETE FROM "contacts" 
WHERE "branch_id" IS NULL 
  AND "is_deleted" = false;

-- Now make branch_id NOT NULL
ALTER TABLE "contacts" 
  ALTER COLUMN "branch_id" SET NOT NULL;

-- Update the foreign key constraint to use Restrict instead of SetNull
-- First, drop the existing foreign key constraint
ALTER TABLE "contacts" 
  DROP CONSTRAINT IF EXISTS "contacts_branch_id_fkey";

-- Recreate the foreign key with Restrict on delete
ALTER TABLE "contacts" 
  ADD CONSTRAINT "contacts_branch_id_fkey" 
  FOREIGN KEY ("branch_id") 
  REFERENCES "branches"("id") 
  ON DELETE RESTRICT;
