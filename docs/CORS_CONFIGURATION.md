# 🔐 CORS Configuration Guide

## Current Status

**Production Backend URL:**
```
https://multi-tenant-saas-production-175e.up.railway.app
```

**Current CORS Settings:**
```
CORS_ORIGIN=http://localhost:5174,https://healthcheck.railway.app
```

---

## 🚀 When Frontend is Deployed

### Step 1: Get Frontend Production URL

After deploying frontend to Vercel/Netlify, you'll get a URL like:
```
https://your-app-name.vercel.app
```

### Step 2: Update Railway Environment Variable

1. Go to Railway Dashboard
2. Select `multi-tenant-saas` project
3. Go to backend service
4. Click "Variables" tab
5. Update `CORS_ORIGIN`:

**Before:**
```
CORS_ORIGIN=http://localhost:5174,https://healthcheck.railway.app
```

**After:**
```
CORS_ORIGIN=http://localhost:5174,https://your-frontend-url.vercel.app,https://healthcheck.railway.app
```

### Step 3: Redeploy Backend (Auto-triggered)

Railway will automatically redeploy the backend with new environment variables.

---

## 📝 Code Reference

**Backend CORS configuration:** `backend/src/main.ts`

```typescript
// Enable CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5174',
  'http://localhost:5174',
  'http://localhost:3000',
];

// Allow Railway healthcheck requests
if (process.env.NODE_ENV === 'production') {
  allowedOrigins.push('https://healthcheck.railway.app');
}

app.enableCors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
});
```

---

## ✅ Verification

After updating CORS, test:

```bash
# From frontend app
curl -H "Origin: https://your-frontend-url.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://multi-tenant-saas-production-175e.up.railway.app/api/v1/auth/login

# Should return 200 OK with CORS headers
```

Or test from browser console:
```javascript
fetch('https://multi-tenant-saas-production-175e.up.railway.app/api/v1/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com', password: 'test123' })
})
.then(r => r.json())
.then(console.log)
```

---

## 🔧 Additional Allowed Origins (If Needed)

If you need to allow multiple frontend URLs:

```
CORS_ORIGIN=http://localhost:5174,https://frontend-dev.vercel.app,https://frontend-prod.vercel.app,https://healthcheck.railway.app
```

---

## ⚠️ Security Notes

- ✅ Only allow specific trusted origins
- ❌ Never set `CORS_ORIGIN=*` in production
- ✅ Always include `https://` in production URLs
- ✅ Keep `https://healthcheck.railway.app` for Railway monitoring
- ✅ Test CORS changes immediately after deployment

---

## 🚨 If CORS Fails

**Error in browser:**
```
Access to XMLHttpRequest from origin 'https://yoursite.com' 
has been blocked by CORS policy
```

**Solutions:**
1. Check frontend URL is in `CORS_ORIGIN`
2. Verify environment variable was updated
3. Ensure Railway has redeployed (check Deploy tab)
4. Clear browser cache (Ctrl+Shift+R)
5. Test in incognito mode

---

**Last Updated:** November 3, 2025

**Next Step:** Update CORS after frontend deployment is ready!
