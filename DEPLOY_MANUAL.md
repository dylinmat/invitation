# EIOS Manual Deployment Guide

Since you're already logged into Railway, run these commands in your terminal:

## Quick Deploy (Copy & Paste Each Line)

### 1. Build the API First
```bash
cd apps/api
npm run build
cd ../..
```

### 2. Deploy API Service
```bash
railway up --service api
```

Wait for this to complete. You should see build logs and a success message.

### 3. Deploy Web Service
```bash
railway up --service web
```

### 4. Run Database Migrations
```bash
railway run --service api npm run migrate
```

This will create all the new tables (events, clients, team, invoices).

### 5. Verify Deployment
```bash
# Check API health
curl https://invitation-production-db10.up.railway.app/health

# Should return: {"status":"ok"}
```

---

## What's Being Deployed

### Backend APIs (New)
- **Events API** - Full event management with tasks
- **Clients API** - Client relationship management
- **Team API** - Team member invites and management
- **Invoices API** - Invoice creation and workflow
- **Import API** - CSV import for guests/clients

### Frontend Features (New)
- **Visual Editor** - Drag-drop website builder
- **Analytics Dashboard** - Real data (connects to existing APIs)
- **Team Management** - Real data (replaces mock)
- **Landing Page** - Real photos from Unsplash
- **Legal Pages** - Terms & Privacy Policy

---

## Post-Deployment Verification

### Test These Features:

1. **Create Event**
   - Go to dashboard → Create Event
   - Should save to database (not console.log)

2. **Add Client**
   - Business dashboard → Add Client
   - Should persist after refresh

3. **Team Invite**
   - Team page → Invite Member
   - Should generate token and show in pending invites

4. **Create Invoice**
   - Should auto-generate invoice number (INV-2024-XXXXX)

5. **CSV Import**
   - Upload guest CSV
   - Should validate and import with progress

6. **Visual Editor**
   - Edit site → Make changes → Save
   - Should auto-save and persist

---

## Troubleshooting

### If API deployment fails:
```bash
# Check logs
railway logs --service api

# Redeploy
railway up --service api
```

### If migrations fail:
```bash
# Check connection
railway run --service api "node -e 'console.log(process.env.DATABASE_URL)'"

# Run manually
railway run --service api npx tsx src/db/migrate.ts
```

### If web deployment fails:
```bash
# Check logs
railway logs --service web
```

---

## Rollback (If Needed)

```bash
# Rollback to previous deployment
railway rollback --service api
railway rollback --service web
```

---

## Status Check

Check all services:
```bash
railway status
```

View logs:
```bash
railway logs --service api --follow
railway logs --service web --follow
```
