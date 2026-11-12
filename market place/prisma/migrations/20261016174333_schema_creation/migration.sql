-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CLIENT', 'SELLER');

-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('NEW', 'USED', 'BARELY_USED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELED', 'RETURNED', 'REFUNDED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "userName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "refreshToken" JSONB[],

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" SERIAL NOT NULL,
    "loyalCustomer" BOOLEAN NOT NULL DEFAULT false,
    "amountSpent" INTEGER NOT NULL DEFAULT 0,
    "userId" INTEGER NOT NULL,
    "Addresses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "postalCode" INTEGER,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seller" (
    "id" SERIAL NOT NULL,
    "storeName" TEXT NOT NULL,
    "trusted" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Seller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingCart" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,

    CONSTRAINT "ShoppingCart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerInventory" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "condition" "Condition" NOT NULL DEFAULT 'NEW',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sellerId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "productWaranty" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "SellerInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "productName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rating" DOUBLE PRECISION DEFAULT 0,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "images" JSONB NOT NULL DEFAULT '[]',
    "videos" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" SERIAL NOT NULL,
    "categoryName" TEXT NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "shoppingCartId" INTEGER NOT NULL,
    "sellerInventoryId" INTEGER NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavouriteProducts" (
    "clientId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "FavouriteProducts_pkey" PRIMARY KEY ("clientId","productId")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderStatus" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "paidAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "clientId" INTEGER NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItems" (
    "id" SERIAL NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "orderId" INTEGER NOT NULL,
    "listingId" INTEGER NOT NULL,

    CONSTRAINT "OrderItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "like" INTEGER NOT NULL DEFAULT 0,
    "dislike" INTEGER NOT NULL DEFAULT 0,
    "massage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "images" JSONB NOT NULL DEFAULT '[]',
    "videos" JSONB NOT NULL DEFAULT '[]',
    "listingId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionListing" (
    "id" SERIAL NOT NULL,
    "discount" INTEGER NOT NULL,
    "promotionId" INTEGER NOT NULL,
    "listingId" INTEGER NOT NULL,

    CONSTRAINT "PromotionListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProductToProductCategory" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ProductToProductCategory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_userId_key" ON "Admin"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_userId_key" ON "Client"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Seller_userId_key" ON "Seller"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingCart_clientId_key" ON "ShoppingCart"("clientId");

-- CreateIndex
CREATE INDEX "SellerInventory_productId_idx" ON "SellerInventory"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerInventory_sellerId_productId_condition_key" ON "SellerInventory"("sellerId", "productId", "condition");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_categoryName_key" ON "ProductCategory"("categoryName");

-- CreateIndex
CREATE INDEX "CartItem_sellerInventoryId_idx" ON "CartItem"("sellerInventoryId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_shoppingCartId_sellerInventoryId_key" ON "CartItem"("shoppingCartId", "sellerInventoryId");

-- CreateIndex
CREATE INDEX "FavouriteProducts_productId_idx" ON "FavouriteProducts"("productId");

-- CreateIndex
CREATE INDEX "Order_clientId_idx" ON "Order"("clientId");

-- CreateIndex
CREATE INDEX "OrderItems_listingId_idx" ON "OrderItems"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItems_orderId_listingId_key" ON "OrderItems"("orderId", "listingId");

-- CreateIndex
CREATE INDEX "Comment_clientId_idx" ON "Comment"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Comment_listingId_clientId_key" ON "Comment"("listingId", "clientId");

-- CreateIndex
CREATE INDEX "PromotionListing_listingId_idx" ON "PromotionListing"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionListing_promotionId_listingId_key" ON "PromotionListing"("promotionId", "listingId");

-- CreateIndex
CREATE INDEX "_ProductToProductCategory_B_index" ON "_ProductToProductCategory"("B");

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seller" ADD CONSTRAINT "Seller_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingCart" ADD CONSTRAINT "ShoppingCart_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerInventory" ADD CONSTRAINT "SellerInventory_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerInventory" ADD CONSTRAINT "SellerInventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_shoppingCartId_fkey" FOREIGN KEY ("shoppingCartId") REFERENCES "ShoppingCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_sellerInventoryId_fkey" FOREIGN KEY ("sellerInventoryId") REFERENCES "SellerInventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavouriteProducts" ADD CONSTRAINT "FavouriteProducts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavouriteProducts" ADD CONSTRAINT "FavouriteProducts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItems" ADD CONSTRAINT "OrderItems_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "SellerInventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItems" ADD CONSTRAINT "OrderItems_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "SellerInventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionListing" ADD CONSTRAINT "PromotionListing_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionListing" ADD CONSTRAINT "PromotionListing_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "SellerInventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToProductCategory" ADD CONSTRAINT "_ProductToProductCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToProductCategory" ADD CONSTRAINT "_ProductToProductCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
