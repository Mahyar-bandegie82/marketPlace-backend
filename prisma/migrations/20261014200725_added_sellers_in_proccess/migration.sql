-- CreateTable
CREATE TABLE "sellersInProcess" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "storeName" TEXT NOT NULL,

    CONSTRAINT "sellersInProcess_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sellersInProcess" ADD CONSTRAINT "sellersInProcess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
