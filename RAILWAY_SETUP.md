# EIOS Railway Setup Guide

## Overview
This guide covers setting up the Event Invitation OS (EIOS) on Railway infrastructure.

## Prerequisites
- Railway CLI installed and logged in
- Access to the "invitation" Railway project

## Database Connection Details

### PostgreSQL
```
Internal: postgresql://postgres:znsCaZzhatgTNKHCmIJkwAHbHAOYdrAe@postgres.railway.internal:5432/railway
```

### Redis
```
Internal: redis://default:SvakubAWqJKYypyourVbnWOJGrQxGrIh@redis.railway.internal:6379
```

## Setup Steps

### 1. Apply Database Schema

From the project root, run:

```bash
# Using Railway CLI (recommended)
cd apps/api/src/db
railway ssh -s postgres "psql -U postgres -d railway" < ../../../../../db/schema.sql

# Or via Node.js script (runs within Railway network)
railway run node apps/api/src/db/migrate.js
```

### 2. Seed Initial Data

Run the seed script to create plans and settings:

```bash
railway run node apps/api/src/db/seed.js
```

### 3. Verify Installation

Check that tables were created:

```bash
railway ssh -s postgres "psql -U postgres -d railway -c '\dt'"
```

### 4. Deploy Services

```bash
# Deploy API
railway up -s api

# Deploy Realtime
railway up -s realtime

# Deploy Worker
railway up -s worker

# Deploy Web
railway up -s web
```

## Environment Variables

The following environment variables are configured in `.env.railway`:

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | PostgreSQL connection | From Railway Postgres service |
| `REDIS_URL` | Redis connection | From Railway Redis service |
| `PORT` | 4000 (API) | Service port |
| `NODE_ENV` | production | Environment mode |

## Available Scripts

| Script | Description |
|--------|-------------|
| `node apps/api/src/db/migrate.js` | Apply database schema |
| `node apps/api/src/db/seed.js` | Seed plans and settings |
| `npm run dev:api` | Start API server locally |

## Verification Checklist

- [ ] Database schema applied successfully
- [ ] Plans table populated (FREE, STARTER, PROFESSIONAL, ENTERPRISE)
- [ ] Settings definitions created
- [ ] API service deployed and healthy
- [ ] Realtime service deployed and healthy
- [ ] Worker service deployed and healthy
- [ ] Web service deployed and healthy

## Troubleshooting

### Database Connection Issues
If you get `ENOTFOUND postgres.railway.internal`, you're trying to connect from outside Railway's network. Use `railway run` or `railway ssh` commands instead.

### Migration Failures
- Check that the schema file exists at `db/schema.sql`
- Verify PostgreSQL version compatibility (13+)
- Check Railway logs: `railway logs -s postgres`

### Service Deployment Issues
- Ensure `railway.toml` is properly configured
- Check service logs: `railway logs -s <service-name>`
