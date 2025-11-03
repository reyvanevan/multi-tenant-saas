# Railway Migration Script for Platform Roles (PowerShell)

Write-Host "🚀 Starting Railway migration..." -ForegroundColor Green

# 1. Run Prisma migration
Write-Host "📦 Running Prisma migrations..." -ForegroundColor Cyan
npx prisma migrate deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    exit 1
}

# 2. Generate Prisma Client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Cyan
npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prisma generate failed!" -ForegroundColor Red
    exit 1
}

# 3. Run seed
Write-Host "🌱 Running database seed..." -ForegroundColor Cyan
npm run seed

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Seed failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
