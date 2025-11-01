# Multi-stage build for production (Backend uses NPM, not pnpm!)
FROM node:20-alpine AS base

WORKDIR /app

# Install system dependencies for Prisma
RUN apk add --no-cache openssl libc6-compat

# ========================================
# DEPENDENCIES STAGE
# ========================================
FROM base AS deps

# Copy package files (npm, not pnpm!)
COPY package*.json ./

# Install ALL dependencies (including dev)
RUN npm ci

# ========================================
# BUILDER STAGE
# ========================================
FROM base AS builder

# Copy dependencies from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build NestJS application
RUN npm run build

# ========================================
# RUNNER STAGE (Production)
# ========================================
FROM base AS runner

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy Prisma schema for runtime
COPY prisma ./prisma

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Generate Prisma Client (production)
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["npm", "run", "start:prod"]
