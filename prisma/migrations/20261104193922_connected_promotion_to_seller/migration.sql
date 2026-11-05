/*
  Warnings:

  - Added the required column `sellerId` to the `Promotions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Promotions" ADD COLUMN     "sellerId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Promotions" ADD CONSTRAINT "Promotions_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
