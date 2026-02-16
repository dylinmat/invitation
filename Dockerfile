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

# Debug: List all react-slot files before patching
RUN echo "Before patching:" && find /app -path '*/@radix-ui/react-slot/dist/index.js' -exec grep -l "Children.only" {} \;

# Patch ALL @radix-ui/react-slot instances BEFORE building
RUN find /app -path '*/@radix-ui/react-slot/dist/index.js' -exec sed -i 's/React.Children.only(null)/null/g' {} \;

# Debug: List all react-slot files after patching to verify
RUN echo "After patching:" && find /app -path '*/@radix-ui/react-slot/dist/index.js' -exec grep -l "Children.only" {} \;

# Copy source code
COPY . .

# Build the Next.js app (the patched slot will be bundled)
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
