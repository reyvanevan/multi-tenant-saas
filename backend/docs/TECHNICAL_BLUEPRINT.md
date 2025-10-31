# 🏗️ TECHNICAL BLUEPRINT - Multi-Industry SaaS Platform
## Consolidated Architecture & Execution Plan

> **Status:** Pre-Development Planning  
> **Last Updated:** October 26, 2025  
> **Decision:** LOCK ARCHITECTURE BEFORE CODING

---

## 📊 EXECUTIVE SUMMARY

**What we're building:**  
Multi-tenant, multi-industry Business Management Platform (POS + ERP + CRM + Koperasi) competing with Majoo, Moka, Qasir.

**Phase approach:**
- **Phase 0:** Foundation (Multi-tenancy, RBAC, Billing) - 2 weeks
- **Phase 1:** MVP Retail + Supplier Portal - 6 weeks
- **Phase 2:** F&B Pack (Table, KDS, Kitchen) - 6 weeks  
- **Phase 3:** Koperasi Pack (Loan, Savings, SHU) - 8 weeks
- **Phase 4:** Scale & Expand (Beauty, Services, etc)

---

## ✅ REVIEW CHATGPT RECOMMENDATIONS

### 🟢 **AGREED & CRITICAL (Must Have in Phase 0-1)**

1. **✅ Core + Vertical Modules Architecture**
   - Modular monolith with feature flags
   - Each industry = module bundle (F&B Pack, Retail Pack, KSP Pack)
   - Clean separation of concerns

2. **✅ Multi-tenancy with Postgres RLS**
   - Single database with `tenant_id` + Row Level Security
   - Schema-per-tenant untuk Enterprise (later)
   - TenantContext di semua layer (BE + FE)

3. **✅ RBAC Granular + Supplier Role**
   - Platform, Tenant, Outlet, Supplier, Member level
   - Permission: `read`, `create`, `update`, `delete`, `approve`, `export`
   - Resource-based (POS, Inventory, Loans, Reports, etc)

4. **✅ Offline POS (Critical!)**
   - Service Worker + IndexedDB
   - Queue transaksi + idempotency key
   - Sync strategy (background, manual, conflict resolution)
   - Printer support (ESC/POS via WebUSB/WebSerial)

5. **✅ Supply Chain Flow**
   - RFQ → Quotation → PO → ASN → GRN → Invoice → Payment
   - Supplier Portal multi-outlet aware
   - Stock movement tracking

6. **✅ Pricing per-outlet + per-seat + add-ons**
   - More realistic for Indonesian market
   - Flexible & scalable

7. **✅ Observability & Security**
   - Audit trail (who changed what)
   - PITR backup, encryption at-rest & at-transit
   - Rate limiting, WAF

### 🟡 **AGREED BUT ADJUSTED PRIORITY**

8. **🟡 Mobile Strategy**
   - **Phase 1:** POS tablet (web PWA) ← prioritas
   - **Phase 2:** Customer mobile app (loyalty, koperasi member)
   - Jangan bikin native app dulu, PWA is enough

9. **🟡 ERP Bridge**
   - **Phase 1:** Basic stock movement → GL posting
   - **Phase 3+:** Full accounting integration (Jurnal.id, Accurate)
   - Jangan overengineer di awal

### 🔴 **NEED REVISION / CLARIFICATION**

10. **🔴 NestJS vs Laravel/Node.js**
    - ChatGPT suggest NestJS - **good choice** tapi consider:
      - **Anda solo dev?** → Laravel lebih cepat (built-in auth, queue, ORM)
      - **Ada tim TypeScript?** → NestJS (modular, scalable)
      - **Hybrid?** → Node.js Express + Prisma (simple, flexible)
    
    **Rekomendasi saya:** Tunggu jawaban Anda tentang tim & experience

11. **🔴 "Modular Monolith → Microservice"**
    - **DON'T DO THIS untuk MVP!**
    - Microservices = overhead besar (network latency, debugging, deployment)
    - **Better:** Monolith dengan clean module boundaries
    - **Future:** Kalau sudah 10K+ tenants, baru extract ke microservices

---

## 🎯 REFINED EXECUTION ROADMAP

### **PHASE 0: Foundation (Weeks 1-2)** 🏗️

**Goal:** Setup multi-tenant infrastructure yang solid

#### Backend Tasks:
- [ ] Database schema design (ERD lengkap)
- [ ] Multi-tenancy setup (RLS policies)
- [ ] Authentication (JWT + refresh token)
- [ ] RBAC system (roles, permissions, guards)
- [ ] Tenant + Outlet management API
- [ ] Audit log system
- [ ] Feature flags infrastructure
- [ ] Billing skeleton (subscription tracking)
- [ ] File upload (S3/R2)
- [ ] Email service (transactional)

#### Frontend Tasks:
- [ ] Tenant context provider
- [ ] Outlet switcher component
- [ ] Permission-based UI rendering
- [ ] Role-based navigation/sidebar
- [ ] Enhanced user management (multi-role)
- [ ] Subscription status indicator
- [ ] Setup module lazy loading

#### DevOps:
- [ ] Docker compose (local dev)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Staging environment setup
- [ ] Logging infrastructure (Pino/Winston)
- [ ] Error tracking (Sentry)

**Deliverable:** 
- ✅ Working multi-tenant system
- ✅ Users can login, switch outlets
- ✅ Permissions working (show/hide features)
- ✅ Subscription tracking active

---

### **PHASE 1: MVP Retail + Supplier (Weeks 3-8)** 🏪

**Goal:** Launchable POS for Retail + basic supply chain

#### Core POS:
- [ ] Product catalog (variants, barcode, pricing)
- [ ] POS cashier interface (cart, payment, receipt)
- [ ] Multiple payment methods (cash, QRIS, e-wallet)
- [ ] Discount & promo engine (basic)
- [ ] Return/refund flow
- [ ] Receipt printing (thermal printer)
- [ ] Shift management (open/close kasir)
- [ ] End-of-day report

#### Offline POS:
- [ ] Service Worker setup
- [ ] IndexedDB schema
- [ ] Offline transaction queue
- [ ] Sync algorithm (background/manual)
- [ ] Conflict resolution strategy
- [ ] Network status indicator
- [ ] Idempotency key implementation

#### Inventory:
- [ ] Stock tracking (real-time)
- [ ] Stock adjustments
- [ ] Stock opname
- [ ] Low stock alerts
- [ ] Product categories & tags
- [ ] Barcode generation
- [ ] Bulk import (CSV)

#### Supplier Portal:
- [ ] Supplier registration
- [ ] RFQ (Request for Quotation)
- [ ] Quotation submission
- [ ] PO (Purchase Order) creation
- [ ] ASN (Advanced Shipping Notice)
- [ ] GRN (Goods Receipt Note)
- [ ] Invoice management
- [ ] Payment tracking
- [ ] Supplier performance dashboard

#### Reports:
- [ ] Sales report (daily, weekly, monthly)
- [ ] Product performance
- [ ] Cashier performance
- [ ] Inventory valuation
- [ ] Purchase report
- [ ] Profit margin analysis

**Deliverable:**
- ✅ Working POS for retail (online & offline)
- ✅ Supplier can submit quotation & track orders
- ✅ Basic inventory management
- ✅ 10-20 beta users testing

---

### **PHASE 2: F&B Pack (Weeks 9-14)** ☕

**Goal:** Complete F&B features for restaurants & cafes

#### Table Management:
- [ ] Floor plan designer (drag & drop)
- [ ] Table status (vacant, occupied, reserved)
- [ ] Table merging/splitting
- [ ] Move orders between tables
- [ ] Reservation system

#### Kitchen Display System (KDS):
- [ ] Order routing to kitchen stations
- [ ] Kitchen ticket printing
- [ ] Order status (pending, cooking, ready, served)
- [ ] Priority marking
- [ ] Timer per item
- [ ] Station performance metrics

#### F&B Specific:
- [ ] Menu with modifiers (size, sugar level, toppings)
- [ ] Combo/package deals
- [ ] Recipe & ingredient tracking
- [ ] Waste management
- [ ] Time-based pricing (happy hour)
- [ ] Course ordering (appetizer, main, dessert)
- [ ] Service charge & tax

#### Integration:
- [ ] GoFood, GrabFood webhook receiver
- [ ] Order aggregation dashboard
- [ ] Auto-accept orders (configurable)
- [ ] Driver tracking (basic)

#### Customer Features:
- [ ] Loyalty program (points)
- [ ] Member registration (mobile)
- [ ] QR code table ordering (self-service)
- [ ] Digital menu (customer view)

**Deliverable:**
- ✅ Full F&B POS ready
- ✅ KDS working in real kitchen
- ✅ Food delivery integration live
- ✅ 50+ F&B businesses onboarded

---

### **PHASE 3: Koperasi Pack (Weeks 15-22)** 🏦

**Goal:** Complete loan & savings management

#### Loan Management:
- [ ] Loan products (flat, anuitas, sliding rate)
- [ ] Application form & workflow
- [ ] Credit scoring (basic)
- [ ] Approval workflow (multi-level)
- [ ] Collateral tracking
- [ ] Disbursement
- [ ] Installment schedule generation
- [ ] Payment collection
- [ ] Early settlement
- [ ] Overdue tracking & aging
- [ ] Collection reminders (WhatsApp, SMS)
- [ ] NPL calculation

#### Savings Management:
- [ ] Simpanan wajib (mandatory)
- [ ] Simpanan sukarela (voluntary)
- [ ] Simpanan berjangka (time deposit)
- [ ] Account opening
- [ ] Deposit & withdrawal
- [ ] Interest calculation
- [ ] Passbook printing
- [ ] Transfer between accounts

#### Member Portal:
- [ ] Member registration (KTP verification)
- [ ] Member dashboard (mobile-first)
- [ ] Loan application (mobile)
- [ ] Payment history
- [ ] Savings balance
- [ ] Transaction notifications
- [ ] Document upload

#### Accounting & Compliance:
- [ ] Chart of accounts (COA) for koperasi
- [ ] GL posting automation
- [ ] SHU (Sisa Hasil Usaha) calculation
- [ ] SHU distribution
- [ ] Financial statements (Balance Sheet, P&L, Cash Flow)
- [ ] RAT (Rapat Anggota Tahunan) report
- [ ] OJK export format (if required)

**Deliverable:**
- ✅ Koperasi dapat manage loan & savings
- ✅ Member dapat apply loan via mobile
- ✅ Automated accounting
- ✅ 20+ koperasi using the system

---

### **PHASE 4: Scale & Expand (Weeks 23+)** 🚀

#### New Verticals:
- [ ] Beauty & Wellness (appointment booking)
- [ ] Services (job order tracking)
- [ ] Education (student enrollment, fee)
- [ ] Healthcare (EMR, prescription)

#### Platform Enhancement:
- [ ] API marketplace
- [ ] Webhook system
- [ ] White-label option
- [ ] Multi-language support
- [ ] Multi-currency
- [ ] Advanced analytics (BI dashboard)
- [ ] AI-powered insights
- [ ] Forecasting & demand planning

#### Scale Infrastructure:
- [ ] Load balancing
- [ ] Read replicas
- [ ] Caching strategy (Redis)
- [ ] CDN for assets
- [ ] Database sharding (if needed)
- [ ] Schema-per-tenant for enterprise

---

## 🏛️ ARCHITECTURE DECISIONS

### **1. Backend Stack - DECISION NEEDED**

**Option A: Laravel (Recommended for Solo/Small Team)**
```
✅ Pros:
- Built-in auth (Sanctum, Passport)
- Queue system (Redis, Database)
- ORM (Eloquent) powerful & easy
- File storage abstraction
- Scheduler (cron jobs)
- Large community & packages
- Fast development

❌ Cons:
- PHP (some devs prefer JS ecosystem)
- Less "modern" perception
```

**Option B: NestJS (Recommended for TypeScript Team)**
```
✅ Pros:
- TypeScript end-to-end
- Modular architecture (scalable)
- Dependency injection
- Microservice-ready
- GraphQL support
- Modern & trendy

❌ Cons:
- Steeper learning curve
- More boilerplate
- Need to setup many things manually
```

**Option C: Node.js + Express + Prisma (Middle Ground)**
```
✅ Pros:
- Flexible & lightweight
- Prisma ORM excellent
- TypeScript support
- Large npm ecosystem
- Easy to start

❌ Cons:
- Less structured than NestJS
- Need to build many abstractions
- Can become messy if not careful
```

**MY RECOMMENDATION:**
- **Solo developer + fast MVP needed?** → **Laravel**
- **Small TypeScript team + long-term vision?** → **NestJS**
- **Flexible & want simple?** → **Express + Prisma**

---

### **2. Database Strategy**

**Multi-tenancy Approach:**

```sql
-- Phase 1-3: Single Database + RLS (Row Level Security)
-- Pros: Simple, cost-effective, easy backup
-- Cons: Risk of data leak if RLS misconfigured

CREATE POLICY tenant_isolation ON products
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Phase 4+: Schema-per-tenant (Enterprise)
-- Pros: True isolation, custom schema per tenant
-- Cons: Migration complexity, more expensive

CREATE SCHEMA tenant_abc123;
CREATE SCHEMA tenant_def456;
```

**Database:**
- PostgreSQL 16+ (RLS support, JSONB, full-text search)
- Redis (cache, queue, session, real-time)

---

### **3. Frontend Architecture**

**Current Template:** React + Vite + TanStack Router

**Enhancements Needed:**
```
src/
├── contexts/
│   ├── tenant-context.tsx          # NEW: Tenant state
│   ├── outlet-context.tsx          # NEW: Current outlet
│   └── permission-context.tsx      # NEW: User permissions
├── features/
│   ├── platform/                   # NEW: Platform admin (superadmin)
│   ├── tenant/                     # NEW: Tenant management
│   ├── pos/                        # NEW: POS module
│   │   ├── cashier/
│   │   ├── products/
│   │   ├── transactions/
│   │   └── offline/                # Service Worker logic
│   ├── inventory/                  # NEW: Inventory module
│   ├── suppliers/                  # NEW: Supplier portal
│   ├── koperasi/                   # NEW: Loan & savings
│   │   ├── loans/
│   │   ├── savings/
│   │   └── members/
│   └── reports/                    # NEW: Reporting module
├── hooks/
│   ├── use-permissions.ts          # NEW: Permission checker
│   ├── use-feature-flag.ts         # NEW: Feature flag checker
│   └── use-offline-sync.ts         # NEW: Offline sync hook
├── lib/
│   ├── rbac.ts                     # NEW: RBAC utilities
│   ├── offline-db.ts               # NEW: IndexedDB wrapper
│   └── sync-engine.ts              # NEW: Sync algorithm
└── workers/
    └── service-worker.ts           # NEW: Offline PWA
```

**Component Patterns:**
```tsx
// Permission-based rendering
<Can permission="pos.transactions.create">
  <Button>New Transaction</Button>
</Can>

// Feature flag gating
<FeatureGate feature="offline_pos" plan="pro">
  <OfflineModeToggle />
</FeatureGate>

// Outlet context
const { currentOutlet, switchOutlet } = useOutlet();

// Tenant context
const { tenant } = useTenant();
```

---

### **4. Offline POS Architecture**

**Strategy:**

```
┌─────────────────────────────────────────┐
│     POS Cashier Interface (React)       │
└─────────────┬───────────────────────────┘
              │
              ├──[Online]──→ API Server ──→ Database
              │
              └──[Offline]─→ IndexedDB ──→ Sync Queue
                              │
                              └──[When Online]──→ Background Sync
```

**IndexedDB Schema:**
```typescript
// Store: transactions
{
  id: 'local_uuid',           // Local UUID
  serverId: null,             // null until synced
  tenantId: 'xxx',
  outletId: 'xxx',
  items: [...],
  total: 50000,
  status: 'pending_sync',     // pending_sync | synced | conflict
  idempotencyKey: 'uuid',     // Prevent duplicate
  timestamp: Date,
  syncAttempts: 0
}

// Store: sync_queue
{
  id: 'xxx',
  endpoint: '/api/transactions',
  method: 'POST',
  body: {...},
  headers: {...},
  retries: 0,
  maxRetries: 5,
  nextRetry: Date,
  status: 'pending'
}
```

**Sync Algorithm:**
```typescript
// 1. Queue transaction when offline
await queueTransaction(txData);

// 2. Background sync when online
self.addEventListener('sync', async (event) => {
  if (event.tag === 'sync-transactions') {
    await syncPendingTransactions();
  }
});

// 3. Idempotency check on server
if (await Transaction.exists({ idempotencyKey })) {
  return existingTransaction; // Already processed
}

// 4. Conflict resolution
if (conflict) {
  // Server wins (for now)
  // Log conflict for manual review
}
```

---

### **5. RBAC System Design**

**Hierarchy:**
```
Platform Level (Your Company)
└── Superadmin (manage all tenants)
    └── Developer (technical access)

Tenant Level (Each UMKM)
└── Owner (full access to tenant)
    └── Admin (manage users, settings)
        └── Manager (manage operations)
            └── Staff (limited access)
                └── Cashier (POS only)

External Level
└── Supplier (access supplier portal)
└── Member (koperasi member portal)
```

**Permission Format:**
```
{resource}.{action}.{scope}

Examples:
- pos.transactions.create.own_outlet
- pos.transactions.view.all_outlets
- inventory.stock.adjust.own_outlet
- inventory.reports.export.all_outlets
- koperasi.loans.approve.all
- suppliers.quotations.submit.own
```

**Database Schema:**
```sql
-- Roles
roles (id, tenant_id, name, level, is_system)

-- Permissions
permissions (id, resource, action, scope)

-- Role-Permission mapping
role_permissions (role_id, permission_id)

-- User-Role assignment
user_roles (user_id, role_id, outlet_id)

-- Feature entitlements (subscription-based)
tenant_entitlements (tenant_id, feature_key, enabled, plan_id)
```

---

### **6. Pricing & Subscription System**

**Plans Table:**
```sql
plans (
  id, 
  name,              -- Starter, Business, Pro, Enterprise
  price_per_outlet,  -- 129000, 299000, 599000
  max_outlets,       -- 1, 3, 10, unlimited
  max_users,         -- 2, 10, 30, unlimited
  max_transactions,  -- 1000, unlimited, unlimited
  features           -- JSONB: {offline_pos: true, kds: false, ...}
)
```

**Subscription Tracking:**
```sql
subscriptions (
  id,
  tenant_id,
  plan_id,
  status,            -- trial, active, suspended, canceled
  started_at,
  trial_ends_at,
  next_billing_at,
  current_period_start,
  current_period_end
)
```

**Add-ons:**
```sql
addon_subscriptions (
  id,
  subscription_id,
  addon_id,           -- koperasi_pack, whatsapp_ba, etc
  price,
  status
)
```

**Usage Tracking (for enforcement):**
```sql
usage_metrics (
  tenant_id,
  metric_type,       -- outlets, users, transactions
  current_value,
  limit_value,
  period_start,
  period_end
)
```

---

## 🔐 SECURITY CHECKLIST

### Authentication:
- [ ] JWT with refresh token
- [ ] Token rotation
- [ ] Password hashing (bcrypt/argon2)
- [ ] 2FA (TOTP) for sensitive roles
- [ ] Session management
- [ ] Rate limiting (login attempts)
- [ ] IP whitelist (for platform admin)

### Authorization:
- [ ] RBAC enforcement on all endpoints
- [ ] RLS policies on database
- [ ] Tenant isolation checks
- [ ] API key for integrations
- [ ] Webhook signature verification

### Data Protection:
- [ ] Encryption at rest (Postgres)
- [ ] Encryption in transit (TLS)
- [ ] PII data masking in logs
- [ ] PITR backup (Point-in-Time Recovery)
- [ ] Daily automated backups
- [ ] Backup testing (restore drill)

### Audit & Compliance:
- [ ] Audit trail (all mutations)
- [ ] Login/logout logging
- [ ] Permission changes logged
- [ ] Data export logging
- [ ] GDPR compliance (data deletion)
- [ ] KSP: OJK reporting format

---

## 📦 DELIVERABLES - LOCK THESE FIRST

Before coding, we MUST finalize:

### 1. **ERD (Entity Relationship Diagram)**
Complete database schema covering:
- [ ] Multi-tenancy (Tenant, Subscription, Plan)
- [ ] RBAC (User, Role, Permission)
- [ ] Outlet & Staff
- [ ] POS (Product, Transaction, Payment)
- [ ] Inventory (Stock, Movement, Adjustment)
- [ ] Supplier (Supplier, PO, GRN, Invoice)
- [ ] Koperasi (Loan, Savings, Member)
- [ ] Audit Trail

### 2. **Permission Matrix**
Excel/Notion table mapping:
- [ ] All roles (Platform, Tenant, Supplier, Member)
- [ ] All resources (POS, Inventory, Loans, Reports, etc)
- [ ] All actions (create, read, update, delete, approve, export)
- [ ] Scope (own_outlet, all_outlets, platform_wide)

### 3. **Feature Flag Schema**
List all features with:
- [ ] Feature key
- [ ] Required plan
- [ ] Description
- [ ] Default state
- [ ] Rollout strategy

### 4. **Offline POS Spec**
Technical document covering:
- [ ] Sync strategy
- [ ] Conflict resolution
- [ ] Idempotency implementation
- [ ] IndexedDB schema
- [ ] Service Worker lifecycle
- [ ] Error handling

### 5. **API Contract (Supplier Portal & Mobile)**
OpenAPI/Swagger spec for:
- [ ] Supplier endpoints
- [ ] Member endpoints
- [ ] Authentication flow
- [ ] Webhook payloads

---

## ❓ CRITICAL QUESTIONS FOR YOU

Before we start coding, I NEED answers to:

### **Team & Timeline:**
1. **Berapa orang di tim Anda?**
   - Solo? 2-3 orang? 5+ orang?
   
2. **Skill set tim?**
   - Frontend: React? Vue?
   - Backend: PHP? Node.js? Python?
   - Mobile: React Native? Flutter?
   
3. **Target launch MVP kapan?**
   - 3 bulan? 6 bulan? 1 tahun?
   
4. **Full-time atau part-time?**

### **Technical Stack:**
5. **Backend preference?**
   - Laravel (PHP)
   - NestJS (TypeScript)
   - Express + Prisma (Node.js)
   - Lainnya?

6. **Hosting plan?**
   - VPS (DigitalOcean, Vultr)
   - Cloud (AWS, GCP, Azure)
   - Shared hosting

7. **Budget untuk infrastructure?**
   - < $50/month
   - $50-200/month
   - $200-500/month
   - > $500/month

### **Business:**
8. **Fokus industry untuk MVP?**
   - F&B only
   - Retail only
   - F&B + Retail (recommended)

9. **Target beta users?**
   - 10 businesses
   - 50 businesses
   - 100+ businesses

10. **Sudah ada potential customers?**
    - Sudah ada yang commit
    - Ada yang tertarik
    - Belum ada (validasi dulu)

---

## 🚦 NEXT ACTIONS

**Jika Anda setuju dengan blueprint ini, pilih salah satu:**

### **Option A: Design First (Recommended)**
1. ✅ Lock ERD (database schema)
2. ✅ Lock Permission Matrix
3. ✅ Lock Feature Flags
4. ✅ Lock Offline POS Spec
5. → **Then start coding**

**Timeline:** 3-5 hari design → Coding bisa lebih cepat & terarah

### **Option B: Parallel Design + Code**
1. ✅ Lock ERD dulu (1-2 hari)
2. → Start Phase 0 backend (multi-tenancy)
3. → Design Permission Matrix sambil coding
4. → Lock other specs incrementally

**Timeline:** Lebih cepat tapi risk lebih besar (refactor nanti)

### **Option C: Prototype First**
1. → Code basic multi-tenant POS dulu (quick & dirty)
2. → Test dengan 5-10 beta users
3. → Gather feedback
4. → Redesign & refactor based on learning

**Timeline:** Fastest to market, tapi technical debt tinggi

---

## 💬 YOUR TURN

**Jawab pertanyaan di atas, lalu pilih:**

1. **Backend stack mana?** (Laravel / NestJS / Express+Prisma)
2. **Timeline target?** (3 bulan / 6 bulan / 1 tahun)
3. **Approach mana?** (Design First / Parallel / Prototype First)

Begitu Anda jawab, saya akan:
- 🎨 **Generate complete ERD** (Mermaid diagram + SQL DDL)
- 📊 **Create permission matrix** (detailed spreadsheet)
- 🚀 **Setup project structure** (folder, boilerplate, configs)
- 📝 **Create Phase 0 task breakdown** (actionable checklist)

**Ready untuk lock decisions dan mulai eksekusi?** 🔥
