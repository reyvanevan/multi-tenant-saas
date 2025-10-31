import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedFeatureFlags() {
  console.log('🌱 Seeding feature flags...\n');

  const features = [
    // POS Features
    {
      key: 'offline_pos',
      name: 'Offline POS',
      description: 'Enable offline point of sale functionality',
      category: 'pos',
      enabled: true,
      plans: ['business', 'pro'],
      rolloutPercentage: 100,
      metadata: {
        icon: 'wifi-off',
        tier: 'business',
      },
    },
    {
      key: 'kds',
      name: 'Kitchen Display System',
      description: 'Kitchen order management display',
      category: 'pos',
      enabled: true,
      plans: ['business', 'pro'],
      rolloutPercentage: 100,
      metadata: {
        icon: 'chef-hat',
        tier: 'business',
      },
    },
    {
      key: 'multi_outlet',
      name: 'Multi-Outlet Management',
      description: 'Manage multiple store locations',
      category: 'pos',
      enabled: true,
      plans: ['pro'],
      rolloutPercentage: 100,
      metadata: {
        icon: 'building',
        tier: 'pro',
      },
    },
    {
      key: 'custom_receipts',
      name: 'Custom Receipt Templates',
      description: 'Design custom receipt layouts',
      category: 'pos',
      enabled: true,
      plans: ['business', 'pro'],
      rolloutPercentage: 100,
      metadata: {
        icon: 'receipt',
        tier: 'business',
      },
    },

    // Inventory Features
    {
      key: 'advanced_inventory',
      name: 'Advanced Inventory',
      description: 'Stock tracking, forecasting, and reorder points',
      category: 'inventory',
      enabled: true,
      plans: ['business', 'pro'],
      rolloutPercentage: 100,
      metadata: {
        icon: 'warehouse',
        tier: 'business',
      },
    },
    {
      key: 'batch_tracking',
      name: 'Batch & Expiry Tracking',
      description: 'Track product batches and expiration dates',
      category: 'inventory',
      enabled: true,
      plans: ['pro'],
      rolloutPercentage: 100,
      metadata: {
        icon: 'calendar-clock',
        tier: 'pro',
      },
    },
    {
      key: 'barcode_scanner',
      name: 'Barcode Scanner',
      description: 'Scan barcodes for products',
      category: 'inventory',
      enabled: true,
      plans: ['starter', 'business', 'pro'],
      rolloutPercentage: 100,
      metadata: {
        icon: 'scan',
        tier: 'starter',
      },
    },

    // Koperasi Features
    {
      key: 'koperasi_module',
      name: 'Koperasi Management',
      description: 'Full cooperative management suite',
      category: 'koperasi',
      enabled: true,
      plans: ['pro'],
      rolloutPercentage: 100,
      metadata: {
        icon: 'users',
        tier: 'pro',
        priority: 'high',
      },
    },
    {
      key: 'member_savings',
      name: 'Member Savings Accounts',
      description: 'Manage member savings and deposits',
      category: 'koperasi',
      enabled: true,
      plans: ['pro'],
      rolloutPercentage: 100,
      metadata: {
        icon: 'piggy-bank',
        tier: 'pro',
      },
    },
    {
      key: 'member_loans',
      name: 'Member Loans',
      description: 'Loan management and tracking',
      category: 'koperasi',
      enabled: true,
      plans: ['pro'],
      rolloutPercentage: 100,
      metadata: {
        icon: 'hand-coins',
        tier: 'pro',
      },
    },

    // Reporting Features
    {
      key: 'advanced_reports',
      name: 'Advanced Reports',
      description: 'Custom reports and analytics',
      category: 'reporting',
      enabled: true,
      plans: ['business', 'pro'],
      rolloutPercentage: 100,
      metadata: {
        icon: 'chart-bar',
        tier: 'business',
      },
    },
    {
      key: 'export_data',
      name: 'Data Export',
      description: 'Export data to Excel, PDF, CSV',
      category: 'reporting',
      enabled: true,
      plans: ['business', 'pro'],
      rolloutPercentage: 100,
      metadata: {
        icon: 'download',
        tier: 'business',
      },
    },
    {
      key: 'scheduled_reports',
      name: 'Scheduled Reports',
      description: 'Auto-generate and email reports',
      category: 'reporting',
      enabled: true,
      plans: ['pro'],
      rolloutPercentage: 100,
      metadata: {
        icon: 'calendar-send',
        tier: 'pro',
      },
    },

    // Integration Features
    {
      key: 'api_access',
      name: 'API Access',
      description: 'REST API for integrations',
      category: 'integration',
      enabled: true,
      plans: ['pro'],
      rolloutPercentage: 100,
      metadata: {
        icon: 'code',
        tier: 'pro',
      },
    },
    {
      key: 'whatsapp_integration',
      name: 'WhatsApp Integration',
      description: 'Send receipts and notifications via WhatsApp',
      category: 'integration',
      enabled: true,
      plans: ['business', 'pro'],
      rolloutPercentage: 50, // Gradual rollout
      rolloutTenants: [], // Beta testing
      metadata: {
        icon: 'message-circle',
        tier: 'business',
        beta: true,
      },
    },
    {
      key: 'email_notifications',
      name: 'Email Notifications',
      description: 'Automated email notifications',
      category: 'integration',
      enabled: true,
      plans: ['business', 'pro'],
      rolloutPercentage: 100,
      metadata: {
        icon: 'mail',
        tier: 'business',
      },
    },

    // Support Features
    {
      key: 'priority_support',
      name: 'Priority Support',
      description: '24/7 priority customer support',
      category: 'support',
      enabled: true,
      plans: ['pro'],
      rolloutPercentage: 100,
      metadata: {
        icon: 'headset',
        tier: 'pro',
      },
    },
    {
      key: 'dedicated_account_manager',
      name: 'Dedicated Account Manager',
      description: 'Personal account manager',
      category: 'support',
      enabled: true,
      plans: ['pro'],
      rolloutPercentage: 100,
      metadata: {
        icon: 'user-check',
        tier: 'pro',
      },
    },
  ];

  for (const feature of features) {
    try {
      const created = await prisma.featureFlag.upsert({
        where: { key: feature.key },
        create: feature,
        update: feature,
      });
      console.log(`✅ ${created.name} (${created.key})`);
    } catch (error) {
      console.error(`❌ Failed to seed ${feature.key}:`, error);
    }
  }

  console.log(`\n✨ Seeded ${features.length} feature flags!`);
}

async function main() {
  try {
    await seedFeatureFlags();
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
