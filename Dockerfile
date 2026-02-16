# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json ./
COPY apps/web/package.json ./apps/web/
COPY package-lock.json ./

# Clean install dependencies (no cache)
RUN npm ci --no-cache
RUN cd apps/web && npm ci --no-cache

# Copy source code
COPY . .

# Build the Next.js app
RUN cd apps/web && rm -rf .next && npx next build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy built app
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Start the app
CMD ["sh", "-c", "cd apps/web && npx next start -p 3000"]
