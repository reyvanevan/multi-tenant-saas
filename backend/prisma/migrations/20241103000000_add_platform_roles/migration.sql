-- AlterTable User.tenantId to nullable
ALTER TABLE "users" ALTER COLUMN "tenantId" DROP NOT NULL;

-- AlterTable Role.tenantId to nullable  
ALTER TABLE "roles" ALTER COLUMN "tenantId" DROP NOT NULL;

-- Add index for null tenantId (platform users)
CREATE INDEX "users_tenantId_null_idx" ON "users"("tenantId") WHERE "tenantId" IS NULL;
CREATE INDEX "roles_tenantId_null_idx" ON "roles"("tenantId") WHERE "tenantId" IS NULL;
