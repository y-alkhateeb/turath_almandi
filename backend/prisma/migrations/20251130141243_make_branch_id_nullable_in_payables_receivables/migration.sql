-- AlterTable
ALTER TABLE "accounts_payable" ALTER COLUMN "branch_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "accounts_receivable" ALTER COLUMN "branch_id" DROP NOT NULL;