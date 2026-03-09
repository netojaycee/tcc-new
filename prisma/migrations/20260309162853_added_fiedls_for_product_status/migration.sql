-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "activeVariantCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "availabilityData" JSONB,
ADD COLUMN     "lastStockSync" TIMESTAMP(3);
