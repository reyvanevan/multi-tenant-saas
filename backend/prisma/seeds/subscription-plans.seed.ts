import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSubscriptionPlans() {
  console.log('🌱 Seeding subscription plans...\n');

  const plans = [
    {
      name: 'Starter',
      code: 'starter',
      description: 'Perfect for small businesses just getting started',
      monthlyPrice: 12900000, // Rp 129,000 (in cents)
      annualPrice: 129000000, // Rp 1,290,000 (save 2 months)
      features: [
        'barcode_scanner',
        'basic_reports',
      ],
      maxOutlets: 1,
      maxProducts: 100,
      maxUsers: 3,
      maxStorage: 1024, // 1GB
      isActive: true,
      isPublic: true,
    },
    {
      name: 'Business',
      code: 'business',
      description: 'For growing businesses with multiple features',
      monthlyPrice: 29900000, // Rp 299,000
      annualPrice: 299000000, // Rp 2,990,000
      features: [
        'barcode_scanner',
        'offline_pos',
        'kds',
        'custom_receipts',
        'advanced_inventory',
        'advanced_reports',
        'export_data',
        'email_notifications',
        'whatsapp_integration',
      ],
      maxOutlets: 3,
      maxProducts: 1000,
      maxUsers: 10,
      maxStorage: 5120, // 5GB
      isActive: true,
      isPublic: true,
    },
    {
      name: 'Pro',
      code: 'pro',
      description: 'Full-featured plan for established businesses',
      monthlyPrice: 59900000, // Rp 599,000
      annualPrice: 599000000, // Rp 5,990,000
      features: [
        'barcode_scanner',
        'offline_pos',
        'kds',
        'multi_outlet',
        'custom_receipts',
        'advanced_inventory',
        'batch_tracking',
        'advanced_reports',
        'export_data',
        'scheduled_reports',
        'email_notifications',
        'whatsapp_integration',
        'api_access',
        'priority_support',
        'dedicated_account_manager',
      ],
      maxOutlets: 999,
      maxProducts: 99999,
      maxUsers: 99,
      maxStorage: 10240, // 10GB
      isActive: true,
      isPublic: true,
    },
    {
      name: 'Enterprise',
      code: 'enterprise',
      description: 'Custom solutions for large organizations',
      monthlyPrice: 0, // Custom pricing
      annualPrice: 0,
      features: [
        'barcode_scanner',
        'offline_pos',
        'kds',
        'multi_outlet',
        'custom_receipts',
        'advanced_inventory',
        'batch_tracking',
        'koperasi_module',
        'member_savings',
        'member_loans',
        'advanced_reports',
        'export_data',
        'scheduled_reports',
        'email_notifications',
        'whatsapp_integration',
        'api_access',
        'priority_support',
        'dedicated_account_manager',
      ],
      maxOutlets: 9999,
      maxProducts: 999999,
      maxUsers: 999,
      maxStorage: 102400, // 100GB
      isActive: true,
      isPublic: false, // Contact sales
    },
  ];

  for (const plan of plans) {
    try {
      const created = await prisma.subscriptionPlan.upsert({
        where: { code: plan.code },
        create: plan,
        update: plan,
      });
      
      const monthlyPriceRp = (created.monthlyPrice / 10000).toLocaleString('id-ID');
      console.log(`✅ ${created.name} - Rp ${monthlyPriceRp}/bulan (${created.maxOutlets} outlet, ${created.maxProducts} produk)`);
    } catch (error) {
      console.error(`❌ Failed to seed ${plan.name}:`, error);
    }
  }

  console.log(`\n✨ Seeded ${plans.length} subscription plans!`);
}

async function main() {
  try {
    await seedSubscriptionPlans();
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
