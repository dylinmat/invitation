# syntax=docker/dockerfile:1
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/

# Clean install dependencies
RUN npm ci && cd apps/web && npm ci

# Debug and patch react-slot BEFORE building
RUN echo "=== Finding react-slot files ===" && \
    find /app -path '*/@radix-ui/react-slot/dist/index.js' 2>/dev/null && \
    echo "=== Patching react-slot files ===" && \
    find /app -path '*/@radix-ui/react-slot/dist/index.js' -exec sed -i 's/React.Children.only(null)/null/g' {} \; && \
    echo "=== Verifying patches ===" && \
    (find /app -path '*/@radix-ui/react-slot/dist/index.js' -exec grep -l "Children.only" {} \; || echo "No unpatched files found")

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
