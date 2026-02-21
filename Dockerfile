# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/

# Install dependencies
RUN npm install && \
    cd apps/web && npm install && \
    cd ../api && npm install && \
    cd ../../packages/types && npm install

# Copy source code
COPY . .

# Build types package FIRST
RUN cd packages/types && npm run build

# Build API
RUN cd apps/api && npm run build

# Copy modules source (needed for runtime requires)
RUN cp -r apps/api/src/modules apps/api/dist/

# Build Web
RUN cd apps/web && rm -rf .next && npx next build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install dos2unix for line ending conversion
RUN apk add --no-cache dos2unix

# Copy root node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Copy built API (including modules)
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/src ./apps/api/src

# Copy built Web
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules

# Copy packages
COPY --from=builder /app/packages ./packages

# Copy start script and convert line endings
COPY --from=builder /app/start.sh ./start.sh
RUN dos2unix start.sh && chmod +x start.sh

# Expose port
EXPOSE 3000

# Start both services
CMD ["sh", "start.sh"]
