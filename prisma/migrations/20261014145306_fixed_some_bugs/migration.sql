/*
  Warnings:

  - A unique constraint covering the columns `[userId,country,city,addressLine,postalCode]` on the table `Address` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Address_postalCode_key";

-- CreateIndex
CREATE UNIQUE INDEX "Address_userId_country_city_addressLine_postalCode_key" ON "Address"("userId", "country", "city", "addressLine", "postalCode");
