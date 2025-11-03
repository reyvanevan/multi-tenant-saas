## Authentication Architecture Standards

### **URL Naming Conventions**

**Standard:** `/sign-in` (Primary)
- ✅ Professional naming convention used by major companies (Google, Microsoft, etc.)
- ✅ User-friendly and modern
- ✅ Clearly indicates authentication action
- ✅ SEO-friendly

**Alias:** `/login` (Redirect)
- Automatically redirects to `/sign-in` for backward compatibility
- Useful for users familiar with older conventions

### **Authentication Flow**

#### **1. Login Flow**
```
1. User navigates to /sign-in
2. Enters email/username + password
3. Frontend calls POST /api/v1/auth/login
4. Backend validates credentials
5. Returns { access_token, refresh_token, user }
6. Tokens stored in localStorage
7. Redirect to /_authenticated/ (dashboard)
8. User data shown in sidebar menu
```

#### **2. Protected Routes**
```
- Unauthenticated users → redirect to /sign-in
- Route guard checks isAuthenticated() before loading
- Access tokens auto-refresh on 401 errors
- Refresh token stored for token refresh
```

#### **3. Logout Flow**
```
1. User clicks avatar in sidebar → "Sign out"
2. Confirmation dialog appears
3. Click confirm → POST /api/v1/auth/logout
4. Backend invalidates refresh token
5. Frontend clears localStorage (access_token, refresh_token)
6. Auth store reset
7. Redirect to /sign-in
```

### **Token Management**

**Access Token (JWT)**
- Stored in `localStorage.access_token`
- Sent in `Authorization: Bearer <token>` header
- Auto-injected by API client
- Expires: ~15 minutes (backend configured)

**Refresh Token**
- Stored in `localStorage.refresh_token`
- Sent only to `/auth/refresh` endpoint
- Used to get new access token
- Expires: ~7 days (backend configured)

**Token Refresh Strategy**
- API client interceptor catches 401 responses
- Automatically calls POST `/api/v1/auth/refresh`
- Original request retried with new token
- Falls back to logout if refresh fails

### **File Structure**

```
frontend/src/
├── services/
│   └── auth.service.ts        # All auth API calls
├── stores/
│   └── auth-store.ts          # Zustand store with persistence
├── types/
│   └── auth.types.ts          # TypeScript interfaces
├── lib/
│   ├── api-client.ts          # Axios with interceptors
│   ├── route-guards.ts        # Route protection logic
│   └── env.ts                 # Environment config
├── components/
│   └── sign-out-dialog.tsx    # Logout confirmation
└── routes/
    ├── (auth)/
    │   ├── sign-in.tsx        # Main login page
    │   └── login.tsx          # Redirect alias
    └── _authenticated/        # Protected routes
```

### **Key Functions**

**Auth Service**
- `login(credentials)` - Authenticate user
- `logout()` - Logout with backend call
- `refreshToken()` - Get new access token
- `getCurrentUser()` - Fetch user profile
- `isAuthenticated()` - Check auth status

**Route Guards**
- `isAuthenticated()` - Check if user logged in
- `getCurrentUser()` - Get user from store
- `hasRole(roles)` - Check permissions
- `requireAuth()` - Guard for protected routes
- `requireRole(roles)` - Guard with role check

**Auth Store** (Zustand)
- State: `user`, `isAuthenticated`, `isLoading`, `error`
- Persisted to localStorage
- Actions: `login`, `logout`, `register`, `refreshToken`, etc.

### **API Endpoints**

All endpoints prefixed with `/api/v1`

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/auth/login` | ❌ | User login |
| POST | `/auth/logout` | ✅ | User logout |
| POST | `/auth/refresh` | ❌ | Refresh access token |
| GET | `/auth/me` | ✅ | Get current user |
| POST | `/auth/register` | ❌ | User registration |
| POST | `/auth/change-password` | ✅ | Change password |

### **Environment Configuration**

`frontend/.env`
```properties
VITE_API_URL=https://multi-tenant-saas-production-175e.up.railway.app
VITE_API_PREFIX=/api/v1
VITE_API_TIMEOUT=30000
VITE_ENVIRONMENT=development
```

**Development**
- API URL: `http://localhost:3000` (or Railway production)
- Auto-refresh tokens: enabled
- Dev tools: enabled

**Production**
- API URL: Railway production URL
- CORS configured for frontend domain
- Secure tokens: httpOnly (handled by backend)

### **Security Best Practices**

✅ **Implemented**
- Tokens stored in localStorage (not cookies for CORS)
- JWT auto-refresh mechanism
- Route guards on all protected pages
- CORS enabled only for trusted origins
- Logout invalidates tokens on backend
- Password min 7 characters

⚠️ **Future Enhancements**
- Add httpOnly cookies for extra security
- Implement token rotation
- Add suspicious activity detection
- Two-factor authentication (2FA)
- Session timeout with user notification
- Remember me functionality

### **Common Issues & Solutions**

| Issue | Solution |
|-------|----------|
| CORS error | Update `CORS_ORIGIN` in Railway backend |
| 401 Unauthorized | Token expired, auto-refresh attempts |
| 403 Forbidden | Insufficient permissions, check role |
| Network Error | Check backend is running, internet connection |
| Tokens not persisting | Check localStorage is enabled, check browser |
| Login hangs | Check backend health endpoint, network tab |

---

**Last Updated:** November 3, 2025
**Status:** ✅ Production Ready
**Tested Credentials:** 
- superadmin@demo.com / password123
- admin@demo.com / password123
- cashier@demo.com / password123
