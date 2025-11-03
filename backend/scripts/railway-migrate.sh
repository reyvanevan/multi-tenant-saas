#!/bin/bash
# Railway Migration Script for Platform Roles

echo "🚀 Starting Railway migration..."

# 1. Run Prisma migration
echo "📦 Running Prisma migrations..."
npx prisma migrate deploy

# 2. Generate Prisma Client
echo "🔧 Generating Prisma client..."
npx prisma generate

# 3. Run seed
echo "🌱 Running database seed..."
npm run seed

echo "✅ Migration completed successfully!"
