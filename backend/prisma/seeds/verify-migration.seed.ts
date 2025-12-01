import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Migration Verification Script
 *
 * This script verifies that the data migration was successful by comparing:
 * 1. Count of migrated records
 * 2. Sum of amounts (original and remaining)
 * 3. Data integrity checks
 *
 * Run with: npx ts-node prisma/seeds/verify-migration.seed.ts
 */

async function main() {
  console.log('🔍 Starting migration verification...\n');

  let hasErrors = false;

  // ==========================================================================
  // CHECK 1: Verify transaction cleanup
  // ==========================================================================
  console.log('📊 CHECK 1: Verifying transaction cleanup...');

  const transactionCount = await prisma.transaction.count();
  const transactionInventoryItemCount = await prisma.transactionInventoryItem.count();
  const salaryPaymentCount = await prisma.salaryPayment.count();
  const bonusCount = await prisma.bonus.count();
  const advanceCount = await prisma.employeeAdvance.count();

  if (transactionCount === 0) {
    console.log('  ✅ All transactions deleted (complete clean slate)');
  } else {
    console.error(`  ❌ ERROR: Found ${transactionCount} transactions (should be 0)`);
    hasErrors = true;
  }

  if (transactionInventoryItemCount === 0) {
    console.log('  ✅ All transaction inventory items deleted');
  } else {
    console.error(`  ❌ ERROR: Found ${transactionInventoryItemCount} transaction inventory items (should be 0)`);
    hasErrors = true;
  }

  if (salaryPaymentCount === 0) {
    console.log('  ✅ All salary payments deleted');
  } else {
    console.error(`  ❌ ERROR: Found ${salaryPaymentCount} salary payments (should be 0)`);
    hasErrors = true;
  }

  if (bonusCount === 0) {
    console.log('  ✅ All bonuses deleted');
  } else {
    console.error(`  ❌ ERROR: Found ${bonusCount} bonuses (should be 0)`);
    hasErrors = true;
  }

  if (advanceCount === 0) {
    console.log('  ✅ All employee advances deleted');
  } else {
    console.error(`  ❌ ERROR: Found ${advanceCount} employee advances (should be 0)`);
    hasErrors = true;
  }

  console.log();

  // ==========================================================================
  // CHECK 2: Verify Contact count matches unique creditors
  // ==========================================================================
  console.log('📊 CHECK 2: Verifying Contact records...');

  const debtCount = await prisma.debt.count();
  const contactCount = await prisma.contact.count();

  // Count unique creditors in Debt table
  const uniqueCreditors = await prisma.debt.groupBy({
    by: ['creditorName', 'branchId'],
  });

  const expectedContactCount = uniqueCreditors.length;

  if (contactCount === expectedContactCount) {
    console.log(`  ✅ Contact count matches unique creditors: ${contactCount}`);
  } else {
    console.error(`  ❌ ERROR: Contact count mismatch`);
    console.error(`     Expected: ${expectedContactCount} (unique creditors)`);
    console.error(`     Found: ${contactCount}`);
    hasErrors = true;
  }

  // Verify all contacts are SUPPLIER type (default as per user requirement)
  const nonSupplierContacts = await prisma.contact.count({
    where: {
      type: { not: 'SUPPLIER' },
    },
  });

  if (nonSupplierContacts === 0) {
    console.log('  ✅ All contacts are SUPPLIER type (default)');
  } else {
    console.warn(`  ⚠️  WARNING: Found ${nonSupplierContacts} non-SUPPLIER contacts`);
  }

  console.log();

  // ==========================================================================
  // CHECK 3: Verify AccountPayable count matches Debt count
  // ==========================================================================
  console.log('📊 CHECK 3: Verifying AccountPayable records...');

  const payableCount = await prisma.accountPayable.count();

  if (payableCount === debtCount) {
    console.log(`  ✅ AccountPayable count matches Debt count: ${payableCount}`);
  } else {
    console.error(`  ❌ ERROR: AccountPayable count mismatch`);
    console.error(`     Expected: ${debtCount} (debt records)`);
    console.error(`     Found: ${payableCount}`);
    hasErrors = true;
  }

  console.log();

  // ==========================================================================
  // CHECK 4: Verify amount sums match
  // ==========================================================================
  console.log('📊 CHECK 4: Verifying amount totals...');

  // Sum of original amounts in Debt table
  const debtOriginalSum = await prisma.debt.aggregate({
    _sum: { originalAmount: true },
  });

  // Sum of original amounts in AccountPayable table
  const payableOriginalSum = await prisma.accountPayable.aggregate({
    _sum: { originalAmount: true },
  });

  const debtTotal = debtOriginalSum._sum.originalAmount?.toNumber() || 0;
  const payableTotal = payableOriginalSum._sum.originalAmount?.toNumber() || 0;

  if (Math.abs(debtTotal - payableTotal) < 0.01) {
    console.log(`  ✅ Original amount totals match: ${debtTotal.toFixed(2)}`);
  } else {
    console.error(`  ❌ ERROR: Original amount mismatch`);
    console.error(`     Debt total: ${debtTotal.toFixed(2)}`);
    console.error(`     Payable total: ${payableTotal.toFixed(2)}`);
    console.error(`     Difference: ${Math.abs(debtTotal - payableTotal).toFixed(2)}`);
    hasErrors = true;
  }

  // Sum of remaining amounts in Debt table
  const debtRemainingSum = await prisma.debt.aggregate({
    _sum: { remainingAmount: true },
  });

  // Sum of remaining amounts in AccountPayable table
  const payableRemainingSum = await prisma.accountPayable.aggregate({
    _sum: { remainingAmount: true },
  });

  const debtRemainingTotal = debtRemainingSum._sum.remainingAmount?.toNumber() || 0;
  const payableRemainingTotal = payableRemainingSum._sum.remainingAmount?.toNumber() || 0;

  if (Math.abs(debtRemainingTotal - payableRemainingTotal) < 0.01) {
    console.log(`  ✅ Remaining amount totals match: ${debtRemainingTotal.toFixed(2)}`);
  } else {
    console.error(`  ❌ ERROR: Remaining amount mismatch`);
    console.error(`     Debt total: ${debtRemainingTotal.toFixed(2)}`);
    console.error(`     Payable total: ${payableRemainingTotal.toFixed(2)}`);
    console.error(`     Difference: ${Math.abs(debtRemainingTotal - payableRemainingTotal).toFixed(2)}`);
    hasErrors = true;
  }

  console.log();

  // ==========================================================================
  // CHECK 5: Verify PayablePayment count matches DebtPayment count
  // ==========================================================================
  console.log('📊 CHECK 5: Verifying PayablePayment records...');

  const debtPaymentCount = await prisma.debtPayment.count();
  const payablePaymentCount = await prisma.payablePayment.count();

  if (payablePaymentCount === debtPaymentCount) {
    console.log(`  ✅ PayablePayment count matches DebtPayment count: ${payablePaymentCount}`);
  } else {
    console.error(`  ❌ ERROR: PayablePayment count mismatch`);
    console.error(`     Expected: ${debtPaymentCount} (debt payment records)`);
    console.error(`     Found: ${payablePaymentCount}`);
    hasErrors = true;
  }

  console.log();

  // ==========================================================================
  // CHECK 6: Verify payment amount sums match
  // ==========================================================================
  console.log('📊 CHECK 6: Verifying payment amount totals...');

  const debtPaymentSum = await prisma.debtPayment.aggregate({
    _sum: { amountPaid: true },
  });

  const payablePaymentSum = await prisma.payablePayment.aggregate({
    _sum: { amountPaid: true },
  });

  const debtPaymentTotal = debtPaymentSum._sum.amountPaid?.toNumber() || 0;
  const payablePaymentTotal = payablePaymentSum._sum.amountPaid?.toNumber() || 0;

  if (Math.abs(debtPaymentTotal - payablePaymentTotal) < 0.01) {
    console.log(`  ✅ Payment amount totals match: ${debtPaymentTotal.toFixed(2)}`);
  } else {
    console.error(`  ❌ ERROR: Payment amount mismatch`);
    console.error(`     DebtPayment total: ${debtPaymentTotal.toFixed(2)}`);
    console.error(`     PayablePayment total: ${payablePaymentTotal.toFixed(2)}`);
    console.error(`     Difference: ${Math.abs(debtPaymentTotal - payablePaymentTotal).toFixed(2)}`);
    hasErrors = true;
  }

  console.log();

  // ==========================================================================
  // CHECK 7: Verify no orphaned records
  // ==========================================================================
  console.log('📊 CHECK 7: Verifying data integrity (no orphans)...');

  // Check for PayablePayments with invalid payableId
  const allPayableIds = (await prisma.accountPayable.findMany({ select: { id: true } })).map(p => p.id);
  let orphanedPayablePayments = 0;

  if (allPayableIds.length > 0) {
    orphanedPayablePayments = await prisma.payablePayment.count({
      where: {
        payableId: {
          notIn: allPayableIds,
        },
      },
    });
  } else {
    // If there are no payables, all payments should be orphaned (error condition)
    orphanedPayablePayments = await prisma.payablePayment.count();
  }

  if (orphanedPayablePayments === 0) {
    console.log('  ✅ No orphaned PayablePayment records');
  } else {
    console.error(`  ❌ ERROR: Found ${orphanedPayablePayments} orphaned PayablePayment records`);
    hasErrors = true;
  }

  // Check for AccountPayables with invalid contactId
  const allContactIds = (await prisma.contact.findMany({ select: { id: true } })).map(c => c.id);
  let orphanedPayables = 0;

  if (allContactIds.length > 0) {
    orphanedPayables = await prisma.accountPayable.count({
      where: {
        contactId: {
          notIn: allContactIds,
        },
      },
    });
  } else {
    // If there are no contacts, all payables should be orphaned (error condition)
    orphanedPayables = await prisma.accountPayable.count();
  }

  if (orphanedPayables === 0) {
    console.log('  ✅ No orphaned AccountPayable records');
  } else {
    console.error(`  ❌ ERROR: Found ${orphanedPayables} orphaned AccountPayable records`);
    hasErrors = true;
  }

  console.log();

  // ==========================================================================
  // VERIFICATION SUMMARY
  // ==========================================================================
  console.log('📊 VERIFICATION SUMMARY:');
  console.log('='.repeat(60));

  if (hasErrors) {
    console.error('❌ VERIFICATION FAILED - Migration has errors!');
    console.error('   Please review the errors above and re-run the migration.');
    process.exit(1);
  } else {
    console.log('✅ ALL CHECKS PASSED - Migration successful!');
    console.log();
    console.log('📋 Migration Statistics:');
    console.log(`   Transactions deleted: ALL (complete clean slate)`);
    console.log(`   Contacts created: ${contactCount}`);
    console.log(`   Debts migrated: ${debtCount} -> ${payableCount} AccountPayable`);
    console.log(`   Payments migrated: ${debtPaymentCount} -> ${payablePaymentCount} PayablePayment`);
    console.log(`   Original amount: ${debtTotal.toFixed(2)}`);
    console.log(`   Remaining amount: ${debtRemainingTotal.toFixed(2)}`);
    console.log(`   Payment amount: ${debtPaymentTotal.toFixed(2)}`);
    console.log();
    console.log('⚠️  NEXT STEPS:');
    console.log('   1. Manually drop old Debt and DebtPayment tables (after backup)');
    console.log('   2. Update backend services to use Contact/AccountPayable models');
    console.log('   3. Update frontend to use new API endpoints');
  }
}

main()
  .catch((e) => {
    console.error('❌ Verification failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
