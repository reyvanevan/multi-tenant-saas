# 🐛 Railway Deployment Troubleshooting Log

## Issue #1: "Error creating build plan with Railpack"
**Date:** Nov 1, 2025  
**Error:** Railway couldn't find package.json in root directory

**Root Cause:**
- Backend code is in `/backend` subfolder
- Railway default: looks for package.json in root

**Solution:**
- Created `railway.json` with custom build configuration
- Created `nixpacks.toml` for Nixpacks configuration

**Result:** ✅ Fixed, but led to Issue #2

---

## Issue #2: "pnpm-lock.yaml not found"
**Date:** Nov 1, 2025  
**Error:**
```
ERROR: failed to build: failed to solve: failed to compute cache key: 
failed to calculate checksum of ref: "/pnpm-lock.yaml": not found
```

**Root Cause:**
- Frontend uses **pnpm** (has `pnpm-lock.yaml` in root)
- Backend uses **npm** (has `package-lock.json` in backend/)
- Nixpacks auto-detected pnpm and tried to use it for backend
- Backend doesn't have pnpm-lock.yaml → build failed

**Solution:**
- Switched from NIXPACKS to **DOCKERFILE builder**
- Created `Dockerfile.railway` specifically for Railway deployment
- Dockerfile explicitly uses npm and targets backend/ subfolder
- Added `.dockerignore` to exclude unnecessary files

**Files Created:**
1. `Dockerfile.railway` - Multi-stage Docker build
2. `.dockerignore` - Exclude frontend, node_modules, etc
3. Updated `railway.json` - Use Dockerfile builder

**Result:** ✅ Should fix the build issue

---

## Key Learnings

### 1. Monorepo Structure Challenges
When you have:
```
/
├── frontend/      (uses pnpm)
├── backend/       (uses npm)
└── ...
```

Railway/Nixpacks can get confused about which package manager to use.

### 2. Solution Options

**Option A: Separate Repos** ⭐ Best for simplicity
- Deploy backend from: `reyvanevan/backend`
- Deploy frontend from: `reyvanevan/frontend`

**Option B: Dockerfile** ⭐ Best for monorepo (current solution)
- Explicit build instructions
- No auto-detection conflicts
- Full control over build process

**Option C: Railway.toml**
- Configure root directory per service
- Set custom build commands
- Still relies on auto-detection

### 3. Dockerfile Strategy

Our `Dockerfile.railway` uses **multi-stage build**:

1. **deps stage** - Install all dependencies
2. **builder stage** - Generate Prisma + Build NestJS
3. **runner stage** - Production-only, minimal image

Benefits:
- ✅ Smaller final image (~200MB vs 1GB+)
- ✅ Faster deployments
- ✅ Better security (no dev dependencies in prod)
- ✅ Layer caching for faster rebuilds

---

## Next Deployment Steps

After Railway auto-redeploys:

1. **Check Build Logs**
   - Should show Dockerfile stages
   - Look for successful Prisma generation
   - Verify npm install completes

2. **Add PostgreSQL Database**
   - Railway Dashboard → New → PostgreSQL
   - Auto-generates DATABASE_URL

3. **Set Environment Variables**
   ```env
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=...
   JWT_REFRESH_SECRET=...
   NODE_ENV=production
   PORT=3000
   API_PREFIX=/api/v1
   CORS_ORIGIN=http://localhost:5174
   ```

4. **Run Migrations**
   ```bash
   railway run npx prisma migrate deploy
   railway run npx prisma db seed
   ```

5. **Test Endpoints**
   - Health: `https://[app].up.railway.app/health`
   - Swagger: `https://[app].up.railway.app/api/docs`

---

## Common Railway Issues

### Issue: Build succeeds but app crashes on startup
**Check:**
- Environment variables set correctly?
- DATABASE_URL connected?
- Port matches Railway's PORT env var?

### Issue: Database connection timeout
**Solution:**
- Ensure DATABASE_URL uses internal Railway URL
- Check security group/firewall settings
- Verify database is in same region

### Issue: Prisma Client not generated
**Solution:**
- Add `npx prisma generate` to build commands
- Check if @prisma/client is in dependencies (not devDependencies)

---

## Useful Railway Commands

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# View logs
railway logs

# Run command in Railway environment
railway run [command]

# Deploy manually
railway up

# Open in browser
railway open
```

---

---

## Issue #3: "Prisma not found" / Wrong Docker Context
**Date:** Nov 3, 2025  
**Error:**
```
ERROR: failed to compute cache key: "/prisma": not found
```

**Root Cause:**
- Railway auto-detected `backend/Dockerfile` instead of using `railway.json` config
- Docker build context was ROOT but Dockerfile expected files in backend/
- Railway ignored explicit configuration files

**Solution:**
- **Switched to NIXPACKS builder** (no Docker)
- Renamed all Dockerfiles to `.backup` to prevent auto-detection
- Created `railway.toml` at root with explicit build commands
- Updated `nixpacks.toml` with correct backend path

**Files Updated:**
1. `railway.toml` - Root-level Railway config (NIXPACKS)
2. `railway.json` - Updated to use NIXPACKS
3. `nixpacks.toml` - Fixed commands with proper cd backend
4. Renamed `Dockerfile*` → `Dockerfile*.backup` (prevent auto-detect)

**Result:** ✅ Railway should now use NIXPACKS with explicit commands

---

**Last Updated:** Nov 3, 2025  
**Status:** Switched to NIXPACKS builder, Dockerfiles disabled
