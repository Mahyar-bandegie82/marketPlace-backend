/*
  Warnings:

  - A unique constraint covering the columns `[model,brand]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Product_model_brand_key" ON "Product"("model", "brand");
