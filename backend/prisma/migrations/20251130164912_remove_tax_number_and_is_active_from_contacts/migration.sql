-- AlterTable - Remove taxNumber and isActive from contacts
ALTER TABLE "contacts" DROP COLUMN IF EXISTS "tax_number";
ALTER TABLE "contacts" DROP COLUMN IF EXISTS "is_active";

-- Drop index on is_active if exists
DROP INDEX IF EXISTS "contacts_is_active_idx";
