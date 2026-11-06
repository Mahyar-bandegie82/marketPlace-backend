/*
  Warnings:

  - You are about to drop the column `discountPercent` on the `OrderItems` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OrderItems" DROP COLUMN "discountPercent";

-- AlterTable
ALTER TABLE "SellerInventory" ADD COLUMN     "discountedPrice" INTEGER NOT NULL DEFAULT 0;
