/*
  Warnings:

  - You are about to drop the column `taxNumber` on the `contacts` table. All the data in the column will be lost.
  - Added the required column `subtotal` to the `transaction_inventory_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `transaction_inventory_items` table without a default value. This is not possible if the table is not empty.
  - Made the column `unit_price` on table `transaction_inventory_items` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "discount_type" AS ENUM ('PERCENTAGE', 'AMOUNT');

-- AlterTable
ALTER TABLE "contacts" DROP COLUMN "taxNumber";

-- AlterTable
ALTER TABLE "transaction_inventory_items" ADD COLUMN     "discount_type" "discount_type",
ADD COLUMN     "discount_value" DECIMAL(15,4),
ADD COLUMN     "subtotal" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "total" DECIMAL(15,2) NOT NULL,
ALTER COLUMN "unit_price" SET NOT NULL;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "discount_reason" VARCHAR(200),
ADD COLUMN     "discount_type" "discount_type",
ADD COLUMN     "discount_value" DECIMAL(15,4),
ADD COLUMN     "subtotal" DECIMAL(15,2);

-- CreateTable
CREATE TABLE "discount_reasons" (
    "id" UUID NOT NULL,
    "reason" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 999,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "discount_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "discount_reasons_reason_key" ON "discount_reasons"("reason");

-- CreateIndex
CREATE INDEX "discount_reasons_reason_idx" ON "discount_reasons"("reason");

-- CreateIndex
CREATE INDEX "discount_reasons_is_default_idx" ON "discount_reasons"("is_default");

-- CreateIndex
CREATE INDEX "discount_reasons_sort_order_idx" ON "discount_reasons"("sort_order");

-- CreateIndex
CREATE INDEX "discount_reasons_is_deleted_idx" ON "discount_reasons"("is_deleted");

-- CreateIndex
CREATE INDEX "discount_reasons_deleted_at_idx" ON "discount_reasons"("deleted_at");

-- CreateIndex
CREATE INDEX "transactions_discount_type_idx" ON "transactions"("discount_type");

-- CreateIndex
CREATE INDEX "transactions_discount_reason_idx" ON "transactions"("discount_reason");

-- AddForeignKey
ALTER TABLE "discount_reasons" ADD CONSTRAINT "discount_reasons_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
