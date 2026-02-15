# EIOS Railway Deployment Summary

## 📁 Files Created

### Railway Configuration
| File | Purpose |
|------|---------|
| `railway.toml` | Root multi-service configuration |
| `apps/api/railway.toml` | API service config |
| `apps/realtime/railway.toml` | Realtime service config |
| `apps/worker/railway.toml` | Worker service config |
| `apps/web/railway.toml` | Web service config |
| `nixpacks.toml` | Alternative Nixpacks config |

### Docker Configuration
| File | Purpose |
|------|---------|
| `apps/api/Dockerfile` | API production image |
| `apps/realtime/Dockerfile` | Realtime production image |
| `apps/worker/Dockerfile` | Worker production image |
| `apps/web/Dockerfile` | Next.js production image |
| `docker-compose.yml` | Local testing stack |
| `.dockerignore` | Docker build exclusions |
| `.railwayignore` | Railway upload exclusions |

### Environment & CI/CD
| File | Purpose |
|------|---------|
| `.env.production` | Production environment template |
| `.github/workflows/deploy.yml` | Auto-deploy on push |
| `DEPLOYMENT.md` | Complete deployment guide |
| `package.json` | Updated with deployment scripts |

### Web Service Additions
| File | Purpose |
|------|---------|
| `apps/web/src/pages/api/health.js` | Health endpoint |
| `apps/web/src/pages/api/ready.js` | Readiness endpoint |
| `apps/web/next.config.js` | Next.js standalone config |
| `apps/web/public/index.html` | Landing page |

## 🏗️ Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                    Railway Project: "invitation"              │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │
│  │   Web (3000) │◀──▶│  API (4000)  │◀──▶│ Worker (BG)  │    │
│  │  Next.js 14  │    │   Fastify    │    │  Job Queue   │    │
│  └──────────────┘    └──────┬───────┘    └──────────────┘    │
│                             │                                 │
│                             ▼                                 │
│                      ┌──────────────┐                        │
│                      │Realtime(4100)│                        │
│                      │  WebSocket   │                        │
│                      └──────────────┘                        │
│                             │                                 │
│         ┌───────────────────┼───────────────────┐            │
│         ▼                   ▼                   ▼            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Postgres    │  │    Redis     │  │  (Future)    │       │
│  │   (Data)     │  │  (Pub/Sub)   │  │   Storage    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## 🌐 Service URLs

### Internal (Service-to-Service)
```
api.railway.internal:4000
realtime.railway.internal:4100
worker.railway.internal:4200
web.railway.internal:3000
```

### Public (Custom Domains)
```
https://eios.app         → Web
https://api.eios.app     → API
wss://realtime.eios.app  → Realtime
```

## 🚀 Quick Start

### 1. Setup Railway CLI
```bash
npm install -g @railway/cli
railway login
railway link --project invitation
```

### 2. Deploy Services
```bash
# Deploy individual services
npm run deploy:api
npm run deploy:realtime
npm run deploy:worker
npm run deploy:web

# Or deploy all
npm run deploy:all
```

### 3. Run Database Migrations
```bash
npm run railway:migrate
```

### 4. Local Testing with Docker
```bash
# Build and run all services locally
npm run docker:build
npm run docker:up

# View logs
npm run docker:logs

# Stop
npm run docker:down
```

## 🔍 Health Check Endpoints

| Service | Endpoint | Expected Response |
|---------|----------|-------------------|
| API | `/health` | `{"status":"ok","service":"eios-api"}` |
| API | `/ready` | `{"status":"ready","checks":{...}}` |
| Realtime | `/health` | `{"status":"ok","service":"realtime"}` |
| Web | `/api/health` | `{"status":"ok","service":"eios-web"}` |
| Web | `/api/ready` | `{"status":"ready"}` |

## ⚙️ Environment Variables

### Auto-injected by Railway
- `DATABASE_URL` - PostgreSQL connection
- `DATABASE_PUBLIC_URL` - Public PostgreSQL connection
- `REDIS_URL` - Redis connection
- `REDIS_PUBLIC_URL` - Public Redis connection

### Required Custom Variables
```bash
# API
NODE_ENV=production
PORT=4000
TRUST_PROXY=true

# Web
NEXT_PUBLIC_API_URL=https://api.eios.app
NEXT_PUBLIC_REALTIME_URL=wss://realtime.eios.app
```

## 📊 Resource Allocation

| Service | CPU | Memory | Notes |
|---------|-----|--------|-------|
| API | 1x | 512Mi | Main API server |
| Realtime | 0.5x | 256Mi | WebSocket server |
| Worker | 0.5x | 256Mi | Background jobs |
| Web | 1x | 512Mi | Next.js frontend |

## 🔄 CI/CD Pipeline

GitHub Actions workflow triggers on push to `main`:
1. Run tests & linting
2. Deploy all services in parallel
3. Run database migrations
4. Health check verification

Required GitHub Secret: `RAILWAY_TOKEN`

## 🛠️ Useful Commands

```bash
# View logs
railway logs --service api --follow

# SSH into container
railway ssh --service api

# Check status
railway status

# Local development with Railway env
railway run -- npm run dev:api

# Scale service (Pro plan)
railway scale --service api --replicas 3
```

## 📚 Documentation

- `DEPLOYMENT.md` - Complete deployment guide
- [Railway Docs](https://docs.railway.app)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

## ✅ Deployment Checklist

- [ ] Railway CLI installed and logged in
- [ ] Project linked to "invitation"
- [ ] PostgreSQL provisioned
- [ ] Redis provisioned
- [ ] Environment variables set
- [ ] Custom domains configured (optional)
- [ ] GitHub secret `RAILWAY_TOKEN` added
- [ ] Database migrations run
- [ ] Health checks passing
