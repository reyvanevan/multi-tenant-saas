-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'CONTEXT_SWITCHED';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastOutletId" TEXT,
ADD COLUMN     "lastTenantId" TEXT;
