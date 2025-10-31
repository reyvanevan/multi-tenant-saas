import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDuplicates() {
  try {
    console.log(
      '🔍 Checking for duplicate [tenantId, feature] combinations...\n',
    );

    // Get all tenant entitlements
    const entitlements = await prisma.$queryRaw<any[]>`
      SELECT "tenantId", feature, COUNT(*) as count
      FROM tenant_entitlements
      GROUP BY "tenantId", feature
      HAVING COUNT(*) > 1
    `;

    if (entitlements.length === 0) {
      console.log('✅ No duplicates found! Safe to proceed with migration.');
      return;
    }

    console.log(`❌ Found ${entitlements.length} duplicate combinations:\n`);
    entitlements.forEach((row) => {
      console.log(
        `  - Tenant: ${row.tenantId}, Feature: ${row.feature}, Count: ${row.count}`,
      );
    });

    // Get detailed info about duplicates
    console.log('\n📋 Detailed duplicate records:\n');
    for (const dup of entitlements) {
      const records = await prisma.$queryRaw<any[]>`
        SELECT id, "tenantId", feature, "createdAt", "updatedAt"
        FROM tenant_entitlements
        WHERE "tenantId" = ${dup.tenantId} AND feature = ${dup.feature}
        ORDER BY "createdAt" DESC
      `;

      console.log(`\n  Tenant: ${dup.tenantId}, Feature: ${dup.feature}`);
      records.forEach((rec, idx) => {
        console.log(
          `    ${idx + 1}. ID: ${rec.id}, Created: ${rec.createdAt}, Updated: ${rec.updatedAt}`,
        );
      });
    }
  } catch (error) {
    console.error('❌ Error checking duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicates();
