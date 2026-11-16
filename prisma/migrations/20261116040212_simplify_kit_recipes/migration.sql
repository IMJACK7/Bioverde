/*
  Warnings:

  - You are about to drop the column `productId` on the `KitRecipeItem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `KitComponent` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `KitComponent` table without a default value. This is not possible if the table is not empty.
  - Made the column `variantId` on table `KitRecipeItem` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "KitRecipeItem" DROP CONSTRAINT "KitRecipeItem_productId_fkey";

-- DropIndex
DROP INDEX "KitRecipeItem_productId_idx";

-- AlterTable
ALTER TABLE "KitComponent" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "KitRecipeItem" DROP COLUMN "productId",
ALTER COLUMN "variantId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "KitComponent_slug_key" ON "KitComponent"("slug");

-- CreateIndex
CREATE INDEX "KitRecipeItem_componentId_idx" ON "KitRecipeItem"("componentId");
