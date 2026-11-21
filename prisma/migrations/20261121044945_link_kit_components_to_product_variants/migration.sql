/*
  Warnings:

  - A unique constraint covering the columns `[productVariantId]` on the table `KitComponent` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "KitComponent" ADD COLUMN     "productVariantId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "KitComponent_productVariantId_key" ON "KitComponent"("productVariantId");

-- AddForeignKey
ALTER TABLE "KitComponent" ADD CONSTRAINT "KitComponent_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
