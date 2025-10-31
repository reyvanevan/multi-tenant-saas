# 🚀 Railway Deployment Guide

## Step-by-Step Deployment Instructions

### 1. Create Railway Account & Project

1. **Go to Railway**: https://railway.app/
2. **Sign up/Login** with GitHub (recommended for auto-deploy)
3. **Click "New Project"**
4. **Choose "Deploy from GitHub repo"**
5. **Select**: `reyvanevan/nestjs-multi-tenant-saas`
6. **Click "Deploy"**

### 2. Add PostgreSQL Database

1. In your Railway project dashboard
2. **Click "New"** → **"Database"** → **"PostgreSQL"**
3. Wait for database to provision (~30 seconds)
4. PostgreSQL will auto-generate:
   - `DATABASE_URL` (connection string)
   - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

### 3. Configure Environment Variables

In Railway dashboard, go to your **backend service** → **Variables** tab:

```env
# Database (will be auto-filled by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT Secrets (IMPORTANT: Generate strong random strings!)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars-long-change-this

# Application
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1

# Upload Settings
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg

# CORS (Update with your frontend URL after deploying)
CORS_ORIGIN=https://your-frontend-domain.vercel.app,http://localhost:5174
```

**🔐 Generate Strong JWT Secrets:**

Option A - Use Node.js (run this in terminal):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Option B - Use Online Generator:
https://generate-secret.vercel.app/32

Option C - Use this PowerShell command:
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | % {[char]$_})
```

### 4. Setup Database Schema

Railway doesn't auto-run migrations. We need to do it manually:

**Option A - Using Railway CLI (Recommended):**

1. Install Railway CLI:
```powershell
npm install -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Link to project:
```bash
cd backend
railway link
```

4. Run migrations:
```bash
railway run npx prisma migrate deploy
```

5. Seed database (optional):
```bash
railway run npx prisma db seed
```

**Option B - Using Railway Terminal (Web):**

1. In Railway dashboard → Your backend service
2. Click **"Settings"** → **"Deploy Logs"**
3. Find the **"Shell"** or **"Terminal"** icon
4. Run commands:
```bash
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

**Option C - Add to package.json (Auto-migration):**

This will run migrations automatically on deploy.

Edit `backend/package.json`, add to scripts:
```json
{
  "scripts": {
    "postinstall": "npx prisma generate",
    "prebuild": "npx prisma migrate deploy"
  }
}
```

⚠️ **Warning**: Auto-migration can be risky in production. Use with caution.

### 5. Verify Deployment

1. Wait for deployment to complete (~2-5 minutes)
2. Railway will provide a public URL: `https://your-app.up.railway.app`
3. **Test endpoints:**

   - Health check: `https://your-app.up.railway.app/health`
   - API docs: `https://your-app.up.railway.app/api/docs`
   - Auth test: `https://your-app.up.railway.app/api/v1/auth/register`

### 6. Custom Domain (Optional)

1. In Railway dashboard → Your service → **Settings** → **Domains**
2. Click **"Generate Domain"** for free `.railway.app` domain
3. Or add your own custom domain:
   - Click **"Custom Domain"**
   - Enter your domain (e.g., `api.yourdomain.com`)
   - Follow DNS instructions to add CNAME record

---

## Troubleshooting

### Issue: Build fails with Prisma errors

**Solution**: Make sure `prisma generate` runs before build.

Add to `backend/package.json`:
```json
{
  "scripts": {
    "postinstall": "npx prisma generate"
  }
}
```

### Issue: Database connection fails

**Solution**: Check DATABASE_URL is correctly set.

In Railway → Postgres service → **Variables** tab:
- Copy `DATABASE_URL`
- Paste in backend service variables

### Issue: Migrations don't run

**Solution**: Manually run migrations via Railway terminal or CLI.

### Issue: CORS errors from frontend

**Solution**: Update `CORS_ORIGIN` environment variable:
```env
CORS_ORIGIN=https://your-frontend-url.vercel.app,http://localhost:5174
```

---

## Post-Deployment Checklist

- [ ] Backend deployed successfully
- [ ] Database provisioned
- [ ] Migrations executed
- [ ] Environment variables configured
- [ ] Health check endpoint responding
- [ ] Swagger docs accessible
- [ ] Test registration endpoint
- [ ] Test login endpoint
- [ ] CORS configured for frontend

---

## Next Steps

After successful deployment:

1. **Save URLs**:
   - Backend URL: `https://______.up.railway.app`
   - Database URL: (from Railway Postgres variables)
   - Swagger Docs: `https://______.up.railway.app/api/docs`

2. **Update Frontend**:
   - Set `VITE_API_URL` in frontend `.env`
   - Example: `VITE_API_URL=https://your-backend.up.railway.app/api/v1`

3. **Test Integration**:
   - Try signup from frontend
   - Try login
   - Check context endpoint: `/api/v1/auth/me/context`

---

## Railway Free Tier Limits

- **$5 free credits/month** (enough for small projects)
- **500 hours/month** execution time
- **100 GB bandwidth**
- **1 GB RAM** per service
- **Automatically sleeps** after 5 minutes of inactivity (wakes on request)

**Tips to save credits**:
- Remove old deployments
- Use only 1 backend instance
- Optimize database queries
- Add indexes to frequently queried fields

---

## Support

If deployment fails, check:
1. Railway status: https://status.railway.app/
2. Build logs in Railway dashboard
3. Runtime logs in Railway dashboard
4. Ask in Railway Discord: https://discord.gg/railway

