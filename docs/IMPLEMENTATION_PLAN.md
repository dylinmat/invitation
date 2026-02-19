# EIOS Placeholder Implementation Plan
## Agent Swarm Execution Guide

### Project Overview
Replace all 25 placeholder implementations across the EIOS platform with production-ready code.

---

## Phase 1: Backend API Foundation (Days 1-2)
**Critical Path - Must Complete First**

### Workstream 1.1: User & Organization APIs
**Owner:** Backend Agent A
**Dependencies:** None
**Files:**
- `apps/api/src/modules/users/routes.js` (new)
- `apps/api/src/modules/users/service.js` (new)
- `apps/api/src/modules/organizations/routes.js` (new)
- `apps/api/src/modules/organizations/service.js` (new)

**Tasks:**
1. `POST /api/users/onboarding` - Save user type (COUPLE/PLANNER/VENUE) + details
2. `PUT /api/users/plan` - Update subscription plan
3. `GET /api/users/me/organization` - Get current org details
4. `POST /api/organizations` - Create organization with type
5. `PUT /api/organizations/:id` - Update org details

**Data Model Additions:**
```sql
-- Add to users table
ALTER TABLE users ADD COLUMN onboarding_completed boolean DEFAULT false;
ALTER TABLE users ADD COLUMN selected_plan text DEFAULT 'FREE';

-- Add to organizations table  
ALTER TABLE organizations ADD COLUMN couple_names jsonb;
ALTER TABLE organizations ADD COLUMN event_date date;
ALTER TABLE organizations ADD COLUMN website text;
ALTER TABLE organizations ADD COLUMN business_type text;
```

### Workstream 1.2: Dashboard Data APIs
**Owner:** Backend Agent B
**Dependencies:** None
**Files:**
- `apps/api/src/modules/dashboard/routes.js` (new)
- `apps/api/src/modules/dashboard/service.js` (new)

**Tasks:**
1. `GET /api/dashboard/couple` - Get couple dashboard data
   - Event details, guest stats, checklist, recent activity
2. `GET /api/dashboard/business` - Get business dashboard data
   - Clients, events, revenue, team members, invoices
3. `GET /api/dashboard/stats` - Get analytics/stats
4. `GET /api/checklist` - Get wedding checklist items
5. `PUT /api/checklist/:id` - Update checklist item status

### Workstream 1.3: Email & Communication APIs
**Owner:** Backend Agent C
**Dependencies:** None
**Files:**
- `apps/api/src/modules/emails/routes.js` (new or extend)
- `apps/api/src/modules/emails/service.js` (extend)

**Tasks:**
1. `POST /api/auth/resend-magic-link` - Resend magic link
2. `POST /api/auth/resend-verification` - Resend verification email
3. `POST /api/events/:id/reminders` - Send RSVP reminders
4. `POST /api/invitations/resend` - Resend invitations

---

## Phase 2: Frontend Core Integration (Days 2-3)
**Parallel Workstreams After Phase 1 APIs Ready**

### Workstream 2.1: Onboarding Integration
**Owner:** Frontend Agent A
**Dependencies:** Phase 1.1 complete
**Files:**
- `apps/web/app/onboarding/page.tsx`
- `apps/web/lib/api.ts` (add onboarding methods)

**Tasks:**
1. Replace `handleDetailsSubmit` mock with `POST /api/users/onboarding`
2. Replace `handlePlanSelect` mock with `PUT /api/users/plan`
3. Add loading states and error handling
4. Add success confirmation before redirect
5. Test both couple and professional flows end-to-end

### Workstream 2.2: Couple Dashboard Data
**Owner:** Frontend Agent B  
**Dependencies:** Phase 1.2 complete
**Files:**
- `apps/web/app/dashboard/couple/page.tsx`
- `apps/web/lib/api.ts` (add dashboard methods)

**Tasks:**
1. Replace mock data with `GET /api/dashboard/couple` API call
2. Add React Query for data fetching with caching
3. Add loading skeletons while data loads
4. Add error state UI for failed requests
5. Make "Send Reminders" button functional (call `POST /api/events/:id/reminders`)
6. Make "Manage Guests" link functional (navigate to `/guests`)
7. Make "Add Custom Task" functional (call `POST /api/checklist`)
8. Fix Quick Action links to real pages

### Workstream 2.3: Business Dashboard Data
**Owner:** Frontend Agent C
**Dependencies:** Phase 1.2 complete
**Files:**
- `apps/web/app/dashboard/business/page.tsx`
- `apps/web/lib/api.ts` (add business methods)

**Tasks:**
1. Replace mock data with `GET /api/dashboard/business` API call
2. Add React Query with proper caching
3. Add loading states and skeletons
4. Make "New Event" button functional (modal + API)
5. Make "Invite Member" button functional (modal + API)
6. Make "Create Invoice" button functional (modal + API)
7. Add filter functionality for clients/events
8. Make all "Manage" links navigate to detail pages

---

## Phase 3: Social Authentication (Days 3-4)
**Can Parallel with Phase 2 if OAuth apps ready**

### Workstream 3.1: Google OAuth
**Owner:** Full-Stack Agent A
**Dependencies:** Google Cloud Console OAuth credentials
**Files:**
- `apps/api/src/modules/auth/oauth.js` (new)
- `apps/api/src/modules/auth/routes.js` (extend)
- `apps/web/app/auth/login/page.tsx`
- `apps/web/app/auth/register/page.tsx`

**Tasks:**
1. Set up Google OAuth 2.0 in Google Cloud Console
2. Add `passport-google-oauth20` strategy
3. Create `GET /api/auth/google` endpoint
4. Create `GET /api/auth/google/callback` endpoint
5. Handle user creation/login from Google profile
6. Update frontend Google buttons to actual OAuth flow
7. Test login and signup flows

### Workstream 3.2: Microsoft/Azure OAuth
**Owner:** Full-Stack Agent B
**Dependencies:** Azure App Registration
**Files:**
- `apps/api/src/modules/auth/oauth.js` (extend)
- `apps/api/src/modules/auth/routes.js` (extend)
- Frontend login/register pages

**Tasks:**
1. Register app in Azure AD
2. Add `@azure/msal-node` or passport strategy
3. Create `GET /api/auth/microsoft` endpoint
4. Create callback handler
5. Update frontend Microsoft buttons

### Workstream 3.3: Apple Sign In
**Owner:** Full-Stack Agent C
**Dependencies:** Apple Developer account
**Files:**
- `apps/api/src/modules/auth/oauth.js` (extend)
- `apps/api/src/modules/auth/routes.js` (extend)
- Frontend login/register pages

**Tasks:**
1. Configure Sign in with Apple in Apple Developer
2. Add `passport-apple` or `apple-signin-auth`
3. Create Apple auth endpoints
4. Update frontend Apple buttons
5. Handle Apple privacy email relay

---

## Phase 4: Email & Utility Functions (Days 3-4)
**Parallel with Phases 2-3**

### Workstream 4.1: Email Resend & Utilities
**Owner:** Frontend Agent D
**Dependencies:** Phase 1.3 complete
**Files:**
- `apps/web/app/auth/login/page.tsx`
- `apps/web/app/auth/register/page.tsx`
- `apps/web/lib/api.ts`

**Tasks:**
1. Replace resend magic link mock with real API call
2. Replace resend verification mock with real API call
3. Add rate limiting UI (disable button for 60s after click)
4. Add success/error toast notifications
5. Add loading state to buttons

### Workstream 4.2: Legal Pages
**Owner:** Content Agent
**Dependencies:** None
**Files:**
- `apps/web/app/legal/terms/page.tsx` (new)
- `apps/web/app/legal/privacy/page.tsx` (new)
- Update links in login/register pages

**Tasks:**
1. Create Terms of Service page
2. Create Privacy Policy page
3. Update all placeholder links to real pages
4. Ensure pages include last updated date

---

## Phase 5: Testing & Polish (Day 5)
**Final QA Before Deploy**

### Workstream 5.1: Integration Testing
**Owner:** QA Agent A
**Tasks:**
1. Test complete onboarding flow (couple path)
2. Test complete onboarding flow (professional path)
3. Test dashboard data loading for both user types
4. Test all button functionality
5. Test social auth flows
6. Test email resend functionality

### Workstream 5.2: Error Handling & Edge Cases
**Owner:** QA Agent B
**Tasks:**
1. Test API failure scenarios
2. Test network interruption handling
3. Test form validation edge cases
4. Test concurrent actions (double-click prevention)
5. Add missing error boundaries

### Workstream 5.3: Performance Optimization
**Owner:** Performance Agent
**Tasks:**
1. Add React Query caching strategies
2. Implement optimistic updates where appropriate
3. Add loading skeletons to all async components
4. Lazy load non-critical dashboard sections
5. Verify bundle size hasn't grown excessively

---

## API Contract Specifications

### Onboarding Endpoint
```typescript
POST /api/users/onboarding
Request: {
  type: "COUPLE" | "PLANNER" | "VENUE",
  // For couples:
  coupleNames?: { partner1: string, partner2: string },
  eventDate?: string,
  // For professionals:
  businessName?: string,
  website?: string,
  businessType?: "PLANNER" | "VENUE" | "VENDOR"
}
Response: { success: true, organization: Organization }
```

### Dashboard Endpoints
```typescript
GET /api/dashboard/couple
Response: {
  event: Event,
  stats: { guests: number, rsvpRate: number, daysLeft: number, gifts: number },
  checklist: ChecklistItem[],
  recentActivity: ActivityItem[]
}

GET /api/dashboard/business
Response: {
  clients: Client[],
  events: Event[],
  teamMembers: TeamMember[],
  invoices: Invoice[],
  analytics: { revenue: number, activeEvents: number, totalGuests: number, conversionRate: number }
}
```

---

## Agent Assignment Matrix

| Agent | Primary Workstreams | Skills Needed |
|-------|---------------------|---------------|
| Backend Agent A | 1.1 | Node.js, PostgreSQL, API design |
| Backend Agent B | 1.2 | Node.js, SQL, dashboard aggregations |
| Backend Agent C | 1.3 | Node.js, email services (SendGrid/AWS SES) |
| Frontend Agent A | 2.1 | React, React Query, forms |
| Frontend Agent B | 2.2, 4.1 | React, React Query, UI/UX |
| Frontend Agent C | 2.3 | React, data tables, dashboards |
| Frontend Agent D | 4.2 | React, content pages |
| Full-Stack Agent A | 3.1 | OAuth 2.0, Passport.js, Google APIs |
| Full-Stack Agent B | 3.2 | Azure AD, Microsoft Graph |
| Full-Stack Agent C | 3.3 | Apple Sign In, JWT handling |
| QA Agent A | 5.1 | Testing, Cypress/Playwright |
| QA Agent B | 5.2 | Error scenarios, edge cases |
| Performance Agent | 5.3 | React optimization, bundle analysis |

---

## Success Criteria

- [ ] All 25 placeholder functions replaced
- [ ] Zero `TODO` comments remaining in auth/dashboard/onboarding
- [ ] All buttons have functional onClick handlers
- [ ] All API calls have proper error handling
- [ ] Loading states visible for all async operations
- [ ] Social auth flows tested end-to-end
- [ ] Dashboard data loads from real API (no mock data)
- [ ] Legal pages published and linked

---

## Deploy Checklist

After all phases complete:
1. Run database migrations (Phase 1 additions)
2. Deploy API service
3. Deploy web service
4. Configure OAuth redirect URLs in production
5. Test all flows in production
6. Monitor error rates
