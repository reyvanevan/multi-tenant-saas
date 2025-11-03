# 🚀 Platform Roles Migration Guide

## Overview
This migration adds support for **Platform-level users** who are not tied to any specific tenant or outlet.

## Changes Made

### 1. Database Schema Changes
- `users.tenantId`: `String` → `String?` (nullable)
- `users.tenant`: `Tenant` → `Tenant?` (optional relation)
- `roles.tenantId`: `String` → `String?` (nullable)  
- `roles.tenant`: `Tenant` → `Tenant?` (optional relation)

### 2. New Platform Roles
- **SUPER_ADMIN** (Level 100) - Full platform access
- **DEVELOPER** (Level 90) - Technical access, debugging
- **SUPPORT** (Level 50) - Customer support, view-only
- **BILLING_ADMIN** (Level 80) - Billing & subscriptions

### 3. New Platform Users
All with password: `password123`

| Role | Email | Access |
|------|-------|--------|
| SUPER_ADMIN | `superadmin@platform.com` | Full platform management |
| DEVELOPER | `developer@platform.com` | Technical access |
| SUPPORT | `support@platform.com` | Customer support |
| BILLING_ADMIN | `billing@platform.com` | Billing management |

### 4. Existing Tenant Users (Unchanged)
- `admin@demo.com` - Tenant admin (Demo Koperasi)
- `cashier@demo.com` - Cashier (Demo Koperasi)

## Deployment Steps

### Option 1: Railway CLI (Recommended)

```bash
# 1. Push code to GitHub
git add .
git commit -m "feat: add platform roles and nullable tenantId"
git push origin main

# 2. Wait for Railway auto-deploy to complete

# 3. Run migration on Railway
railway run npx prisma migrate deploy

# 4. Run seed on Railway
railway run npm run seed
```

### Option 2: Railway Dashboard

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "feat: add platform roles and nullable tenantId"
   git push origin main
   ```

2. **Wait for auto-deploy** in Railway dashboard

3. **Open Railway Shell** (in project settings)

4. **Run commands:**
   ```bash
   npx prisma migrate deploy
   npm run seed
   ```

### Option 3: Using Migration Script

```bash
# Railway CLI
railway run ./scripts/railway-migrate.sh

# Or PowerShell (local testing)
./backend/scripts/railway-migrate.ps1
```

## Verification

After migration, verify by logging in:

### Platform Users (No Tenant Context)
```bash
# Test login
curl -X POST https://your-backend.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"superadmin@platform.com","password":"password123"}'
```

Expected response:
```json
{
  "user": {
    "id": "...",
    "tenantId": null,  // ✅ Should be null
    "outletId": null,  // ✅ Should be null
    "email": "superadmin@platform.com",
    "role": {
      "name": "SUPER_ADMIN",
      "level": 100
    }
  }
}
```

### Tenant Users (With Tenant Context)
```bash
# Test login
curl -X POST https://your-backend.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"admin@demo.com","password":"password123"}'
```

Expected response:
```json
{
  "user": {
    "id": "...",
    "tenantId": "76b06d61-...",  // ✅ Should have tenantId
    "outletId": "292af3a2-...",  // ✅ Should have outletId
    "email": "admin@demo.com"
  }
}
```

## Rollback Plan

If something goes wrong:

```bash
# Railway CLI
railway run npx prisma migrate resolve --rolled-back 20241103000000_add_platform_roles

# Then restore from backup
railway run npx prisma db push --skip-generate
```

## Next Steps

After successful migration:
1. Update frontend to handle platform vs tenant users
2. Implement platform admin UI (`/_platform/`)
3. Update auth guards for role-based routing
4. Test all user flows

## Troubleshooting

### Error: "Type 'null' is not assignable to type 'string'"
- This is a VS Code TypeScript cache issue
- Solution: Restart VS Code or reload window
- Prisma client is correctly generated with nullable types

### Error: "P2002: Unique constraint failed"
- Seed might have run before
- Solution: Clear existing platform users first or use `upsert` (already implemented)

### Error: "Cannot find module '@prisma/client'"
- Prisma client not generated
- Solution: Run `npx prisma generate`

## Migration SQL Preview

```sql
-- AlterTable User.tenantId to nullable
ALTER TABLE "users" ALTER COLUMN "tenantId" DROP NOT NULL;

-- AlterTable Role.tenantId to nullable  
ALTER TABLE "roles" ALTER COLUMN "tenantId" DROP NOT NULL;

-- Add index for platform users (tenantId = NULL)
CREATE INDEX "users_tenantId_null_idx" ON "users"("tenantId") 
  WHERE "tenantId" IS NULL;
CREATE INDEX "roles_tenantId_null_idx" ON "roles"("tenantId") 
  WHERE "tenantId" IS NULL;
```

## Resources

- Schema: `backend/prisma/schema.prisma`
- Migration: `backend/prisma/migrations/20241103000000_add_platform_roles/`
- Seed: `backend/prisma/seed.ts`
- Scripts: `backend/scripts/railway-migrate.{sh,ps1}`
