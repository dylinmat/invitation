# =============================================================================
# EIOS Realtime Service - Production Dockerfile
# WebSocket server for real-time collaboration
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
COPY apps/realtime/package*.json ./apps/realtime/
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
COPY --from=deps /app/apps/realtime/node_modules ./apps/realtime/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy source code
COPY apps/realtime ./apps/realtime
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
RUN adduser --system --uid 1001 realtime

WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV PORT=4100

# Copy application files
COPY --from=builder --chown=realtime:nodejs /app/apps/realtime ./apps/realtime
COPY --from=builder --chown=realtime:nodejs /app/packages/shared ./packages/shared
COPY --from=builder --chown=realtime:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=realtime:nodejs /app/package*.json ./

# Switch to non-root user
USER realtime

# Expose port
EXPOSE 4100

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4100/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/realtime/src/index.js"]
