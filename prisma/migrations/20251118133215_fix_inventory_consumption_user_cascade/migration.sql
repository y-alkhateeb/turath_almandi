-- Fix InventoryConsumption.recorder foreign key to use ON DELETE RESTRICT
-- This ensures users who have recorded consumption records cannot be deleted

-- Drop the existing foreign key constraint
ALTER TABLE "inventory_consumption" 
  DROP CONSTRAINT IF EXISTS "inventory_consumption_recorded_by_fkey";

-- Re-create the foreign key with ON DELETE RESTRICT
ALTER TABLE "inventory_consumption" 
  ADD CONSTRAINT "inventory_consumption_recorded_by_fkey" 
  FOREIGN KEY ("recorded_by") 
  REFERENCES "users"("id") 
  ON DELETE RESTRICT 
  ON UPDATE CASCADE;

-- Add comment for documentation
COMMENT ON CONSTRAINT "inventory_consumption_recorded_by_fkey" ON "inventory_consumption" 
  IS 'Prevents deletion of users who have recorded inventory consumption records';
