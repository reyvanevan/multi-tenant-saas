/*
  Warnings:

  - You are about to drop the column `feature` on the `tenant_entitlements` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tenantId,featureKey]` on the table `tenant_entitlements` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `featureKey` to the `tenant_entitlements` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."tenant_entitlements_tenantId_feature_key";

-- AlterTable
ALTER TABLE "tenant_entitlements" DROP COLUMN "feature",
ADD COLUMN     "config" JSONB,
ADD COLUMN     "featureKey" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "plans" TEXT[],
    "rolloutPercentage" INTEGER NOT NULL DEFAULT 100,
    "rolloutTenants" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_key" ON "feature_flags"("key");

-- CreateIndex
CREATE INDEX "feature_flags_key_idx" ON "feature_flags"("key");

-- CreateIndex
CREATE INDEX "feature_flags_enabled_idx" ON "feature_flags"("enabled");

-- CreateIndex
CREATE INDEX "tenant_entitlements_featureKey_idx" ON "tenant_entitlements"("featureKey");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_entitlements_tenantId_featureKey_key" ON "tenant_entitlements"("tenantId", "featureKey");
