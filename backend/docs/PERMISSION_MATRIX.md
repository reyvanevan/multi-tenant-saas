# 🔐 PERMISSION MATRIX (RBAC)
## Role-Based Access Control - Detailed Permissions

> **Team:** Reyvan + Aegner  
> **Architecture:** Granular permission system with resource-action-scope pattern  
> **Format:** `{resource}.{action}.{scope}`

---

## 🎯 PERMISSION STRUCTURE

### **Permission Format:**
```
{resource}.{action}.{scope}

Examples:
- pos.transactions.create.own_outlet
- inventory.stock.view.all_outlets
- koperasi.loans.approve.all
- reports.sales.export.platform_wide
```

### **Components:**
- **Resource:** Module or entity (pos, inventory, koperasi, etc)
- **Action:** Operation (create, read, update, delete, approve, export)
- **Scope:** Access level (own_outlet, all_outlets, platform_wide)

---

## 👥 ROLE HIERARCHY

### **Level 1: Platform (Your Company)**
```
Platform Admin (Superadmin)
└─ Full access to all tenants & settings
└─ Manage platform configuration
└─ View all analytics

Developer
└─ Technical access for debugging
└─ Database access (read-only in production)
└─ System logs
```

### **Level 2: Tenant (Each UMKM/Koperasi)**
```
Owner
└─ Full access to tenant data
└─ Manage subscription & billing
└─ Add/remove users & outlets

Admin
└─ Manage operations
└─ Configure settings
└─ View reports (all outlets)

Manager
└─ Manage staff & inventory
└─ Approve transactions
└─ View reports (assigned outlets)
```

### **Level 3: Outlet (Per Cabang/Gerai)**
```
Supervisor
└─ Manage outlet operations
└─ Approve refunds
└─ View outlet reports

Cashier
└─ Process transactions
└─ View products
└─ Print receipts

Stock Keeper
└─ Manage inventory
└─ Stock adjustments
└─ Receive goods
```

### **Level 4: External**
```
Supplier
└─ Submit quotations
└─ View purchase orders
└─ Submit invoices

Member (Koperasi)
└─ Apply for loans
└─ View savings balance
└─ Make payments
```

---

## 📋 COMPLETE PERMISSION MATRIX

### **1️⃣ PLATFORM & TENANCY**

| Resource | Action | Platform Admin | Developer | Owner | Admin | Manager |
|----------|--------|---------------|-----------|-------|-------|---------|
| **platform.settings** | view | ✅ | ✅ | ❌ | ❌ | ❌ |
| **platform.settings** | update | ✅ | ❌ | ❌ | ❌ | ❌ |
| **platform.tenants** | create | ✅ | ❌ | ❌ | ❌ | ❌ |
| **platform.tenants** | view.all | ✅ | ✅ | ❌ | ❌ | ❌ |
| **platform.tenants** | update | ✅ | ❌ | ❌ | ❌ | ❌ |
| **platform.tenants** | delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| **platform.analytics** | view | ✅ | ✅ | ❌ | ❌ | ❌ |
| **tenant.settings** | view | ✅ | ✅ | ✅ | ✅ | ❌ |
| **tenant.settings** | update | ✅ | ❌ | ✅ | ✅ | ❌ |
| **tenant.subscription** | view | ✅ | ✅ | ✅ | ✅ | ❌ |
| **tenant.subscription** | update | ✅ | ❌ | ✅ | ❌ | ❌ |
| **tenant.outlets** | create | ✅ | ❌ | ✅ | ✅ | ❌ |
| **tenant.outlets** | view | ✅ | ✅ | ✅ | ✅ | ✅ (assigned) |
| **tenant.outlets** | update | ✅ | ❌ | ✅ | ✅ | ❌ |
| **tenant.outlets** | delete | ✅ | ❌ | ✅ | ✅ | ❌ |

---

### **2️⃣ USERS & RBAC**

| Resource | Action | Owner | Admin | Manager | Supervisor |
|----------|--------|-------|-------|---------|------------|
| **users** | create | ✅ | ✅ | ✅ (outlet staff) | ❌ |
| **users** | view.all | ✅ | ✅ | ✅ (outlet only) | ✅ (outlet only) |
| **users** | view.own | ✅ | ✅ | ✅ | ✅ |
| **users** | update.all | ✅ | ✅ | ❌ | ❌ |
| **users** | update.own | ✅ | ✅ | ✅ | ✅ |
| **users** | delete | ✅ | ✅ | ❌ | ❌ |
| **users** | suspend | ✅ | ✅ | ❌ | ❌ |
| **roles** | create | ✅ | ✅ | ❌ | ❌ |
| **roles** | view | ✅ | ✅ | ✅ | ✅ |
| **roles** | update | ✅ | ✅ | ❌ | ❌ |
| **roles** | delete | ✅ | ✅ | ❌ | ❌ |
| **roles** | assign | ✅ | ✅ | ✅ (outlet staff) | ❌ |
| **permissions** | view | ✅ | ✅ | ✅ | ❌ |
| **permissions** | update | ✅ | ✅ | ❌ | ❌ |

---

### **3️⃣ POS & TRANSACTIONS**

| Resource | Action | Cashier | Supervisor | Manager | Admin | Owner |
|----------|--------|---------|------------|---------|-------|-------|
| **pos.transactions** | create | ✅ | ✅ | ✅ | ✅ | ✅ |
| **pos.transactions** | view.own | ✅ | ✅ | ✅ | ✅ | ✅ |
| **pos.transactions** | view.outlet | ❌ | ✅ | ✅ | ✅ | ✅ |
| **pos.transactions** | view.all_outlets | ❌ | ❌ | ❌ | ✅ | ✅ |
| **pos.transactions** | void | ❌ | ✅ | ✅ | ✅ | ✅ |
| **pos.transactions** | delete | ❌ | ❌ | ❌ | ✅ | ✅ |
| **pos.refunds** | create | ❌ | ✅ | ✅ | ✅ | ✅ |
| **pos.refunds** | approve | ❌ | ✅ | ✅ | ✅ | ✅ |
| **pos.discounts** | apply.standard | ✅ | ✅ | ✅ | ✅ | ✅ |
| **pos.discounts** | apply.special | ❌ | ✅ | ✅ | ✅ | ✅ |
| **pos.shift** | open | ✅ | ✅ | ✅ | ✅ | ✅ |
| **pos.shift** | close | ✅ | ✅ | ✅ | ✅ | ✅ |
| **pos.shift** | view.own | ✅ | ✅ | ✅ | ✅ | ✅ |
| **pos.shift** | view.all | ❌ | ✅ | ✅ | ✅ | ✅ |
| **pos.receipts** | print | ✅ | ✅ | ✅ | ✅ | ✅ |
| **pos.receipts** | reprint | ❌ | ✅ | ✅ | ✅ | ✅ |

---

### **4️⃣ PRODUCTS & CATALOG**

| Resource | Action | Cashier | Stock Keeper | Supervisor | Manager | Admin |
|----------|--------|---------|--------------|------------|---------|-------|
| **products** | create | ❌ | ❌ | ❌ | ✅ | ✅ |
| **products** | view | ✅ | ✅ | ✅ | ✅ | ✅ |
| **products** | update | ❌ | ❌ | ❌ | ✅ | ✅ |
| **products** | delete | ❌ | ❌ | ❌ | ✅ | ✅ |
| **products** | import | ❌ | ❌ | ❌ | ✅ | ✅ |
| **products** | export | ❌ | ❌ | ✅ | ✅ | ✅ |
| **products.pricing** | view | ✅ | ✅ | ✅ | ✅ | ✅ |
| **products.pricing** | update | ❌ | ❌ | ❌ | ✅ | ✅ |
| **products.cost** | view | ❌ | ✅ | ✅ | ✅ | ✅ |
| **products.cost** | update | ❌ | ❌ | ❌ | ✅ | ✅ |
| **categories** | create | ❌ | ❌ | ❌ | ✅ | ✅ |
| **categories** | view | ✅ | ✅ | ✅ | ✅ | ✅ |
| **categories** | update | ❌ | ❌ | ❌ | ✅ | ✅ |
| **categories** | delete | ❌ | ❌ | ❌ | ✅ | ✅ |

---

### **5️⃣ INVENTORY & STOCK**

| Resource | Action | Cashier | Stock Keeper | Supervisor | Manager | Admin |
|----------|--------|---------|--------------|------------|---------|-------|
| **inventory.stock** | view.outlet | ✅ | ✅ | ✅ | ✅ | ✅ |
| **inventory.stock** | view.all_outlets | ❌ | ❌ | ❌ | ✅ | ✅ |
| **inventory.adjustments** | create | ❌ | ✅ | ✅ | ✅ | ✅ |
| **inventory.adjustments** | view | ❌ | ✅ | ✅ | ✅ | ✅ |
| **inventory.adjustments** | approve | ❌ | ❌ | ✅ | ✅ | ✅ |
| **inventory.adjustments** | delete | ❌ | ❌ | ❌ | ✅ | ✅ |
| **inventory.transfers** | create | ❌ | ✅ | ✅ | ✅ | ✅ |
| **inventory.transfers** | view | ❌ | ✅ | ✅ | ✅ | ✅ |
| **inventory.transfers** | approve | ❌ | ❌ | ✅ | ✅ | ✅ |
| **inventory.transfers** | receive | ❌ | ✅ | ✅ | ✅ | ✅ |
| **inventory.opname** | create | ❌ | ✅ | ✅ | ✅ | ✅ |
| **inventory.opname** | view | ❌ | ✅ | ✅ | ✅ | ✅ |
| **inventory.opname** | verify | ❌ | ❌ | ✅ | ✅ | ✅ |
| **inventory.movements** | view | ❌ | ✅ | ✅ | ✅ | ✅ |
| **inventory.alerts** | view | ❌ | ✅ | ✅ | ✅ | ✅ |

---

### **6️⃣ SUPPLIER & PROCUREMENT**

| Resource | Action | Stock Keeper | Manager | Admin | Supplier |
|----------|--------|--------------|---------|-------|----------|
| **suppliers** | create | ❌ | ✅ | ✅ | ❌ |
| **suppliers** | view | ✅ | ✅ | ✅ | ❌ |
| **suppliers** | update | ❌ | ✅ | ✅ | ❌ |
| **suppliers** | delete | ❌ | ❌ | ✅ | ❌ |
| **rfq** | create | ❌ | ✅ | ✅ | ❌ |
| **rfq** | view | ✅ | ✅ | ✅ | ✅ (own) |
| **rfq** | update | ❌ | ✅ | ✅ | ❌ |
| **rfq** | cancel | ❌ | ✅ | ✅ | ❌ |
| **quotations** | create | ❌ | ❌ | ❌ | ✅ |
| **quotations** | view | ✅ | ✅ | ✅ | ✅ (own) |
| **quotations** | accept | ❌ | ✅ | ✅ | ❌ |
| **quotations** | reject | ❌ | ✅ | ✅ | ❌ |
| **purchase_orders** | create | ❌ | ✅ | ✅ | ❌ |
| **purchase_orders** | view | ✅ | ✅ | ✅ | ✅ (own) |
| **purchase_orders** | approve | ❌ | ✅ | ✅ | ❌ |
| **purchase_orders** | cancel | ❌ | ✅ | ✅ | ❌ |
| **goods_receipt** | create | ✅ | ✅ | ✅ | ❌ |
| **goods_receipt** | view | ✅ | ✅ | ✅ | ✅ (own PO) |
| **goods_receipt** | verify | ❌ | ✅ | ✅ | ❌ |
| **supplier_invoices** | create | ❌ | ❌ | ❌ | ✅ |
| **supplier_invoices** | view | ❌ | ✅ | ✅ | ✅ (own) |
| **supplier_invoices** | approve | ❌ | ✅ | ✅ | ❌ |
| **supplier_payments** | create | ❌ | ✅ | ✅ | ❌ |
| **supplier_payments** | view | ❌ | ✅ | ✅ | ✅ (own) |

---

### **7️⃣ KOPERASI - LOANS**

| Resource | Action | Staff | Loan Officer | Manager | Admin | Member |
|----------|--------|-------|--------------|---------|-------|--------|
| **koperasi.members** | create | ✅ | ✅ | ✅ | ✅ | ❌ |
| **koperasi.members** | view.all | ✅ | ✅ | ✅ | ✅ | ❌ |
| **koperasi.members** | view.own | ❌ | ❌ | ❌ | ❌ | ✅ |
| **koperasi.members** | update | ❌ | ✅ | ✅ | ✅ | ✅ (own profile) |
| **koperasi.members** | suspend | ❌ | ❌ | ✅ | ✅ | ❌ |
| **koperasi.loan_products** | create | ❌ | ❌ | ✅ | ✅ | ❌ |
| **koperasi.loan_products** | view | ✅ | ✅ | ✅ | ✅ | ✅ |
| **koperasi.loan_products** | update | ❌ | ❌ | ✅ | ✅ | ❌ |
| **koperasi.loans** | create | ✅ | ✅ | ✅ | ✅ | ✅ (apply) |
| **koperasi.loans** | view.all | ✅ | ✅ | ✅ | ✅ | ❌ |
| **koperasi.loans** | view.own | ❌ | ❌ | ❌ | ❌ | ✅ |
| **koperasi.loans** | review | ❌ | ✅ | ✅ | ✅ | ❌ |
| **koperasi.loans** | approve | ❌ | ❌ | ✅ | ✅ | ❌ |
| **koperasi.loans** | reject | ❌ | ✅ | ✅ | ✅ | ❌ |
| **koperasi.loans** | disburse | ❌ | ✅ | ✅ | ✅ | ❌ |
| **koperasi.loans** | writeoff | ❌ | ❌ | ✅ | ✅ | ❌ |
| **koperasi.loan_payments** | create | ✅ | ✅ | ✅ | ✅ | ✅ |
| **koperasi.loan_payments** | view.all | ✅ | ✅ | ✅ | ✅ | ❌ |
| **koperasi.loan_payments** | view.own | ❌ | ❌ | ❌ | ❌ | ✅ |

---

### **8️⃣ KOPERASI - SAVINGS**

| Resource | Action | Staff | Teller | Manager | Admin | Member |
|----------|--------|-------|--------|---------|-------|--------|
| **koperasi.savings_accounts** | create | ✅ | ✅ | ✅ | ✅ | ❌ |
| **koperasi.savings_accounts** | view.all | ✅ | ✅ | ✅ | ✅ | ❌ |
| **koperasi.savings_accounts** | view.own | ❌ | ❌ | ❌ | ❌ | ✅ |
| **koperasi.savings_accounts** | close | ❌ | ❌ | ✅ | ✅ | ❌ |
| **koperasi.savings_transactions** | deposit | ✅ | ✅ | ✅ | ✅ | ✅ |
| **koperasi.savings_transactions** | withdraw | ✅ | ✅ | ✅ | ✅ | ✅ |
| **koperasi.savings_transactions** | view.all | ✅ | ✅ | ✅ | ✅ | ❌ |
| **koperasi.savings_transactions** | view.own | ❌ | ❌ | ❌ | ❌ | ✅ |
| **koperasi.interest** | calculate | ❌ | ❌ | ✅ | ✅ | ❌ |
| **koperasi.interest** | post | ❌ | ❌ | ✅ | ✅ | ❌ |
| **koperasi.shu** | calculate | ❌ | ❌ | ✅ | ✅ | ❌ |
| **koperasi.shu** | approve | ❌ | ❌ | ❌ | ✅ | ❌ |
| **koperasi.shu** | distribute | ❌ | ❌ | ❌ | ✅ | ❌ |
| **koperasi.shu** | view.own | ❌ | ❌ | ❌ | ❌ | ✅ |

---

### **9️⃣ ACCOUNTING & FINANCE**

| Resource | Action | Accountant | Finance Manager | Admin |
|----------|--------|------------|-----------------|-------|
| **accounting.coa** | create | ✅ | ✅ | ✅ |
| **accounting.coa** | view | ✅ | ✅ | ✅ |
| **accounting.coa** | update | ✅ | ✅ | ✅ |
| **accounting.coa** | delete | ❌ | ✅ | ✅ |
| **accounting.journals** | create | ✅ | ✅ | ✅ |
| **accounting.journals** | view | ✅ | ✅ | ✅ |
| **accounting.journals** | post | ✅ | ✅ | ✅ |
| **accounting.journals** | reverse | ❌ | ✅ | ✅ |
| **accounting.journals** | approve | ❌ | ✅ | ✅ |
| **accounting.gl** | view | ✅ | ✅ | ✅ |
| **accounting.gl** | export | ✅ | ✅ | ✅ |
| **accounting.closing** | perform | ❌ | ✅ | ✅ |

---

### **🔟 REPORTS & ANALYTICS**

| Resource | Action | Cashier | Supervisor | Manager | Admin | Owner |
|----------|--------|---------|------------|---------|-------|-------|
| **reports.sales** | view.own_shift | ✅ | ✅ | ✅ | ✅ | ✅ |
| **reports.sales** | view.outlet | ❌ | ✅ | ✅ | ✅ | ✅ |
| **reports.sales** | view.all_outlets | ❌ | ❌ | ❌ | ✅ | ✅ |
| **reports.sales** | export | ❌ | ✅ | ✅ | ✅ | ✅ |
| **reports.inventory** | view.outlet | ❌ | ✅ | ✅ | ✅ | ✅ |
| **reports.inventory** | view.all_outlets | ❌ | ❌ | ❌ | ✅ | ✅ |
| **reports.inventory** | export | ❌ | ✅ | ✅ | ✅ | ✅ |
| **reports.financial** | view.outlet | ❌ | ❌ | ✅ | ✅ | ✅ |
| **reports.financial** | view.all_outlets | ❌ | ❌ | ❌ | ✅ | ✅ |
| **reports.financial** | export | ❌ | ❌ | ✅ | ✅ | ✅ |
| **reports.koperasi** | view | ❌ | ❌ | ✅ | ✅ | ✅ |
| **reports.koperasi** | export | ❌ | ❌ | ✅ | ✅ | ✅ |
| **analytics.dashboard** | view.outlet | ❌ | ✅ | ✅ | ✅ | ✅ |
| **analytics.dashboard** | view.all_outlets | ❌ | ❌ | ❌ | ✅ | ✅ |

---

### **1️⃣1️⃣ SYSTEM & AUDIT**

| Resource | Action | Admin | Owner | Platform Admin |
|----------|--------|-------|-------|----------------|
| **audit_logs** | view.own_tenant | ✅ | ✅ | ✅ |
| **audit_logs** | view.all_tenants | ❌ | ❌ | ✅ |
| **audit_logs** | export | ✅ | ✅ | ✅ |
| **system_logs** | view | ❌ | ❌ | ✅ |
| **notifications** | view.own | ✅ | ✅ | ✅ |
| **notifications** | send | ✅ | ✅ | ✅ |
| **webhooks** | create | ✅ | ✅ | ❌ |
| **webhooks** | view | ✅ | ✅ | ✅ |
| **webhooks** | update | ✅ | ✅ | ❌ |
| **webhooks** | delete | ✅ | ✅ | ❌ |

---

## 🛠️ IMPLEMENTATION IN CODE

### **Backend (NestJS Guard):**

```typescript
// permission.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions) {
      return true; // No permission required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user has any of the required permissions
    return requiredPermissions.some((permission) =>
      user.permissions?.includes(permission),
    );
  }
}

// Usage in controller:
@Controller('products')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ProductsController {
  @Get()
  @Permissions('products.view')
  findAll() {
    // ...
  }

  @Post()
  @Permissions('products.create')
  create(@Body() dto: CreateProductDto) {
    // ...
  }

  @Put(':id')
  @Permissions('products.update')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    // ...
  }

  @Delete(':id')
  @Permissions('products.delete')
  remove(@Param('id') id: string) {
    // ...
  }
}
```

### **Frontend (React Component):**

```tsx
// Can.tsx - Permission checker component
import { usePermissions } from '@/hooks/use-permissions';

interface CanProps {
  permission: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Can({ permission, children, fallback = null }: CanProps) {
  const { hasPermission } = usePermissions();
  
  const permissions = Array.isArray(permission) ? permission : [permission];
  const canAccess = permissions.some(p => hasPermission(p));
  
  return canAccess ? <>{children}</> : <>{fallback}</>;
}

// Usage:
<Can permission="products.create">
  <Button onClick={handleCreate}>Add Product</Button>
</Can>

<Can permission={["products.update", "products.delete"]}>
  <ProductActions product={product} />
</Can>
```

### **usePermissions Hook:**

```typescript
// hooks/use-permissions.ts
import { useAuth } from '@/context/auth-context';

export function usePermissions() {
  const { user } = useAuth();
  
  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) ?? false;
  };
  
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(p => hasPermission(p));
  };
  
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(p => hasPermission(p));
  };
  
  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    permissions: user?.permissions ?? [],
  };
}
```

---

## 🎯 SEEDING DEFAULT ROLES & PERMISSIONS

### **Seed Data Script:**

```typescript
// prisma/seed-permissions.ts
const defaultRoles = [
  {
    name: 'Platform Admin',
    slug: 'platform_admin',
    level: 'PLATFORM',
    permissions: [
      'platform.*',
      'tenant.*',
      'reports.*',
      'audit_logs.*',
    ],
  },
  {
    name: 'Owner',
    slug: 'owner',
    level: 'TENANT',
    permissions: [
      'tenant.*',
      'outlets.*',
      'users.*',
      'products.*',
      'pos.*',
      'inventory.*',
      'suppliers.*',
      'koperasi.*',
      'reports.*',
      'accounting.*',
    ],
  },
  {
    name: 'Admin',
    slug: 'admin',
    level: 'TENANT',
    permissions: [
      'users.view',
      'users.create',
      'users.update',
      'products.*',
      'pos.*',
      'inventory.*',
      'suppliers.*',
      'reports.*',
    ],
  },
  {
    name: 'Manager',
    slug: 'manager',
    level: 'TENANT',
    permissions: [
      'users.view',
      'products.view',
      'products.update',
      'pos.*',
      'inventory.*',
      'suppliers.view',
      'reports.view.outlet',
    ],
  },
  {
    name: 'Cashier',
    slug: 'cashier',
    level: 'OUTLET',
    permissions: [
      'products.view',
      'pos.transactions.create',
      'pos.transactions.view.own',
      'pos.shift.open',
      'pos.shift.close',
      'pos.receipts.print',
    ],
  },
  {
    name: 'Stock Keeper',
    slug: 'stock_keeper',
    level: 'OUTLET',
    permissions: [
      'products.view',
      'inventory.stock.view',
      'inventory.adjustments.create',
      'inventory.transfers.create',
      'inventory.opname.create',
      'goods_receipt.create',
    ],
  },
  {
    name: 'Supplier',
    slug: 'supplier',
    level: 'EXTERNAL',
    permissions: [
      'rfq.view.own',
      'quotations.create',
      'quotations.view.own',
      'purchase_orders.view.own',
      'supplier_invoices.create',
      'supplier_invoices.view.own',
    ],
  },
  {
    name: 'Member',
    slug: 'member',
    level: 'EXTERNAL',
    permissions: [
      'koperasi.members.view.own',
      'koperasi.members.update.own',
      'koperasi.loan_products.view',
      'koperasi.loans.create',
      'koperasi.loans.view.own',
      'koperasi.loan_payments.create',
      'koperasi.loan_payments.view.own',
      'koperasi.savings_accounts.view.own',
      'koperasi.savings_transactions.deposit',
      'koperasi.savings_transactions.withdraw',
      'koperasi.savings_transactions.view.own',
    ],
  },
];
```

---

## 📋 PERMISSION CHECKLIST FOR IMPLEMENTATION

### **Phase 0: Core RBAC (Week 1-2)**
- [ ] Create Permission model & seed data
- [ ] Create Role model & seed default roles
- [ ] Create RolePermission mapping
- [ ] Create UserRole assignment
- [ ] Implement PermissionGuard (backend)
- [ ] Create Can component (frontend)
- [ ] Create usePermissions hook

### **Phase 1: POS & Retail (Week 3-8)**
- [ ] Implement POS permissions
- [ ] Implement Product permissions
- [ ] Implement Inventory permissions
- [ ] Test permission enforcement

### **Phase 2: Supplier & Koperasi (Week 9-16)**
- [ ] Implement Supplier permissions
- [ ] Implement Koperasi permissions
- [ ] Implement external user access
- [ ] Test cross-tenant isolation

---

## 🎉 PERMISSION MATRIX COMPLETE!

**Total Permissions:** 150+  
**Total Roles:** 8 default roles  
**Coverage:** All modules (POS, Inventory, Supplier, Koperasi, Reports, etc)

**Ready untuk implement di code?** 🚀
