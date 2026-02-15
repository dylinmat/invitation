# EIOS Railway Deployment Guide

Complete deployment configuration for Event Invitation OS (EIOS) on Railway.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Railway Project: "invitation"                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐               │
│  │     Web      │────▶│     API      │◀────│    Worker    │               │
│  │   (Next.js)  │     │   (Fastify)  │     │  (Jobs/BG)   │               │
│  │   Port 3000  │     │   Port 4000  │     │   No port    │               │
│  └──────────────┘     └──────┬───────┘     └──────────────┘               │
│                              │                                              │
│                              ▼                                              │
│                       ┌──────────────┐                                     │
│                       │   Realtime   │                                     │
│                       │  (WebSocket) │                                     │
│                       │   Port 4100  │                                     │
│                       └──────────────┘                                     │
│                              │                                              │
│                              ▼                                              │
│         ┌────────────────────┼────────────────────┐                        │
│         ▼                    ▼                    ▼                        │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                 │
│  │   Postgres   │    │    Redis     │    │   (Future)   │                 │
│  │   (Data)     │    │  (Cache/WS)  │    │   Storage    │                 │
│  └──────────────┘    └──────────────┘    └──────────────┘                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Internal Networking:
- api.railway.internal:4000
- realtime.railway.internal:4100
- worker.railway.internal (no exposed port)
- web.railway.internal:3000
```

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Railway CLI**: Install globally
   ```bash
   npm install -g @railway/cli
   ```
3. **GitHub Account**: For CI/CD automation

## Initial Setup

### 1. Login to Railway

```bash
railway login
```

### 2. Link to Existing Project (if invited)

```bash
railway link --project invitation
```

Or create a new project:
```bash
railway init --name invitation
```

### 3. Provision Databases

```bash
# Add PostgreSQL
railway add --database postgres

# Add Redis
railway add --database redis
```

### 4. Set Environment Variables

```bash
# Link to project
railway link

# Set shared variables
railway variables --set "NODE_ENV=production"
railway variables --set "LOG_LEVEL=info"
```

## Service Deployment

### Option 1: Deploy via Railway CLI (Manual)

```bash
# Deploy API service
cd apps/api
railway up --service api

# Deploy Realtime service
cd apps/realtime
railway up --service realtime

# Deploy Worker service
cd apps/worker
railway up --service worker

# Deploy Web service
cd apps/web
railway up --service web
```

### Option 2: Deploy via GitHub Actions (Recommended)

1. **Add Repository Secret**: Go to GitHub → Settings → Secrets → Actions
   - Add `RAILWAY_TOKEN` (get from `railway token`)

2. **Push to main branch**:
   ```bash
   git add .
   git commit -m "feat: setup railway deployment"
   git push origin main
   ```

3. **Monitor deployment**: Check Actions tab in GitHub

### Option 3: Deploy via Railway Dashboard

1. Go to [railway.app](https://railway.app)
2. Select "invitation" project
3. Click "New" → "Deploy from GitHub repo"
4. Select this repository
5. Configure services using `railway.toml` files

## Environment Variables Reference

### Required Variables (Auto-injected by Railway)

| Variable | Source | Description |
|----------|--------|-------------|
| `DATABASE_URL` | Postgres | PostgreSQL connection string |
| `DATABASE_PUBLIC_URL` | Postgres | Public PostgreSQL connection |
| `REDIS_URL` | Redis | Redis connection string |
| `REDIS_PUBLIC_URL` | Redis | Public Redis connection |

### Service-Specific Variables

#### API Service
```bash
PORT=4000
HOST=0.0.0.0
NODE_ENV=production
LOG_LEVEL=info
TRUST_PROXY=true
DB_POOL_SIZE=20
RATE_LIMIT_MAX=100
REDIS_KEY_PREFIX=eios:
```

#### Realtime Service
```bash
PORT=4100
NODE_ENV=production
LOG_LEVEL=info
```

#### Worker Service
```bash
NODE_ENV=production
LOG_LEVEL=info
WORKER_POLL_INTERVAL_MS=5000
```

#### Web Service
```bash
PORT=3000
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_API_URL=https://api.eios.app
NEXT_PUBLIC_REALTIME_URL=wss://realtime.eios.app
```

## Database Migrations

### Run Migrations Manually

```bash
# Via Railway CLI
railway run -- npm run db:migrate

# Or from root
npm run railway:migrate
```

### Run Migrations in CI/CD

Migrations run automatically after API deployment (see `.github/workflows/deploy.yml`).

### Seed Database (First Time)

```bash
railway run -- npm run db:seed
```

## Health Check Endpoints

| Service | Endpoint | Expected Response |
|---------|----------|-------------------|
| API | `GET /health` | `{"status":"ok","service":"eios-api"}` |
| API | `GET /ready` | `{"status":"ready","checks":{"database":"ok"}}` |
| API | `GET /live` | `{"status":"alive"}` |
| Realtime | `GET /health` | `{"status":"ok","service":"realtime"}` |
| Realtime | `GET /ready` | `{"status":"ready"}` |
| Web | `GET /api/health` | `{"status":"ok","service":"web"}` |

## Custom Domains

### 1. Add Domains in Railway Dashboard

1. Go to each service → Settings → Domains
2. Click "Generate Domain" or "Custom Domain"

### 2. Configure DNS

For custom domains, add CNAME records:
```
CNAME  api.eios.app  →  api.railway.app
CNAME  realtime.eios.app  →  realtime.railway.app
CNAME  eios.app  →  web.railway.app
CNAME  *.eios.app  →  web.railway.app
```

### 3. Update Environment Variables

```bash
railway variables --service web --set "NEXT_PUBLIC_API_URL=https://api.eios.app"
railway variables --service web --set "NEXT_PUBLIC_REALTIME_URL=wss://realtime.eios.app"
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
railway logs --service api

# Check deployment status
railway status

# Redeploy
railway up --service api
```

### Database Connection Issues

```bash
# Verify connection
railway connect postgres

# Check DATABASE_URL is set
railway variables --service api
```

### Health Check Failures

1. Verify health endpoint responds locally:
   ```bash
   curl http://localhost:4000/health
   ```

2. Check Railway health check path matches your endpoint

3. Ensure `PORT` env variable matches exposed port

### Build Failures

```bash
# Test build locally
docker build -t eios-api -f apps/api/Dockerfile .

# Check for missing dependencies
npm ci
```

## Scaling

### Vertical Scaling (Railway Dashboard)

1. Go to service → Settings → Resources
2. Adjust CPU and Memory

### Horizontal Scaling

Railway auto-scales based on traffic. For more control:

```bash
# Set replica count (if using Railway Pro)
railway scale --service api --replicas 3
```

## Monitoring

### Railway Dashboard Metrics

- CPU Usage
- Memory Usage
- Network I/O
- Request latency

### Log Aggregation

```bash
# Stream logs
railway logs --service api --follow

# Filter by time
railway logs --service api --since 1h
```

### Alerting (Railway Pro)

Configure alerts in Railway Dashboard:
- High error rates
- High response times
- Resource exhaustion

## Security Checklist

- [ ] JWT secrets stored in Railway variables (not code)
- [ ] Database SSL enabled (`DB_SSL_REJECT_UNAUTHORIZED=true`)
- [ ] Rate limiting enabled
- [ ] CORS configured for production domains
- [ ] No sensitive data in logs (`LOG_PRETTY=false`)
- [ ] Non-root user in Docker containers
- [ ] Health checks on all HTTP services

## Rollback

```bash
# View deployment history
railway history --service api

# Rollback to previous deployment
railway rollback --service api
```

## Local Development with Railway

```bash
# Use Railway environment locally
railway run -- npm run dev:api

# Or link specific variables
railway variables --get DATABASE_URL
```

## Useful Commands

```bash
# List all services
railway status

# View service info
railway info --service api

# Shell into running container
railway ssh --service api

# Restart service
railway up --service api --restart

# Delete service (careful!)
railway delete --service api
```

## Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **EIOS Issues**: Create GitHub issue
