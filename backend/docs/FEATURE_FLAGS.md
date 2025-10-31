# 🎛️ FEATURE FLAGS & MODULE ENTITLEMENTS
## Subscription-Based Feature Gating System

> **Team:** Reyvan + Aegner  
> **Purpose:** Control feature access based on subscription plans & tenant settings  
> **Architecture:** Database-driven + runtime checks

---

## 🎯 OBJECTIVES

1. **Plan-based feature gating** - Different features for Starter/Business/Pro/Enterprise
2. **Module activation** - Enable/disable industry-specific modules (POS, Koperasi, etc)
3. **Usage limits enforcement** - Limit outlets, users, transactions per plan
4. **Progressive disclosure** - Show upgrade prompts for locked features
5. **A/B testing support** - Gradual rollout of new features
6. **Runtime configuration** - No code deployment for feature toggles

---

## 📊 FEATURE FLAG TYPES

### **1. Plan-Based Features**
Features unlocked by subscription tier

```typescript
type PlanFeature = {
  key: string;
  name: string;
  requiredPlan: 'starter' | 'business' | 'pro' | 'enterprise';
  description: string;
}

// Examples:
- offline_pos: Pro+
- kds: Business+
- multi_warehouse: Pro+
- api_access: Pro+
- white_label: Enterprise
- supplier_portal: Business+
```

### **2. Module Entitlements**
Industry-specific modules (add-ons)

```typescript
type ModuleEntitlement = {
  key: string;
  name: string;
  type: 'core' | 'addon';
  price: number; // monthly, in cents
  description: string;
}

// Core modules (included in all plans):
- pos
- inventory_basic
- reports_basic

// Add-on modules (paid extra):
- koperasi_pack: Rp 299k/month
- fnb_pack: Rp 149k/month
- accounting_advanced: Rp 199k/month
- whatsapp_integration: Rp 99k/month
```

### **3. Usage Limits**
Quantitative restrictions per plan

```typescript
type UsageLimit = {
  metric: string;
  limit: number | null; // null = unlimited
  period: 'monthly' | 'lifetime';
}

// Examples:
- outlets: {starter: 1, business: 3, pro: 10, enterprise: null}
- users: {starter: 2, business: 10, pro: 30, enterprise: null}
- transactions_per_month: {starter: 1000, business: null, pro: null}
- api_calls_per_day: {starter: null, business: null, pro: 10000, enterprise: null}
```

### **4. Beta Features**
Experimental features for early adopters

```typescript
type BetaFeature = {
  key: string;
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  allowedTenants?: string[]; // Whitelist
}

// Examples:
- ai_stock_prediction: 10% rollout
- voice_ordering: whitelist only
- blockchain_receipts: beta testers
```

---

## 🗄️ DATABASE SCHEMA (Already in DATABASE_SCHEMA.md)

### **Extended Plan Model:**

```prisma
model Plan {
  id                  String   @id @default(uuid())
  
  // ... existing fields ...
  
  // Features (JSON for flexibility)
  features            Json     
  // {
  //   offline_pos: true,
  //   kds: false,
  //   multi_warehouse: false,
  //   api_access: true,
  //   supplier_portal: true,
  //   whatsapp_integration: false
  // }
  
  // Usage limits
  maxOutlets          Int?     // null = unlimited
  maxUsers            Int?
  maxTransactions     Int?     // per month
  maxApiCalls         Int?     // per day
  maxStorage          Int?     // in GB
  
  // Modules included
  modules             String[] // ["pos", "inventory", "reports"]
}
```

### **Tenant Entitlements:**

```prisma
model TenantEntitlement {
  id              String   @id @default(uuid())
  tenantId        String
  
  featureKey      String   // "offline_pos", "koperasi_pack"
  enabled         Boolean  @default(true)
  
  // Override plan default
  customLimit     Int?     // If custom limit differs from plan
  
  // Expiry (for trial features)
  expiresAt       DateTime?
  
  // Add-on billing
  addonId         String?  // If this is a paid add-on
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@unique([tenantId, featureKey])
  @@index([tenantId])
  @@index([featureKey])
}
```

### **Feature Flags (Global/Platform Level):**

```prisma
model FeatureFlag {
  id              String   @id @default(uuid())
  
  key             String   @unique // "beta_ai_prediction"
  name            String
  description     String?
  
  type            FlagType
  
  // Global state
  enabled         Boolean  @default(false)
  
  // Rollout control
  rolloutPercentage Int    @default(0) // 0-100
  
  // Tenant whitelist (JSON array)
  allowedTenants  String[] // Array of tenant IDs
  
  // Environment
  environment     Environment[] // ["development", "staging", "production"]
  
  // Metadata
  metadata        Json?
  
  createdBy       String?  // User ID
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([key])
  @@index([enabled])
}

enum FlagType {
  RELEASE         // New feature rollout
  EXPERIMENT      // A/B testing
  OPERATIONAL     // Ops toggle (kill switch)
  PERMISSION      // Permission-based
}

enum Environment {
  DEVELOPMENT
  STAGING
  PRODUCTION
}
```

---

## 🎛️ FEATURE CATALOG

### **Core Features (All Plans)**

| Feature Key | Name | Description |
|-------------|------|-------------|
| `pos_basic` | Basic POS | Product catalog, transactions, receipts |
| `inventory_basic` | Basic Inventory | Stock tracking, adjustments |
| `reports_basic` | Basic Reports | Sales, inventory reports |
| `users_management` | User Management | Add/manage staff |
| `multi_payment` | Multiple Payments | Cash, card, e-wallet |

### **Business Plan Features**

| Feature Key | Name | Description | Price |
|-------------|------|-------------|-------|
| `offline_pos` | Offline POS | Work without internet | Included |
| `supplier_portal` | Supplier Portal | Procurement workflow | Included |
| `loyalty_basic` | Basic Loyalty | Points & rewards | Included |
| `promo_engine` | Promo Engine | Discounts & campaigns | Included |
| `whatsapp_notifications` | WhatsApp Notify | Order notifications | Included |

### **Pro Plan Features**

| Feature Key | Name | Description | Price |
|-------------|------|-------------|-------|
| `multi_warehouse` | Multi-Warehouse | Multiple stock locations | Included |
| `kds` | Kitchen Display | For F&B (order routing) | Included |
| `api_access` | API Access | REST API for integrations | Included |
| `advanced_reports` | Advanced Reports | Custom reports, dashboards | Included |
| `sso` | Single Sign-On | Google/Microsoft SSO | Included |
| `audit_trail` | Audit Trail | Detailed activity logs | Included |

### **Enterprise Features**

| Feature Key | Name | Description | Price |
|-------------|------|-------------|-------|
| `white_label` | White Label | Custom branding | Custom |
| `dedicated_support` | Dedicated Support | 24/7 priority support | Custom |
| `custom_reports` | Custom Reports | Tailored reporting | Custom |
| `on_premise` | On-Premise Deploy | Self-hosted option | Custom |
| `sla_guarantee` | SLA Guarantee | 99.9% uptime SLA | Custom |

### **Add-on Modules (Paid Extra)**

| Module Key | Name | Price/Month | Description |
|------------|------|-------------|-------------|
| `koperasi_pack` | Koperasi Pack | Rp 299k | Loan & savings management |
| `fnb_pack` | F&B Pack | Rp 149k | Table, KDS, recipes |
| `accounting_advanced` | Advanced Accounting | Rp 199k | Full GL, financial statements |
| `ecommerce_sync` | E-commerce Sync | Rp 99k | Tokopedia, Shopee integration |
| `whatsapp_blast` | WhatsApp Blast | Rp 99k | Marketing campaigns |
| `delivery_integration` | Delivery Integration | Rp 149k | GoFood, GrabFood |

### **Beta Features (Opt-in)**

| Feature Key | Name | Status | Rollout |
|-------------|------|--------|---------|
| `ai_stock_prediction` | AI Stock Forecast | Beta | 10% |
| `voice_ordering` | Voice Commands | Alpha | Whitelist |
| `ar_menu` | AR Menu View | Beta | 5% |
| `crypto_payment` | Crypto Payment | Beta | Whitelist |

---

## 🛠️ IMPLEMENTATION

### **Backend: Feature Gate Service**

```typescript
// feature-gate.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class FeatureGateService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if tenant has access to a feature
   */
  async canAccess(tenantId: string, featureKey: string): Promise<boolean> {
    // 1. Get tenant's subscription
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        currentPlan: true,
        entitlements: true,
      },
    });

    if (!tenant) return false;

    // 2. Check entitlements (custom overrides)
    const entitlement = tenant.entitlements.find(
      (e) => e.featureKey === featureKey
    );
    
    if (entitlement) {
      // Check expiry
      if (entitlement.expiresAt && entitlement.expiresAt < new Date()) {
        return false;
      }
      return entitlement.enabled;
    }

    // 3. Check plan features
    const planFeatures = tenant.currentPlan?.features as Record<string, boolean>;
    if (planFeatures && featureKey in planFeatures) {
      return planFeatures[featureKey];
    }

    // 4. Check if it's a core module
    const coreModules = ['pos_basic', 'inventory_basic', 'reports_basic'];
    if (coreModules.includes(featureKey)) {
      return true;
    }

    // Default: no access
    return false;
  }

  /**
   * Check usage limit
   */
  async checkLimit(
    tenantId: string,
    metric: 'outlets' | 'users' | 'transactions' | 'api_calls',
  ): Promise<{ allowed: boolean; current: number; limit: number | null }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { currentPlan: true, usageMetrics: true },
    });

    if (!tenant) {
      return { allowed: false, current: 0, limit: 0 };
    }

    // Get limit from plan
    const limitMap = {
      outlets: tenant.currentPlan?.maxOutlets,
      users: tenant.currentPlan?.maxUsers,
      transactions: tenant.currentPlan?.maxTransactions,
      api_calls: tenant.currentPlan?.maxApiCalls,
    };

    const limit = limitMap[metric];

    // Get current usage
    const usageMetric = tenant.usageMetrics.find(
      (m) => m.metricType === metric.toUpperCase()
    );
    const current = usageMetric?.currentValue || 0;

    // null = unlimited
    if (limit === null) {
      return { allowed: true, current, limit: null };
    }

    return {
      allowed: current < limit,
      current,
      limit,
    };
  }

  /**
   * Check beta feature access
   */
  async hasBetaAccess(tenantId: string, featureKey: string): Promise<boolean> {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { key: featureKey },
    });

    if (!flag || !flag.enabled) return false;

    // Check whitelist
    if (flag.allowedTenants.includes(tenantId)) {
      return true;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage === 100) return true;
    if (flag.rolloutPercentage === 0) return false;

    // Hash-based rollout (consistent per tenant)
    const hash = this.hashString(tenantId);
    const bucket = hash % 100;
    return bucket < flag.rolloutPercentage;
  }

  /**
   * Get all active features for tenant
   */
  async getActiveFeatures(tenantId: string): Promise<string[]> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        currentPlan: true,
        entitlements: true,
      },
    });

    if (!tenant) return [];

    const features: string[] = [];

    // Plan features
    const planFeatures = tenant.currentPlan?.features as Record<string, boolean>;
    if (planFeatures) {
      Object.entries(planFeatures).forEach(([key, enabled]) => {
        if (enabled) features.push(key);
      });
    }

    // Entitlements (overrides)
    tenant.entitlements.forEach((e) => {
      if (e.enabled && (!e.expiresAt || e.expiresAt > new Date())) {
        if (!features.includes(e.featureKey)) {
          features.push(e.featureKey);
        }
      }
    });

    return features;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}
```

### **Backend: Guard Implementation**

```typescript
// feature-gate.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureGateService } from './feature-gate.service';

@Injectable()
export class FeatureGateGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private featureGate: FeatureGateService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.get<string>(
      'feature',
      context.getHandler(),
    );

    if (!requiredFeature) {
      return true; // No feature requirement
    }

    const request = context.switchToHttp().getRequest();
    const tenantId = request.user?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Tenant not found');
    }

    const hasAccess = await this.featureGate.canAccess(tenantId, requiredFeature);

    if (!hasAccess) {
      throw new ForbiddenException(
        `Feature "${requiredFeature}" is not available in your plan. Please upgrade.`,
      );
    }

    return true;
  }
}

// Decorator
export const RequireFeature = (feature: string) =>
  SetMetadata('feature', feature);

// Usage in controller:
@Post('transfer')
@UseGuards(JwtAuthGuard, FeatureGateGuard)
@RequireFeature('multi_warehouse')
async transferStock(@Body() dto: TransferStockDto) {
  // Only accessible if tenant has multi_warehouse feature
}
```

### **Frontend: Feature Gate Hook**

```typescript
// hooks/use-feature-gate.ts
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';

interface FeatureGateResult {
  hasFeature: (feature: string) => boolean;
  activeFeatures: string[];
  isLoading: boolean;
  upgradeUrl: string;
}

export function useFeatureGate(): FeatureGateResult {
  const { tenant } = useAuth();

  const { data: activeFeatures = [], isLoading } = useQuery({
    queryKey: ['features', tenant?.id],
    queryFn: async () => {
      const res = await fetch('/api/features/active');
      return res.json();
    },
    enabled: !!tenant,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const hasFeature = (feature: string): boolean => {
    return activeFeatures.includes(feature);
  };

  return {
    hasFeature,
    activeFeatures,
    isLoading,
    upgradeUrl: '/settings/subscription',
  };
}
```

### **Frontend: Feature Gate Component**

```tsx
// components/feature-gate.tsx
import { useFeatureGate } from '@/hooks/use-feature-gate';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import Link from 'next/link';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
}

export function FeatureGate({
  feature,
  children,
  fallback,
  showUpgrade = true,
}: FeatureGateProps) {
  const { hasFeature, upgradeUrl, isLoading } = useFeatureGate();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!hasFeature(feature)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showUpgrade) {
      return (
        <div className="p-6 border rounded-lg bg-muted/50 text-center">
          <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">
            Upgrade Required
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            This feature is not available in your current plan.
          </p>
          <Button asChild>
            <Link href={upgradeUrl}>Upgrade Now</Link>
          </Button>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}

// Usage:
<FeatureGate feature="multi_warehouse">
  <StockTransferForm />
</FeatureGate>

<FeatureGate feature="kds" showUpgrade={false}>
  <KitchenDisplaySystem />
</FeatureGate>
```

### **Frontend: Usage Limit Hook**

```typescript
// hooks/use-usage-limit.ts
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';

interface UsageLimitResult {
  checkLimit: (metric: string) => Promise<{
    allowed: boolean;
    current: number;
    limit: number | null;
    percentage: number;
  }>;
  limits: Record<string, any>;
  isLoading: boolean;
}

export function useUsageLimit(): UsageLimitResult {
  const { tenant } = useAuth();

  const { data: limits = {}, isLoading } = useQuery({
    queryKey: ['usage-limits', tenant?.id],
    queryFn: async () => {
      const res = await fetch('/api/usage/limits');
      return res.json();
    },
    enabled: !!tenant,
  });

  const checkLimit = async (metric: string) => {
    const res = await fetch(`/api/usage/check/${metric}`);
    const data = await res.json();
    
    const percentage = data.limit === null 
      ? 0 
      : (data.current / data.limit) * 100;

    return { ...data, percentage };
  };

  return {
    checkLimit,
    limits,
    isLoading,
  };
}

// Usage:
const { checkLimit } = useUsageLimit();

const handleAddOutlet = async () => {
  const { allowed, current, limit } = await checkLimit('outlets');
  
  if (!allowed) {
    toast.error(`Outlet limit reached (${current}/${limit}). Please upgrade.`);
    return;
  }
  
  // Proceed with adding outlet
};
```

---

## 📊 PLAN FEATURE MATRIX

### **Starter Plan (Rp 129k/outlet/month)**
```json
{
  "features": {
    "pos_basic": true,
    "inventory_basic": true,
    "reports_basic": true,
    "multi_payment": true,
    "offline_pos": false,
    "supplier_portal": false,
    "kds": false,
    "multi_warehouse": false,
    "api_access": false
  },
  "limits": {
    "maxOutlets": 1,
    "maxUsers": 2,
    "maxTransactions": 1000,
    "maxProducts": 500,
    "maxStorage": 1
  },
  "modules": ["pos", "inventory_basic"]
}
```

### **Business Plan (Rp 299k/outlet/month)**
```json
{
  "features": {
    "pos_basic": true,
    "inventory_basic": true,
    "reports_basic": true,
    "multi_payment": true,
    "offline_pos": true,
    "supplier_portal": true,
    "loyalty_basic": true,
    "promo_engine": true,
    "whatsapp_notifications": true,
    "kds": false,
    "multi_warehouse": false,
    "api_access": false
  },
  "limits": {
    "maxOutlets": 3,
    "maxUsers": 10,
    "maxTransactions": null,
    "maxProducts": null,
    "maxStorage": 5
  },
  "modules": ["pos", "inventory", "supplier", "reports"]
}
```

### **Pro Plan (Rp 599k/outlet/month)**
```json
{
  "features": {
    "pos_basic": true,
    "inventory_basic": true,
    "reports_basic": true,
    "multi_payment": true,
    "offline_pos": true,
    "supplier_portal": true,
    "loyalty_basic": true,
    "promo_engine": true,
    "whatsapp_notifications": true,
    "kds": true,
    "multi_warehouse": true,
    "api_access": true,
    "advanced_reports": true,
    "sso": true,
    "audit_trail": true
  },
  "limits": {
    "maxOutlets": 10,
    "maxUsers": 30,
    "maxTransactions": null,
    "maxProducts": null,
    "maxStorage": 20,
    "maxApiCalls": 10000
  },
  "modules": ["pos", "inventory", "supplier", "reports", "accounting_basic"]
}
```

### **Enterprise Plan (Custom Pricing)**
```json
{
  "features": {
    // All features enabled
    "*": true
  },
  "limits": {
    "maxOutlets": null,
    "maxUsers": null,
    "maxTransactions": null,
    "maxProducts": null,
    "maxStorage": null,
    "maxApiCalls": null
  },
  "modules": ["*"],
  "customFeatures": [
    "white_label",
    "dedicated_support",
    "custom_reports",
    "on_premise",
    "sla_guarantee"
  ]
}
```

---

## 🚀 ROLLOUT STRATEGY

### **Phase 1: MVP (Core Features Only)**
- All features enabled for early adopters
- Focus on product-market fit
- Collect usage data

### **Phase 2: Introduce Plans**
- Launch Starter, Business, Pro tiers
- Grandfather existing users to Business plan
- Add usage tracking

### **Phase 3: Add-on Modules**
- Launch Koperasi Pack
- Launch F&B Pack
- Enable self-service purchase

### **Phase 4: Beta Features**
- Introduce beta program
- Gradual rollout (10% → 50% → 100%)
- Collect feedback before GA

---

## 🎉 FEATURE FLAGS & ENTITLEMENTS COMPLETE!

**Deliverables:**
- ✅ Feature types defined
- ✅ Database schema extended
- ✅ Complete feature catalog
- ✅ Plan feature matrix
- ✅ Backend implementation (Service + Guard)
- ✅ Frontend implementation (Hooks + Components)
- ✅ Rollout strategy

**Ready untuk next doc (Offline POS Architecture)?** 🚀
