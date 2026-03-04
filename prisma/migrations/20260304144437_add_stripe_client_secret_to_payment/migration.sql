-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shippingRates" JSONB;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "stripeClientSecret" TEXT;
