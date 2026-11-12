/*
  Warnings:

  - You are about to drop the column `listingId` on the `Comment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[productId,clientId]` on the table `Comment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `productId` to the `Comment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_listingId_fkey";

-- DropIndex
DROP INDEX "Comment_listingId_clientId_key";

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "listingId",
ADD COLUMN     "productId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Comment_productId_clientId_key" ON "Comment"("productId", "clientId");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
