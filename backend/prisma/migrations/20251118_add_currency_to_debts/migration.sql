-- AlterTable debts: Add currency column with default USD
ALTER TABLE "debts" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';

-- AlterTable debt_payments: Add currency column with default USD
ALTER TABLE "debt_payments" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';
