# 🚀 NestJS Multi-Tenant SaaS Backend Template

A production-ready, enterprise-grade NestJS backend template for building multi-tenant SaaS applications with comprehensive POS, inventory, and business management features.

## ✨ Features

### 🔐 Authentication & Authorization
- **JWT Authentication** with access & refresh tokens
- **Role-Based Access Control (RBAC)** with granular permissions
- **Multi-level User Management** (Superadmin, Tenant Admin, Outlet Manager, Staff)
- **Secure Password Management** with bcrypt hashing
- **Session Management** with token refresh mechanism

### 🏢 Multi-Tenancy Architecture
- **Complete Tenant Isolation** at database level
- **Multi-Outlet Support** per tenant
- **Hierarchical Data Structure**: Tenant → Outlets → Users → Resources
- **Subscription-Based Access Control** with usage limits
- **Tenant-Specific Settings** and configurations

### 🛍️ Point of Sale (POS) System
- **Transaction Management** with complete CRUD operations
- **Multiple Payment Methods** (Cash, Card, E-wallet, Transfer)
- **Shift Management** with opening/closing balances
- **Receipt Generation** with customizable templates
- **Refund Processing** with audit trails
- **Transaction Search & Filters** with pagination

### 📦 Product & Inventory Management
- **Product Catalog** with categories and variants
- **Stock Tracking** with real-time updates
- **Stock Adjustments** with reason tracking
- **Low Stock Alerts** and notifications
- **Batch Operations** for bulk updates
- **Product Pricing Tiers** for different customer segments
- **Product Activation/Deactivation** without deletion

### 📊 Advanced Reporting
- **Sales Reports** with date ranges and filters
- **End-of-Day (EOD) Reports** with shift summaries
- **Performance Analytics** per outlet and staff
- **Inventory Movement Reports**
- **Custom Report Generation** with export to Excel/PDF
- **Real-time Dashboard Metrics**

### 💰 Subscription & Billing
- **Flexible Subscription Plans** (Basic, Professional, Enterprise)
- **Usage-Based Billing** with metered features
- **Subscription Lifecycle Management** (trial, active, suspended, cancelled)
- **Automatic Limit Enforcement** based on plan
- **Billing History** and invoice generation

### 🔍 Audit & Compliance
- **Comprehensive Audit Logs** for all critical operations
- **Entity Change Tracking** with before/after values
- **User Action History** with IP and timestamp
- **Data Retention Policies**
- **GDPR-Compliant Data Handling**

### 🎯 Additional Features
- **Discount Management** (percentage, fixed, BOGO)
- **Supplier Management** with contact tracking
- **Alert System** for business events
- **Feature Flags** for gradual rollouts
- **File Upload** with validation and storage
- **Swagger API Documentation** auto-generated
- **Health Check Endpoints** for monitoring

## 🛠️ Tech Stack

- **Framework**: NestJS 11.0.1 (Node.js TypeScript framework)
- **Language**: TypeScript 5.7.3
- **Database**: PostgreSQL 16 with Prisma ORM 6.18.0
- **Authentication**: JWT with Passport.js
- **Validation**: class-validator & class-transformer
- **API Documentation**: Swagger/OpenAPI 3.0
- **Testing**: Jest (unit & e2e tests)
- **Code Quality**: ESLint, Prettier

## 📋 Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- pnpm >= 8.0.0 (or npm/yarn)

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/reyvanevan/nestjs-multi-tenant-saas.git
cd nestjs-multi-tenant-saas
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/yourdatabase"

# JWT
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-key-change-in-production"

# Application
PORT=3000
NODE_ENV=development
API_PREFIX=/api/v1

# Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg

# CORS
CORS_ORIGIN=http://localhost:5174,http://localhost:3000
```

### 4. Setup Database
```bash
# Generate Prisma Client
pnpm prisma generate

# Run Migrations
pnpm prisma migrate deploy

# Seed Database (optional)
pnpm prisma db seed
```

### 5. Start Application
```bash
# Development mode with hot-reload
pnpm run start:dev

# Production mode
pnpm run build
pnpm run start:prod
```

### 6. Access API Documentation
Open your browser and navigate to:
- **Swagger UI**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/health

## 📚 API Documentation

### Authentication
```bash
POST /api/v1/auth/register          # Register new tenant
POST /api/v1/auth/login             # Login user
POST /api/v1/auth/refresh           # Refresh access token
POST /api/v1/auth/logout            # Logout user
GET  /api/v1/auth/me                # Get current user
```

### Products
```bash
GET    /api/v1/products             # List products (paginated)
GET    /api/v1/products/:id         # Get product details
POST   /api/v1/products             # Create product
PATCH  /api/v1/products/:id         # Update product
DELETE /api/v1/products/:id         # Delete product
PATCH  /api/v1/products/:id/toggle-active  # Activate/Deactivate
PATCH  /api/v1/products/:id/adjust-stock   # Adjust stock
GET    /api/v1/products/low-stock   # Get low stock products
```

### Transactions
```bash
GET    /api/v1/transactions         # List transactions
GET    /api/v1/transactions/:id     # Get transaction details
POST   /api/v1/transactions         # Create transaction
POST   /api/v1/transactions/:id/refund  # Process refund
```

### Reports
```bash
GET    /api/v1/reports/sales        # Sales report
GET    /api/v1/reports/eod          # End of day report
GET    /api/v1/reports/performance  # Performance analytics
```

### Full API documentation available at `/api/docs` when server is running.

## 🏗️ Architecture

### Multi-Tenant Data Isolation
```
Tenant (Koperasi A)
├── Outlets (Toko Pusat, Cabang 1, Cabang 2)
│   ├── Users (Manager, Cashiers, Staff)
│   ├── Products (isolated per outlet)
│   ├── Transactions (isolated per outlet)
│   └── Inventory (isolated per outlet)
└── Subscription (Plan limits & features)
```

### Database Schema
- **10 Core Modules**: Auth, Tenants, Outlets, Users, Products, Transactions, Inventory, Reports, Billing, Audit
- **40+ Tables** with optimized relationships
- **Row-Level Security** via tenant_id and outlet_id
- **Soft Deletes** for data recovery
- **Audit Triggers** for change tracking

### Permission System
```typescript
// Role hierarchy: Superadmin > Tenant Admin > Outlet Manager > Cashier > Staff

// Permission examples:
- products:read          // View products
- products:create        // Create products
- products:update        // Update products
- products:delete        // Delete products
- transactions:create    // Process sales
- reports:view           // View reports
- users:manage           // Manage users
```

## 🧪 Testing

```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

## 📦 Deployment

### Docker Deployment
```bash
# Build image
docker build -t nestjs-saas-backend .

# Run with Docker Compose
docker-compose up -d
```

### Environment Variables (Production)
```env
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@db-host:5432/production-db"
JWT_SECRET="use-strong-random-secret-here"
JWT_REFRESH_SECRET="use-another-strong-secret"
CORS_ORIGIN="https://yourdomain.com"
```

### Database Migrations
```bash
# Generate migration
pnpm prisma migrate dev --name your_migration_name

# Apply migrations in production
pnpm prisma migrate deploy
```

## 🔧 Configuration

### Swagger Configuration
Swagger UI includes JWT authentication:
1. Login via `/api/v1/auth/login`
2. Copy the `accessToken` from response
3. Click "Authorize" button in Swagger UI
4. Enter: `Bearer <your_token>`
5. All subsequent requests will include the token

### File Upload Configuration
- **Max file size**: 5MB (configurable)
- **Allowed types**: JPEG, PNG, JPG
- **Storage**: Local filesystem (can be extended to S3/Cloud Storage)

### CORS Configuration
Configure allowed origins in `.env`:
```env
CORS_ORIGIN=http://localhost:5174,https://yourdomain.com
```

## 📖 Documentation Files

- `DATABASE_SCHEMA.md` - Complete database schema documentation
- `AUDIT_SYSTEM_SUMMARY.md` - Audit logging implementation details
- `PERMISSION_MATRIX.md` - Complete RBAC permission matrix
- `FEATURE_FLAGS.md` - Feature flag system documentation
- `TECHNICAL_BLUEPRINT.md` - System architecture and design decisions

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [NestJS](https://nestjs.com/)
- Database with [Prisma](https://www.prisma.io/)
- Authentication with [Passport.js](http://www.passportjs.org/)

## 📧 Contact

Reyvan Evan - [@reyvanevan](https://github.com/reyvanevan)

Project Link: [https://github.com/reyvanevan/nestjs-multi-tenant-saas](https://github.com/reyvanevan/nestjs-multi-tenant-saas)

---

⭐ **Star this repo if you find it helpful!**
