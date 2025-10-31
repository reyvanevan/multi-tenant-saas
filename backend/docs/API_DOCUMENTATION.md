# API Documentation

Complete REST API reference for NestJS Multi-Tenant SaaS Backend.

**Base URL**: `http://localhost:3000/api/v1`

**Authentication**: Bearer Token (JWT) required for protected endpoints

---

## 🔐 Authentication

### Register Tenant
Create a new tenant account (includes admin user).

**Endpoint**: `POST /auth/register`

**Request Body**:
```json
{
  "email": "admin@koperasi.com",
  "password": "SecurePass123!",
  "name": "Koperasi Bermadani",
  "phone": "+62812345678"
}
```

**Response** (201 Created):
```json
{
  "message": "Tenant registered successfully",
  "tenant": {
    "id": 1,
    "name": "Koperasi Bermadani",
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00.000Z"
  },
  "user": {
    "id": 1,
    "email": "admin@koperasi.com",
    "name": "Koperasi Bermadani"
  }
}
```

---

### Login
Authenticate user and receive tokens.

**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "email": "admin@koperasi.com",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@koperasi.com",
    "name": "Koperasi Bermadani",
    "role": "tenant_admin",
    "tenant": {
      "id": 1,
      "name": "Koperasi Bermadani"
    }
  }
}
```

---

### Refresh Token
Get new access token using refresh token.

**Endpoint**: `POST /auth/refresh`

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Get Current User
Get authenticated user profile.

**Endpoint**: `GET /auth/me`

**Headers**: `Authorization: Bearer <access_token>`

**Response** (200 OK):
```json
{
  "id": 1,
  "email": "admin@koperasi.com",
  "name": "Koperasi Bermadani",
  "role": {
    "id": 1,
    "name": "tenant_admin",
    "permissions": [
      "products:read",
      "products:create",
      "products:update",
      "products:delete"
    ]
  },
  "tenant": {
    "id": 1,
    "name": "Koperasi Bermadani"
  },
  "outlet": {
    "id": 1,
    "name": "Toko Pusat"
  }
}
```

---

### Logout
Invalidate current refresh token.

**Endpoint**: `POST /auth/logout`

**Headers**: `Authorization: Bearer <access_token>`

**Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

---

## 📦 Products

### List Products
Get paginated list of products.

**Endpoint**: `GET /products`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by name or SKU
- `categoryId` (optional): Filter by category
- `isActive` (optional): Filter by active status (true/false)
- `sortBy` (optional): Sort field (name, price, stock, createdAt)
- `sortOrder` (optional): Sort direction (asc, desc)

**Example Request**:
```
GET /products?page=1&limit=10&search=kopi&sortBy=name&sortOrder=asc
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "name": "Kopi Arabica",
      "sku": "KOP-001",
      "description": "Kopi arabica premium",
      "price": 25000,
      "stock": 50,
      "isActive": true,
      "categoryId": 1,
      "category": {
        "id": 1,
        "name": "Minuman"
      },
      "outlet": {
        "id": 1,
        "name": "Toko Pusat"
      },
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

---

### Get Product Details
Get detailed information for a specific product.

**Endpoint**: `GET /products/:id`

**Response** (200 OK):
```json
{
  "id": 1,
  "name": "Kopi Arabica",
  "sku": "KOP-001",
  "description": "Kopi arabica premium dari Aceh",
  "price": 25000,
  "stock": 50,
  "minStock": 10,
  "isActive": true,
  "categoryId": 1,
  "category": {
    "id": 1,
    "name": "Minuman",
    "description": "Berbagai jenis minuman"
  },
  "outlet": {
    "id": 1,
    "name": "Toko Pusat"
  },
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

---

### Create Product
Create a new product.

**Endpoint**: `POST /products`

**Required Permission**: `products:create`

**Request Body**:
```json
{
  "name": "Teh Hijau Organik",
  "sku": "TEH-001",
  "description": "Teh hijau organik tanpa pemanis",
  "price": 15000,
  "stock": 100,
  "minStock": 20,
  "categoryId": 1,
  "outletId": 1
}
```

**Response** (201 Created):
```json
{
  "id": 2,
  "name": "Teh Hijau Organik",
  "sku": "TEH-001",
  "description": "Teh hijau organik tanpa pemanis",
  "price": 15000,
  "stock": 100,
  "minStock": 20,
  "isActive": true,
  "categoryId": 1,
  "outletId": 1,
  "createdAt": "2024-01-15T11:00:00.000Z"
}
```

---

### Update Product
Update existing product.

**Endpoint**: `PATCH /products/:id`

**Required Permission**: `products:update`

**Request Body** (all fields optional):
```json
{
  "name": "Teh Hijau Premium",
  "description": "Teh hijau premium organik",
  "price": 18000,
  "minStock": 15
}
```

**Response** (200 OK):
```json
{
  "id": 2,
  "name": "Teh Hijau Premium",
  "description": "Teh hijau premium organik",
  "price": 18000,
  "stock": 100,
  "minStock": 15,
  "updatedAt": "2024-01-15T12:00:00.000Z"
}
```

**Note**: Stock cannot be updated via this endpoint. Use adjust-stock endpoint instead.

---

### Adjust Stock
Adjust product stock with reason tracking.

**Endpoint**: `PATCH /products/:id/adjust-stock`

**Required Permission**: `products:update`

**Query Parameters**:
- `quantity`: Stock change amount (negative for decrease)
- `reason`: Reason for adjustment

**Example Request**:
```
PATCH /products/2/adjust-stock?quantity=-5&reason=Damaged
```

**Common Reasons**:
- `Stock Opname` - Physical stock count
- `Damaged` - Product damaged
- `Expired` - Product expired
- `Theft` - Stock theft
- `Return to Supplier` - Returned to supplier
- `Initial Stock` - Initial stock entry
- `Other` - Other reason

**Response** (200 OK):
```json
{
  "id": 2,
  "name": "Teh Hijau Premium",
  "stock": 95,
  "previousStock": 100,
  "adjustment": -5,
  "reason": "Damaged",
  "adjustedAt": "2024-01-15T13:00:00.000Z"
}
```

---

### Toggle Product Active Status
Activate or deactivate product without deleting.

**Endpoint**: `PATCH /products/:id/toggle-active`

**Required Permission**: `products:update`

**Response** (200 OK):
```json
{
  "id": 2,
  "name": "Teh Hijau Premium",
  "isActive": false,
  "updatedAt": "2024-01-15T14:00:00.000Z"
}
```

---

### Delete Product
Permanently delete product.

**Endpoint**: `DELETE /products/:id`

**Required Permission**: `products:delete`

**Response** (200 OK):
```json
{
  "message": "Product deleted successfully"
}
```

**Note**: Cannot delete products that have associated transactions.

---

### Get Low Stock Products
Get products below minimum stock threshold.

**Endpoint**: `GET /products/low-stock`

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 3,
      "name": "Gula Pasir",
      "sku": "GUL-001",
      "stock": 5,
      "minStock": 20,
      "deficit": -15,
      "category": {
        "name": "Bahan Pokok"
      }
    }
  ],
  "total": 1
}
```

---

## 💰 Transactions

### List Transactions
Get paginated list of transactions.

**Endpoint**: `GET /transactions`

**Query Parameters**:
- `page`, `limit`: Pagination
- `startDate`, `endDate`: Date range filter
- `paymentMethod`: Filter by payment type
- `status`: Filter by status (completed, refunded)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "invoiceNumber": "INV-20240115-001",
      "totalAmount": 50000,
      "paymentMethod": "cash",
      "status": "completed",
      "cashier": {
        "id": 2,
        "name": "Budi Santoso"
      },
      "items": [
        {
          "productId": 1,
          "productName": "Kopi Arabica",
          "quantity": 2,
          "price": 25000,
          "subtotal": 50000
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

---

### Create Transaction
Process a new sale.

**Endpoint**: `POST /transactions`

**Required Permission**: `transactions:create`

**Request Body**:
```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "price": 25000
    },
    {
      "productId": 2,
      "quantity": 1,
      "price": 18000
    }
  ],
  "paymentMethod": "cash",
  "cashReceived": 70000,
  "notes": "Customer reguler"
}
```

**Payment Methods**: `cash`, `card`, `e_wallet`, `transfer`

**Response** (201 Created):
```json
{
  "id": 1,
  "invoiceNumber": "INV-20240115-001",
  "totalAmount": 68000,
  "paymentMethod": "cash",
  "cashReceived": 70000,
  "change": 2000,
  "status": "completed",
  "items": [
    {
      "productId": 1,
      "productName": "Kopi Arabica",
      "quantity": 2,
      "price": 25000,
      "subtotal": 50000
    },
    {
      "productId": 2,
      "productName": "Teh Hijau Premium",
      "quantity": 1,
      "price": 18000,
      "subtotal": 18000
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

---

### Refund Transaction
Process transaction refund.

**Endpoint**: `POST /transactions/:id/refund`

**Required Permission**: `transactions:refund`

**Request Body**:
```json
{
  "reason": "Product defect",
  "notes": "Customer complaint"
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "status": "refunded",
  "refundedAt": "2024-01-15T15:00:00.000Z",
  "refundReason": "Product defect",
  "refundAmount": 68000
}
```

---

## 📊 Reports

### Sales Report
Get sales analytics for date range.

**Endpoint**: `GET /reports/sales`

**Query Parameters**:
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)
- `outletId` (optional): Filter by outlet

**Example**:
```
GET /reports/sales?startDate=2024-01-01&endDate=2024-01-31
```

**Response** (200 OK):
```json
{
  "summary": {
    "totalRevenue": 5000000,
    "totalTransactions": 150,
    "averageTransactionValue": 33333,
    "totalItemsSold": 450
  },
  "dailySales": [
    {
      "date": "2024-01-15",
      "revenue": 500000,
      "transactions": 15
    }
  ],
  "topProducts": [
    {
      "productId": 1,
      "productName": "Kopi Arabica",
      "quantitySold": 50,
      "revenue": 1250000
    }
  ],
  "paymentMethods": {
    "cash": 3000000,
    "card": 1500000,
    "e_wallet": 500000
  }
}
```

---

### End of Day Report
Get shift closing report.

**Endpoint**: `GET /reports/eod`

**Query Parameters**:
- `date`: Report date (YYYY-MM-DD)
- `outletId` (optional)

**Response** (200 OK):
```json
{
  "date": "2024-01-15",
  "outlet": {
    "id": 1,
    "name": "Toko Pusat"
  },
  "shifts": [
    {
      "shiftId": 1,
      "cashierName": "Budi Santoso",
      "openingBalance": 500000,
      "closingBalance": 1500000,
      "totalSales": 1000000,
      "transactionCount": 30
    }
  ],
  "summary": {
    "totalRevenue": 1000000,
    "totalTransactions": 30,
    "cashSales": 600000,
    "nonCashSales": 400000
  }
}
```

---

## 🏢 Tenants & Outlets

### Get Tenant Profile
Get current tenant details.

**Endpoint**: `GET /tenants/profile`

**Response** (200 OK):
```json
{
  "id": 1,
  "name": "Koperasi Bermadani",
  "email": "admin@koperasi.com",
  "phone": "+62812345678",
  "isActive": true,
  "subscription": {
    "plan": "professional",
    "status": "active",
    "expiresAt": "2024-12-31T23:59:59.000Z",
    "limits": {
      "maxOutlets": 5,
      "maxUsers": 25,
      "maxProducts": 1000
    }
  },
  "outlets": [
    {
      "id": 1,
      "name": "Toko Pusat",
      "address": "Jl. Bandung No. 123",
      "phone": "+628123456789"
    }
  ]
}
```

---

## 👥 Users

### List Users
Get users in current tenant.

**Endpoint**: `GET /users`

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 2,
      "email": "cashier@koperasi.com",
      "name": "Budi Santoso",
      "role": {
        "name": "cashier"
      },
      "outlet": {
        "name": "Toko Pusat"
      },
      "isActive": true
    }
  ]
}
```

---

## 📚 Categories

### Get Categories
Get all product categories.

**Endpoint**: `GET /products/categories`

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "name": "Minuman",
      "description": "Berbagai jenis minuman",
      "productCount": 15
    },
    {
      "id": 2,
      "name": "Makanan",
      "description": "Produk makanan",
      "productCount": 20
    }
  ]
}
```

---

## 🚨 Error Responses

### Error Format
All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "path": "/api/v1/products"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

---

## 📝 Notes

### Authentication Header Format
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Date Format
All dates use ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`

### Pagination
Default limit: 10, Maximum limit: 100

### Rate Limiting
100 requests per minute per IP

---

For interactive API testing, visit: **http://localhost:3000/api/docs** (Swagger UI)
