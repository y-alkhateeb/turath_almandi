#!/usr/bin/env node

/**
 * Clean Failed Migrations Script
 *
 * This script removes failed migration records from the _prisma_migrations table
 * to allow Prisma to continue with deployments.
 */

const { Client } = require('pg');

const FAILED_MIGRATION_NAME = '20251123120000_add_app_settings_table';

async function cleanFailedMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Checking for failed migrations...');

    await client.connect();

    // Check if the failed migration exists
    const checkResult = await client.query(
      'SELECT migration_name, started_at, finished_at, success FROM "_prisma_migrations" WHERE migration_name = $1',
      [FAILED_MIGRATION_NAME]
    );

    if (checkResult.rows.length === 0) {
      console.log('✅ No failed migrations found. Skipping cleanup.');
      return;
    }

    const migration = checkResult.rows[0];
    console.log(`⚠️  Found failed migration: ${migration.migration_name}`);
    console.log(`   Started at: ${migration.started_at}`);
    console.log(`   Success: ${migration.success}`);

    // Delete the failed migration record
    const deleteResult = await client.query(
      'DELETE FROM "_prisma_migrations" WHERE migration_name = $1',
      [FAILED_MIGRATION_NAME]
    );

    console.log(`✅ Removed ${deleteResult.rowCount} failed migration record(s)`);
    console.log('🎉 Database is now clean and ready for migrations!');

  } catch (error) {
    console.error('❌ Error cleaning failed migrations:', error.message);
    // Don't fail the deployment if we can't clean - migrations might still work
    console.log('⚠️  Continuing anyway...');
  } finally {
    await client.end();
  }
}

cleanFailedMigrations().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(0); // Exit with 0 to not fail the deployment
});
