-- Remove the failed migration record from _prisma_migrations table
-- This allows Prisma to continue with migrations normally

DELETE FROM "_prisma_migrations"
WHERE migration_name = '20251123120000_add_app_settings_table';

-- Verify the deletion
SELECT migration_name, started_at, finished_at, success
FROM "_prisma_migrations"
ORDER BY started_at DESC
LIMIT 5;
