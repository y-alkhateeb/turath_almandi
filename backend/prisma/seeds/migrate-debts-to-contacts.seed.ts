import { PrismaClient, ContactType, DebtStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Data Migration Seed Script
 *
 * This script performs the comprehensive refactoring data migration:
 * 1. Deletes ALL existing transactions (complete clean slate per user request)
 * 2. Migrates Debt records to Contact + AccountPayable entities
 * 3. Migrates DebtPayment records to PayablePayment entities
 * 4. Preserves all timestamps and audit data
 *
 * IMPORTANT: This is a ONE-TIME migration script.
 * Run with: npx ts-node prisma/seeds/migrate-debts-to-contacts.seed.ts
 */

async function main() {
  console.log('🚀 Starting comprehensive refactoring data migration...\n');

  // ==========================================================================
  // STEP 1: Delete ALL existing transactions (complete clean slate)
  // ==========================================================================
  console.log('📊 STEP 1: Deleting all existing transactions...');

  try {
    // Delete in correct order to respect foreign key constraints
    const deletedTransactionInventoryItems = await prisma.transactionInventoryItem.deleteMany({});
    console.log(`  ✅ Deleted ${deletedTransactionInventoryItems.count} transaction inventory items`);

    const deletedAdvanceDeductions = await prisma.advanceDeduction.deleteMany({});
    console.log(`  ✅ Deleted ${deletedAdvanceDeductions.count} advance deductions`);

    const deletedSalaryPayments = await prisma.salaryPayment.deleteMany({});
    console.log(`  ✅ Deleted ${deletedSalaryPayments.count} salary payments`);

    const deletedBonuses = await prisma.bonus.deleteMany({});
    console.log(`  ✅ Deleted ${deletedBonuses.count} bonuses`);

    const deletedAdvances = await prisma.employeeAdvance.deleteMany({});
    console.log(`  ✅ Deleted ${deletedAdvances.count} employee advances`);

    const deletedTransactions = await prisma.transaction.deleteMany({});
    console.log(`  ✅ Deleted ${deletedTransactions.count} transactions`);

    console.log('  ✅ All transactions deleted successfully!\n');
  } catch (error) {
    console.error('  ❌ Error deleting transactions:', error);
    throw error;
  }

  // ==========================================================================
  // STEP 2: Extract unique creditors from Debt table
  // ==========================================================================
  console.log('📊 STEP 2: Extracting unique creditors from Debt table...');

  const debts = await prisma.debt.findMany({
    include: {
      branch: true,
      creator: true,
    },
  });

  console.log(`  Found ${debts.length} debt records`);

  // Extract unique creditor names
  const uniqueCreditors = new Map<string, {
    name: string;
    branchId: string | null;
    createdBy: string;
    createdAt: Date;
  }>();

  debts.forEach((debt) => {
    const key = `${debt.creditorName}_${debt.branchId || 'null'}`;
    if (!uniqueCreditors.has(key)) {
      uniqueCreditors.set(key, {
        name: debt.creditorName,
        branchId: debt.branchId,
        createdBy: debt.createdBy,
        createdAt: debt.createdAt,
      });
    }
  });

  console.log(`  Found ${uniqueCreditors.size} unique creditors\n`);

  // ==========================================================================
  // STEP 3: Create Contact records for each unique creditor
  // ==========================================================================
  console.log('📊 STEP 3: Creating Contact records...');

  const contactMap = new Map<string, string>(); // Maps creditorName_branchId -> contactId

  for (const [key, creditor] of uniqueCreditors.entries()) {
    const contact = await prisma.contact.create({
      data: {
        name: creditor.name,
        type: ContactType.SUPPLIER, // Default to SUPPLIER as per user requirement
        branchId: creditor.branchId,
        createdBy: creditor.createdBy,
        createdAt: creditor.createdAt,
        isDeleted: false,
      },
    });

    contactMap.set(key, contact.id);
    console.log(`  ✅ Created contact: ${contact.name} (${contact.id})`);
  }

  console.log(`  Created ${contactMap.size} contacts\n`);

  // ==========================================================================
  // STEP 4: Migrate Debt records to AccountPayable
  // ==========================================================================
  console.log('📊 STEP 4: Migrating Debt records to AccountPayable...');

  const debtToPayableMap = new Map<string, string>(); // Maps debtId -> payableId

  for (const debt of debts) {
    const key = `${debt.creditorName}_${debt.branchId || 'null'}`;
    const contactId = contactMap.get(key);

    if (!contactId) {
      console.warn(`  ⚠️  No contact found for debt ${debt.id} (${debt.creditorName})`);
      continue;
    }

    const payable = await prisma.accountPayable.create({
      data: {
        contactId,
        originalAmount: debt.originalAmount,
        remainingAmount: debt.remainingAmount,
        date: debt.date,
        dueDate: debt.dueDate,
        status: debt.status,
        description: debt.notes || `Migrated from debt: ${debt.creditorName}`,
        branchId: debt.branchId,
        createdBy: debt.createdBy,
        createdAt: debt.createdAt,
        updatedAt: debt.updatedAt,
        deletedAt: debt.deletedAt,
      },
    });

    debtToPayableMap.set(debt.id, payable.id);
    console.log(`  ✅ Migrated debt ${debt.id} -> AccountPayable ${payable.id}`);
  }

  console.log(`  Migrated ${debtToPayableMap.size} debts to AccountPayable\n`);

  // ==========================================================================
  // STEP 5: Migrate DebtPayment records to PayablePayment
  // ==========================================================================
  console.log('📊 STEP 5: Migrating DebtPayment records to PayablePayment...');

  const debtPayments = await prisma.debtPayment.findMany({
    include: {
      debt: true,
    },
  });

  console.log(`  Found ${debtPayments.length} debt payment records`);

  let migratedPayments = 0;

  for (const payment of debtPayments) {
    const payableId = debtToPayableMap.get(payment.debtId);

    if (!payableId) {
      console.warn(`  ⚠️  No payable found for debt payment ${payment.id} (debtId: ${payment.debtId})`);
      continue;
    }

    await prisma.payablePayment.create({
      data: {
        payableId,
        amountPaid: payment.amountPaid,
        paymentDate: payment.paymentDate,
        notes: payment.notes,
        recordedBy: payment.recordedBy,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        deletedAt: payment.deletedAt,
        deletedBy: payment.deletedBy,
        isDeleted: payment.isDeleted,
      },
    });

    migratedPayments++;
  }

  console.log(`  Migrated ${migratedPayments} debt payments to PayablePayment\n`);

  // ==========================================================================
  // STEP 6: Summary
  // ==========================================================================
  console.log('📊 MIGRATION SUMMARY:');
  console.log('  ✅ Deleted all transactions (complete clean slate)');
  console.log(`  ✅ Created ${contactMap.size} contacts`);
  console.log(`  ✅ Migrated ${debtToPayableMap.size} debts to AccountPayable`);
  console.log(`  ✅ Migrated ${migratedPayments} debt payments to PayablePayment`);
  console.log('\n✨ Data migration completed successfully!');
  console.log('\n⚠️  NEXT STEPS:');
  console.log('  1. Run verification script: npx ts-node prisma/seeds/verify-migration.seed.ts');
  console.log('  2. If verification passes, manually drop old Debt and DebtPayment tables');
  console.log('  3. Update backend services to use new Contact/AccountPayable models');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
