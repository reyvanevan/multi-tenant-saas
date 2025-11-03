import { PrismaClient, Permission } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create Subscription Plans
  console.log('📦 Creating subscription plans...');
  const freePlan = await prisma.subscriptionPlan.upsert({
    where: { code: 'FREE' },
    update: {},
    create: {
      name: 'Free',
      code: 'FREE',
      description: 'Free plan for testing',
      monthlyPrice: 0,
      maxOutlets: 1,
      maxProducts: 50,
      maxUsers: 3,
      maxStorage: 512,
      features: ['pos', 'inventory'],
      isActive: true,
      isPublic: true,
    },
  });

  const basicPlan = await prisma.subscriptionPlan.upsert({
    where: { code: 'BASIC' },
    update: {},
    create: {
      name: 'Basic',
      code: 'BASIC',
      description: 'Basic plan for small business',
      monthlyPrice: 9900000, // Rp 99,000
      annualPrice: 99000000, // Rp 990,000 (save 10%)
      maxOutlets: 3,
      maxProducts: 500,
      maxUsers: 10,
      maxStorage: 5120, // 5GB
      features: ['pos', 'inventory', 'reports', 'multi-outlet'],
      isActive: true,
      isPublic: true,
    },
  });

  const proPlan = await prisma.subscriptionPlan.upsert({
    where: { code: 'PRO' },
    update: {},
    create: {
      name: 'Pro',
      code: 'PRO',
      description: 'Pro plan for growing business',
      monthlyPrice: 29900000, // Rp 299,000
      annualPrice: 299000000, // Rp 2,990,000 (save 17%)
      maxOutlets: 10,
      maxProducts: 5000,
      maxUsers: 50,
      maxStorage: 20480, // 20GB
      features: [
        'pos',
        'inventory',
        'reports',
        'multi-outlet',
        'api',
        'advanced-reports',
        'custom-branding',
      ],
      isActive: true,
      isPublic: true,
    },
  });

  console.log('✅ Subscription plans created');

  // Create Test Tenant
  console.log('🏢 Creating test tenant...');
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Koperasi',
      slug: 'demo',
      planId: proPlan.id,
      status: 'ACTIVE',
      planExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    },
  });

  // Create Subscription for Tenant
  await prisma.subscription.create({
    data: {
      tenantId: tenant.id,
      planId: proPlan.id,
      status: 'ACTIVE',
      amount: proPlan.monthlyPrice,
      billingCycle: 'MONTHLY',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    },
  });

  console.log('✅ Tenant created with Pro subscription');

  // Create Main Outlet
  console.log('🏪 Creating outlet...');
  const outlet = await prisma.outlet.upsert({
    where: {
      tenantId_code: {
        tenantId: tenant.id,
        code: 'MAIN',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Outlet Pusat',
      code: 'MAIN',
      type: 'RETAIL',
      address: 'Jl. Raya Demo No. 123',
      phone: '081234567890',
      isActive: true,
    },
  });

  console.log('✅ Outlet created');

  // Create Permissions
  console.log('🔐 Creating comprehensive permission registry...');
  const permissionsData = [
    // ========================================================================
    // USERS & ROLES
    // ========================================================================
    // Users - Tenant Level
    {
      code: 'users.read.tenant',
      resource: 'users',
      action: 'read',
      scope: 'tenant',
      description: 'View all users in tenant',
    },
    {
      code: 'users.create.tenant',
      resource: 'users',
      action: 'create',
      scope: 'tenant',
      description: 'Create users in tenant',
    },
    {
      code: 'users.update.tenant',
      resource: 'users',
      action: 'update',
      scope: 'tenant',
      description: 'Update users in tenant',
    },
    {
      code: 'users.delete.tenant',
      resource: 'users',
      action: 'delete',
      scope: 'tenant',
      description: 'Delete users in tenant',
    },
    // Users - Outlet Level
    {
      code: 'users.read.outlet',
      resource: 'users',
      action: 'read',
      scope: 'outlet',
      description: 'View users in own outlet',
    },
    // Roles
    {
      code: 'roles.read.tenant',
      resource: 'roles',
      action: 'read',
      scope: 'tenant',
      description: 'View roles',
    },
    {
      code: 'roles.create.tenant',
      resource: 'roles',
      action: 'create',
      scope: 'tenant',
      description: 'Create custom roles',
    },
    {
      code: 'roles.update.tenant',
      resource: 'roles',
      action: 'update',
      scope: 'tenant',
      description: 'Update roles',
    },
    {
      code: 'roles.delete.tenant',
      resource: 'roles',
      action: 'delete',
      scope: 'tenant',
      description: 'Delete custom roles',
    },

    // ========================================================================
    // OUTLETS
    // ========================================================================
    {
      code: 'outlets.read.tenant',
      resource: 'outlets',
      action: 'read',
      scope: 'tenant',
      description: 'View all outlets',
    },
    {
      code: 'outlets.create.tenant',
      resource: 'outlets',
      action: 'create',
      scope: 'tenant',
      description: 'Create outlets',
    },
    {
      code: 'outlets.update.tenant',
      resource: 'outlets',
      action: 'update',
      scope: 'tenant',
      description: 'Update outlets',
    },
    {
      code: 'outlets.delete.tenant',
      resource: 'outlets',
      action: 'delete',
      scope: 'tenant',
      description: 'Delete outlets',
    },

    // ========================================================================
    // PRODUCTS & CATEGORIES
    // ========================================================================
    // Products - Tenant Level
    {
      code: 'products.read.tenant',
      resource: 'products',
      action: 'read',
      scope: 'tenant',
      description: 'View all products in tenant',
    },
    {
      code: 'products.create.tenant',
      resource: 'products',
      action: 'create',
      scope: 'tenant',
      description: 'Create products',
    },
    {
      code: 'products.update.tenant',
      resource: 'products',
      action: 'update',
      scope: 'tenant',
      description: 'Update products',
    },
    {
      code: 'products.delete.tenant',
      resource: 'products',
      action: 'delete',
      scope: 'tenant',
      description: 'Delete products',
    },
    // Products - Outlet Level
    {
      code: 'products.read.outlet',
      resource: 'products',
      action: 'read',
      scope: 'outlet',
      description: 'View products in own outlet',
    },
    // Categories
    {
      code: 'categories.read.tenant',
      resource: 'categories',
      action: 'read',
      scope: 'tenant',
      description: 'View product categories',
    },
    {
      code: 'categories.manage.tenant',
      resource: 'categories',
      action: 'manage',
      scope: 'tenant',
      description: 'Manage product categories',
    },

    // ========================================================================
    // INVENTORY & STOCK
    // ========================================================================
    // Inventory - Tenant Level
    {
      code: 'inventory.read.tenant',
      resource: 'inventory',
      action: 'read',
      scope: 'tenant',
      description: 'View inventory across all outlets',
    },
    {
      code: 'inventory.manage.tenant',
      resource: 'inventory',
      action: 'manage',
      scope: 'tenant',
      description: 'Manage inventory settings',
    },
    // Inventory - Outlet Level
    {
      code: 'inventory.read.outlet',
      resource: 'inventory',
      action: 'read',
      scope: 'outlet',
      description: 'View inventory in own outlet',
    },
    {
      code: 'inventory.manage.outlet',
      resource: 'inventory',
      action: 'manage',
      scope: 'outlet',
      description: 'Manage inventory in own outlet',
    },
    // Stock Operations
    {
      code: 'stock.adjust.outlet',
      resource: 'stock',
      action: 'adjust',
      scope: 'outlet',
      description: 'Adjust stock levels',
    },
    {
      code: 'stock.transfer.outlet',
      resource: 'stock',
      action: 'transfer',
      scope: 'outlet',
      description: 'Transfer stock between outlets',
    },
    {
      code: 'stock.opname.outlet',
      resource: 'stock',
      action: 'opname',
      scope: 'outlet',
      description: 'Perform stock opname',
    },

    // ========================================================================
    // TRANSACTIONS (POS)
    // ========================================================================
    {
      code: 'transactions.read.outlet',
      resource: 'transactions',
      action: 'read',
      scope: 'outlet',
      description: 'View transactions in own outlet',
    },
    {
      code: 'transactions.read.tenant',
      resource: 'transactions',
      action: 'read',
      scope: 'tenant',
      description: 'View all transactions in tenant',
    },
    {
      code: 'transactions.create.outlet',
      resource: 'transactions',
      action: 'create',
      scope: 'outlet',
      description: 'Create new transactions (POS)',
    },
    {
      code: 'transactions.void.outlet',
      resource: 'transactions',
      action: 'void',
      scope: 'outlet',
      description: 'Void transactions',
    },
    {
      code: 'transactions.refund.outlet',
      resource: 'transactions',
      action: 'refund',
      scope: 'outlet',
      description: 'Process refunds',
    },

    // ========================================================================
    // SUPPLIERS
    // ========================================================================
    {
      code: 'suppliers.read.tenant',
      resource: 'suppliers',
      action: 'read',
      scope: 'tenant',
      description: 'View suppliers',
    },
    {
      code: 'suppliers.create.tenant',
      resource: 'suppliers',
      action: 'create',
      scope: 'tenant',
      description: 'Create suppliers',
    },
    {
      code: 'suppliers.update.tenant',
      resource: 'suppliers',
      action: 'update',
      scope: 'tenant',
      description: 'Update suppliers',
    },
    {
      code: 'suppliers.delete.tenant',
      resource: 'suppliers',
      action: 'delete',
      scope: 'tenant',
      description: 'Delete suppliers',
    },

    // ========================================================================
    // REPORTS & ANALYTICS
    // ========================================================================
    // Reports - Outlet Level
    {
      code: 'reports.view.outlet',
      resource: 'reports',
      action: 'view',
      scope: 'outlet',
      description: 'View reports for own outlet',
    },
    {
      code: 'reports.export.outlet',
      resource: 'reports',
      action: 'export',
      scope: 'outlet',
      description: 'Export reports for own outlet',
    },
    // Reports - Tenant Level
    {
      code: 'reports.view.tenant',
      resource: 'reports',
      action: 'view',
      scope: 'tenant',
      description: 'View reports across all outlets',
    },
    {
      code: 'reports.export.tenant',
      resource: 'reports',
      action: 'export',
      scope: 'tenant',
      description: 'Export reports for tenant',
    },
    // Analytics
    {
      code: 'analytics.view.tenant',
      resource: 'analytics',
      action: 'view',
      scope: 'tenant',
      description: 'View analytics dashboard',
    },
    {
      code: 'analytics.advanced.tenant',
      resource: 'analytics',
      action: 'advanced',
      scope: 'tenant',
      description: 'Access advanced analytics',
    },

    // ========================================================================
    // KOPERASI (Cooperative Features)
    // ========================================================================
    // Loans
    {
      code: 'loans.read.tenant',
      resource: 'loans',
      action: 'read',
      scope: 'tenant',
      description: 'View loans',
    },
    {
      code: 'loans.create.tenant',
      resource: 'loans',
      action: 'create',
      scope: 'tenant',
      description: 'Create loan applications',
    },
    {
      code: 'loans.approve.tenant',
      resource: 'loans',
      action: 'approve',
      scope: 'tenant',
      description: 'Approve/reject loans',
    },
    {
      code: 'loans.manage.tenant',
      resource: 'loans',
      action: 'manage',
      scope: 'tenant',
      description: 'Manage loan payments',
    },
    // Savings
    {
      code: 'savings.read.tenant',
      resource: 'savings',
      action: 'read',
      scope: 'tenant',
      description: 'View savings accounts',
    },
    {
      code: 'savings.create.tenant',
      resource: 'savings',
      action: 'create',
      scope: 'tenant',
      description: 'Create savings accounts',
    },
    {
      code: 'savings.manage.tenant',
      resource: 'savings',
      action: 'manage',
      scope: 'tenant',
      description: 'Manage savings transactions',
    },

    // ========================================================================
    // SYSTEM & SETTINGS
    // ========================================================================
    {
      code: 'system.settings.tenant',
      resource: 'system',
      action: 'settings',
      scope: 'tenant',
      description: 'Manage tenant settings',
    },
    {
      code: 'system.audit.tenant',
      resource: 'system',
      action: 'audit',
      scope: 'tenant',
      description: 'View audit logs',
    },
    {
      code: 'system.delete.tenant',
      resource: 'system',
      action: 'delete',
      scope: 'tenant',
      description: 'Delete system data (danger zone)',
    },
  ];

  const permissions: Permission[] = [];
  for (const perm of permissionsData) {
    const permission = await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
    permissions.push(permission);
  }

  console.log(`✅ Created ${permissions.length} permissions`);

  // ============================================================================
  // PLATFORM ROLES (tenantId = null)
  // ============================================================================
  console.log('🌐 Creating platform roles...');

  // 1. SUPER_ADMIN - Full platform access
  let superAdminRole = await prisma.role.findFirst({
    where: {
      tenantId: null as any,
      name: 'SUPER_ADMIN',
    },
  });
  
  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: {
        tenantId: null as any,
        name: 'SUPER_ADMIN',
        description: 'Platform Super Administrator - Full access to all tenants',
        isSystem: true,
        level: 100,
      },
    });
  }

  // 2. DEVELOPER - Technical access
  let developerRole = await prisma.role.findFirst({
    where: {
      tenantId: null as any,
      name: 'DEVELOPER',
    },
  });
  
  if (!developerRole) {
    developerRole = await prisma.role.create({
      data: {
        tenantId: null as any,
        name: 'DEVELOPER',
        description: 'Platform Developer - Technical access, debugging, logs',
        isSystem: true,
        level: 90,
      },
    });
  }

  // 3. SUPPORT - Customer support
  let supportRole = await prisma.role.findFirst({
    where: {
      tenantId: null as any,
      name: 'SUPPORT',
    },
  });
  
  if (!supportRole) {
    supportRole = await prisma.role.create({
      data: {
        tenantId: null as any,
        name: 'SUPPORT',
        description: 'Platform Support - Help tenants, view-only access',
        isSystem: true,
        level: 50,
      },
    });
  }

  // 4. BILLING_ADMIN - Billing & subscriptions
  let billingAdminRole = await prisma.role.findFirst({
    where: {
      tenantId: null as any,
      name: 'BILLING_ADMIN',
    },
  });
  
  if (!billingAdminRole) {
    billingAdminRole = await prisma.role.create({
      data: {
        tenantId: null as any,
        name: 'BILLING_ADMIN',
        description: 'Platform Billing Admin - Manage subscriptions, invoices, payments',
        isSystem: true,
        level: 80,
      },
    });
  }

  console.log('✅ Platform roles created');

  // ============================================================================
  // TENANT ROLES (tenantId = tenant.id)
  // ============================================================================
  console.log('🏢 Creating tenant roles...');

  // Assign all permissions to Super Admin (this is just for the tenant, not platform)
  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Admin Role (most permissions except system delete)
  const adminRole = await prisma.role.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: 'ADMIN',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'ADMIN',
      description: 'Administrator',
    },
  });

  const adminPermissions = permissions.filter(
    (p) => p.code !== 'system.delete.tenant',
  );
  for (const permission of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Cashier Role (limited permissions)
  const cashierRole = await prisma.role.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: 'CASHIER',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'CASHIER',
      description: 'Cashier',
    },
  });

  const cashierPermissions = permissions.filter((p) =>
    [
      'products.read.outlet',
      'inventory.read.outlet',
      'transactions.read.outlet',
      'transactions.create.outlet',
      'reports.view.outlet',
    ].includes(p.code),
  );
  for (const permission of cashierPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: cashierRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: cashierRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Manager Role (full outlet operations + reports)
  const managerRole = await prisma.role.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: 'MANAGER',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'MANAGER',
      description: 'Outlet Manager',
      isSystem: true,
      level: 70,
    },
  });

  const managerPermissions = permissions.filter((p) =>
    [
      // Users (outlet level)
      'users.read.outlet',
      // Products
      'products.read.outlet',
      'products.read.tenant',
      'products.create.tenant',
      'products.update.tenant',
      // Categories
      'categories.read.tenant',
      'categories.manage.tenant',
      // Inventory
      'inventory.read.outlet',
      'inventory.manage.outlet',
      'stock.adjust.outlet',
      'stock.transfer.outlet',
      'stock.opname.outlet',
      // Transactions
      'transactions.read.outlet',
      'transactions.create.outlet',
      'transactions.void.outlet',
      'transactions.refund.outlet',
      // Suppliers
      'suppliers.read.tenant',
      // Reports
      'reports.view.outlet',
      'reports.export.outlet',
      'reports.view.tenant',
      'reports.export.tenant',
    ].includes(p.code),
  );
  for (const permission of managerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: managerRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: managerRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Accountant Role (reports + analytics + transactions read)
  const accountantRole = await prisma.role.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: 'ACCOUNTANT',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'ACCOUNTANT',
      description: 'Accountant - Financial Reports & Analytics',
      isSystem: true,
      level: 80,
    },
  });

  const accountantPermissions = permissions.filter((p) =>
    [
      // Transactions (read only)
      'transactions.read.outlet',
      'transactions.read.tenant',
      // Products (read for cost analysis)
      'products.read.outlet',
      'products.read.tenant',
      // Inventory (read for valuation)
      'inventory.read.outlet',
      'inventory.read.tenant',
      // Suppliers (read)
      'suppliers.read.tenant',
      // Reports (full access)
      'reports.view.outlet',
      'reports.export.outlet',
      'reports.view.tenant',
      'reports.export.tenant',
      // Analytics
      'analytics.view.tenant',
      'analytics.advanced.tenant',
      // Koperasi
      'loans.read.tenant',
      'savings.read.tenant',
      // System audit
      'system.audit.tenant',
    ].includes(p.code),
  );
  for (const permission of accountantPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: accountantRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: accountantRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Viewer Role (read-only all resources)
  const viewerRole = await prisma.role.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: 'VIEWER',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'VIEWER',
      description: 'Viewer - Read-only access',
      isSystem: true,
      level: 10,
    },
  });

  const viewerPermissions = permissions.filter((p) =>
    [
      'users.read.outlet',
      'outlets.read.tenant',
      'products.read.outlet',
      'products.read.tenant',
      'categories.read.tenant',
      'inventory.read.outlet',
      'inventory.read.tenant',
      'transactions.read.outlet',
      'suppliers.read.tenant',
      'reports.view.outlet',
      'loans.read.tenant',
      'savings.read.tenant',
    ].includes(p.code),
  );
  for (const permission of viewerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: viewerRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: viewerRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('✅ Roles created with permissions');

  // ============================================================================
  // PLATFORM USERS (tenantId = null, outletId = null)
  // ============================================================================
  console.log('🌐 Creating platform users...');
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Super Admin User
  const superAdminUser = await prisma.user.upsert({
    where: { email: 'superadmin@platform.com' },
    update: {},
    create: {
      tenantId: null as any, // Platform-level
      outletId: null as any, // Not tied to any outlet
      roleId: superAdminRole.id,
      username: 'platform_superadmin',
      email: 'superadmin@platform.com',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      isActive: true,
    },
  });

  // 2. Developer User
  const developerUser = await prisma.user.upsert({
    where: { email: 'developer@platform.com' },
    update: {},
    create: {
      tenantId: null as any,
      outletId: null as any,
      roleId: developerRole.id,
      username: 'platform_developer',
      email: 'developer@platform.com',
      passwordHash,
      firstName: 'Dev',
      lastName: 'Team',
      isActive: true,
    },
  });

  // 3. Support User
  const supportUser = await prisma.user.upsert({
    where: { email: 'support@platform.com' },
    update: {},
    create: {
      tenantId: null as any,
      outletId: null as any,
      roleId: supportRole.id,
      username: 'platform_support',
      email: 'support@platform.com',
      passwordHash,
      firstName: 'Support',
      lastName: 'Team',
      isActive: true,
    },
  });

  // 4. Billing Admin User
  const billingAdminUser = await prisma.user.upsert({
    where: { email: 'billing@platform.com' },
    update: {},
    create: {
      tenantId: null as any,
      outletId: null as any,
      roleId: billingAdminRole.id,
      username: 'platform_billing',
      email: 'billing@platform.com',
      passwordHash,
      firstName: 'Billing',
      lastName: 'Admin',
      isActive: true,
    },
  });

  console.log('✅ Platform users created');

  // ============================================================================
  // TENANT USERS (tenantId = tenant.id, tied to specific tenant/outlet)
  // ============================================================================
  console.log('👤 Creating tenant users...');

  // Admin for Demo Tenant
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      tenantId: tenant.id, // Belongs to Demo Tenant
      outletId: outlet.id, // Assigned to main outlet
      roleId: adminRole.id,
      username: 'admin',
      email: 'admin@demo.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
    },
  });

  // Cashier for Demo Tenant
  const cashierUser = await prisma.user.upsert({
    where: { email: 'cashier@demo.com' },
    update: {},
    create: {
      tenantId: tenant.id, // Belongs to Demo Tenant
      outletId: outlet.id, // Assigned to main outlet
      roleId: cashierRole.id,
      username: 'cashier',
      email: 'cashier@demo.com',
      passwordHash,
      firstName: 'Cashier',
      lastName: 'User',
      isActive: true,
    },
  });

  console.log('✅ Tenant users created');

  // Create Product Categories
  console.log('📦 Creating product categories...');
  const foodCategory = await prisma.productCategory.create({
    data: {
      tenantId: tenant.id,
      name: 'Makanan',
      description: 'Kategori makanan',
      isActive: true,
    },
  });

  const beverageCategory = await prisma.productCategory.create({
    data: {
      tenantId: tenant.id,
      name: 'Minuman',
      description: 'Kategori minuman',
      isActive: true,
    },
  });

  console.log('✅ Product categories created');

  // Create Sample Products
  console.log('🍔 Creating sample products...');
  
  await prisma.product.create({
    data: {
      tenantId: tenant.id,
      outletId: outlet.id,
      categoryId: foodCategory.id,
      sku: 'FOOD-001',
      name: 'Nasi Goreng Spesial',
      description: 'Nasi goreng dengan telur dan ayam',
      costPrice: 15000,
      sellingPrice: 25000,
      unit: 'porsi',
      currentStock: 50,
      minStock: 10,
      maxStock: 100,
      isTaxable: true,
      taxRate: 11,
      isActive: true,
    },
  });

  await prisma.product.create({
    data: {
      tenantId: tenant.id,
      outletId: outlet.id,
      categoryId: foodCategory.id,
      sku: 'FOOD-002',
      name: 'Mie Ayam Bakso',
      description: 'Mie ayam dengan bakso',
      costPrice: 12000,
      sellingPrice: 20000,
      unit: 'porsi',
      currentStock: 30,
      minStock: 10,
      maxStock: 80,
      isTaxable: true,
      taxRate: 11,
      isActive: true,
    },
  });

  await prisma.product.create({
    data: {
      tenantId: tenant.id,
      outletId: outlet.id,
      categoryId: foodCategory.id,
      sku: 'FOOD-003',
      name: 'Ayam Goreng',
      description: 'Ayam goreng crispy',
      costPrice: 10000,
      sellingPrice: 18000,
      unit: 'potong',
      currentStock: 25,
      minStock: 8,
      maxStock: 50,
      isTaxable: true,
      taxRate: 11,
      isActive: true,
    },
  });

  await prisma.product.create({
    data: {
      tenantId: tenant.id,
      outletId: outlet.id,
      categoryId: beverageCategory.id,
      sku: 'BEV-001',
      name: 'Es Teh Manis',
      description: 'Es teh manis segar',
      costPrice: 2000,
      sellingPrice: 5000,
      unit: 'gelas',
      currentStock: 100,
      minStock: 20,
      maxStock: 200,
      isTaxable: true,
      taxRate: 11,
      isActive: true,
    },
  });

  await prisma.product.create({
    data: {
      tenantId: tenant.id,
      outletId: outlet.id,
      categoryId: beverageCategory.id,
      sku: 'BEV-002',
      name: 'Kopi Susu',
      description: 'Kopi susu panas/dingin',
      costPrice: 5000,
      sellingPrice: 15000,
      unit: 'gelas',
      currentStock: 45,
      minStock: 15,
      maxStock: 100,
      isTaxable: true,
      taxRate: 11,
      isActive: true,
    },
  });

  await prisma.product.create({
    data: {
      tenantId: tenant.id,
      outletId: outlet.id,
      categoryId: beverageCategory.id,
      sku: 'BEV-003',
      name: 'Jus Jeruk',
      description: 'Jus jeruk segar',
      costPrice: 6000,
      sellingPrice: 12000,
      unit: 'gelas',
      currentStock: 35,
      minStock: 10,
      maxStock: 80,
      isTaxable: true,
      taxRate: 11,
      isActive: true,
    },
  });

  // Low stock item for testing alerts
  await prisma.product.create({
    data: {
      tenantId: tenant.id,
      outletId: outlet.id,
      categoryId: foodCategory.id,
      sku: 'FOOD-004',
      name: 'Soto Ayam',
      description: 'Soto ayam kuah bening',
      costPrice: 13000,
      sellingPrice: 22000,
      unit: 'porsi',
      currentStock: 5, // Low stock for testing
      minStock: 10,
      maxStock: 60,
      isTaxable: true,
      taxRate: 11,
      isActive: true,
    },
  });

  console.log('✅ Sample products created (7 products)');

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📝 PLATFORM USERS (No Tenant/Outlet - Manage ALL tenants)');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('  1. 🔴 SUPER ADMIN (Full Platform Access):');
  console.log('     Email: superadmin@platform.com');
  console.log('     Password: password123');
  console.log('     Access: Manage all tenants, subscriptions, platform settings');
  console.log('');
  console.log('  2. 💻 DEVELOPER (Technical Access):');
  console.log('     Email: developer@platform.com');
  console.log('     Password: password123');
  console.log('     Access: Debugging, logs, technical support');
  console.log('');
  console.log('  3. 🎧 SUPPORT (Customer Support):');
  console.log('     Email: support@platform.com');
  console.log('     Password: password123');
  console.log('     Access: Help tenants, view-only access');
  console.log('');
  console.log('  4. 💳 BILLING ADMIN (Billing & Subscriptions):');
  console.log('     Email: billing@platform.com');
  console.log('     Password: password123');
  console.log('     Access: Manage subscriptions, invoices, payments');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📝 TENANT USERS (Demo Koperasi - Tenant-specific)');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('  5. 👤 ADMIN (Tenant Admin):');
  console.log('     Email: admin@demo.com');
  console.log('     Password: password123');
  console.log('     Access: Manage Demo Koperasi operations');
  console.log('');
  console.log('  6. 🛒 CASHIER (Outlet Staff):');
  console.log('     Email: cashier@demo.com');
  console.log('     Password: password123');
  console.log('     Access: POS, transactions, products (Demo Koperasi only)');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
