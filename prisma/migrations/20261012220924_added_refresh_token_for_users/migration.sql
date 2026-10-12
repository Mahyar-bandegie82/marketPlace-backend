-- AlterTable
ALTER TABLE "User" ADD COLUMN     "refreshToken" TEXT[] DEFAULT ARRAY[]::TEXT[];
