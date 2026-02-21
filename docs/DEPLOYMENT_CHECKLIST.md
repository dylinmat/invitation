# EIOS Production Deployment Checklist

## Pre-Deployment

### Database
```bash
# Run migrations for new tables
npm run db:migrate

# Verify tables created:
# - events
# - event_tasks
# - clients
# - client_notes
# - team_members
# - team_invites
# - invoices
# - invoice_items
```

### Environment Variables
Ensure these are set in Railway/production:
```env
# Database
DATABASE_URL=postgresql://...

# Auth
JWT_SECRET=...
REFRESH_TOKEN_SECRET=...

# App
APP_URL=https://your-domain.com
API_URL=https://your-api-domain.com

# Optional (for future features)
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
SENDGRID_API_KEY=...
```

### Build Verification
```bash
# Clean build
npm run clean
npm run build

# Verify no errors
# Check for any console.log warnings in build output
```

---

## Deployment Steps

### 1. Deploy API
```bash
cd apps/api
railway up
# OR
docker build -t eios-api .
```

### 2. Deploy Web
```bash
cd apps/web
railway up
# OR
vercel --prod
```

### 3. Verify Health Checks
```bash
curl https://api.your-domain.com/health
# Should return: { "status": "ok" }
```

---

## Post-Deployment Testing

### Critical User Flows

#### Flow 1: Business User
```
1. Register as business user
2. Complete onboarding (select PLANNER/VENUE)
3. Create first event
4. Add a client
5. Create invoice for client
6. Invite team member
7. View dashboard analytics
```

#### Flow 2: Couple User
```
1. Register as couple
2. Complete onboarding (enter names, wedding date)
3. View couple dashboard
4. Import guests via CSV
5. Create/edit website in visual editor
6. Send invitations
```

#### Flow 3: Team Member
```
1. Receive invite email (check logs for now)
2. Accept invite via link
3. Access organization
4. Collaborate on events
```

---

## API Endpoint Verification

Test these endpoints return 200 (not 404):
```bash
# Dashboard
GET /api/dashboard/couple
GET /api/dashboard/business

# Events
GET /api/events
POST /api/events

# Clients
GET /api/clients
POST /api/clients

# Team
GET /api/team
POST /api/team/invite

# Invoices
GET /api/invoices
POST /api/invoices

# Import
POST /api/import/csv
GET /api/import/template/guests
```

---

## Feature Verification

| Feature | Test | Expected Result |
|---------|------|-----------------|
| Event Creation | Create event via dashboard | Event appears in list |
| Client Management | Add client | Client saved to DB |
| Team Invite | Send invite | Token generated, logged |
| Invoice | Create & send | Invoice saved, number auto-generated |
| CSV Import | Upload guest CSV | Guests imported with validation |
| Visual Editor | Open editor, edit, save | Changes persisted |
| Analytics | View analytics page | Charts render (may need data) |
| Legal Pages | Visit /terms, /privacy | Pages load correctly |

---

## Rollback Plan

If issues detected:

1. **Immediate Rollback**
   ```bash
   railway rollback
   # OR revert to previous git commit
   git revert HEAD
   ```

2. **Database Rollback** (if needed)
   ```bash
   # Restore from backup before deployment
   pg_restore --clean --no-owner backup.sql
   ```

3. **Communication**
   - Post status page update
   - Notify users of temporary downtime
   - Provide ETA for fix

---

## Monitoring Setup

### Logs
```bash
# Watch API logs
railway logs --service api

# Watch web logs
railway logs --service web
```

### Alerts (Setup in Railway/Vercel)
- [ ] API response time > 2s
- [ ] Error rate > 1%
- [ ] 5xx errors
- [ ] Database connection failures

---

## Success Criteria

Deployment successful if:
- [ ] All health checks pass
- [ ] User registration works
- [ ] Dashboard loads with real data
- [ ] Events can be created/managed
- [ ] Clients can be added
- [ ] Team invites work
- [ ] Invoices can be created
- [ ] CSV import functions
- [ ] Visual editor is functional
- [ ] No console errors in browser

---

## Post-Deployment Actions

### Immediate (0-24 hours)
- [ ] Monitor error rates
- [ ] Check user registrations
- [ ] Verify critical flows working

### Short-term (1-7 days)
- [ ] Gather user feedback
- [ ] Monitor performance metrics
- [ ] Fix any reported issues

### Long-term (Ongoing)
- [ ] Set up analytics tracking
- [ ] Plan feature iterations
- [ ] Scale infrastructure as needed

---

## Support Contacts

| Role | Contact | Responsibility |
|------|---------|----------------|
| Tech Lead | - | Escalations, architecture |
| DevOps | - | Infrastructure, deployments |
| Product | - | Feature decisions, prioritization |

---

**Deploy Date:** ___/___/______  
**Deployed By:** _________________  
**Verification Status:** ⬜ Pending / ⬜ Complete
