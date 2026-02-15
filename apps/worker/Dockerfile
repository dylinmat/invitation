# =============================================================================
# EIOS Worker Service - Production Dockerfile
# Background job processor
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files for workspace
COPY package*.json ./
COPY apps/worker/package*.json ./apps/worker/
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm ci --only=production

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/worker/node_modules ./apps/worker/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy source code
COPY apps/worker ./apps/worker
COPY apps/api/src/db ./apps/api/src/db
COPY packages/shared ./packages/shared
COPY package*.json ./

# -----------------------------------------------------------------------------
# Stage 3: Runner
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 worker

WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV WORKER_POLL_INTERVAL_MS=5000

# Copy application files
COPY --from=builder --chown=worker:nodejs /app/apps/worker ./apps/worker
COPY --from=builder --chown=worker:nodejs /app/apps/api/src/db ./apps/api/src/db
COPY --from=builder --chown=worker:nodejs /app/packages/shared ./packages/shared
COPY --from=builder --chown=worker:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=worker:nodejs /app/package*.json ./

# Switch to non-root user
USER worker

# Workers don't expose a port, but we keep this for documentation
# EXPOSE 4200

# Health check - workers don't have HTTP, use a file-based check or process check
HEALTHCHECK --interval=60s --timeout=10s --start-period=10s --retries=3 \
  CMD pgrep -f "node apps/worker/src/index.js" || exit 1

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/worker/src/index.js"]
