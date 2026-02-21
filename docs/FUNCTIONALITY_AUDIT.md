# EIOS Functionality Audit - What's NOT Live/Functional
## Comprehensive Review - 2025-02-21

---

## Executive Summary

**Status:** Many UI features exist but backend connectivity is incomplete.

**Critical Gap:** Routes created but NOT registered in main API.

---

## ✅ FIXED: Backend Routes Now Registered

### Fix Applied
Added registration functions in `apps/api/src/index.ts`:

```typescript
async function registerUsersRoutes(fastify: FastifyInstance): Promise<void> {
  try {
    const userRoutes = require("./modules/users/routes");
    await fastify.register(userRoutes, { prefix: "/api/users" });
    fastify.log.info("Users routes registered");
  } catch (error) {
    fastify.log.warn({ err: (error as Error).message }, "Users routes not available");
  }
}

async function registerDashboardRoutes(fastify: FastifyInstance): Promise<void> {
  try {
    const dashboardRoutes = require("./modules/dashboard/routes");
    await fastify.register(dashboardRoutes, { prefix: "/api/dashboard" });
    fastify.log.info("Dashboard routes registered");
  } catch (error) {
    fastify.log.warn({ err: (error as Error).message }, "Dashboard routes not available");
  }
}
```

### Now Available Endpoints
- ✅ `GET /api/dashboard/couple` - Couple dashboard data
- ✅ `GET /api/dashboard/business` - Business dashboard data  
- ✅ `POST /api/users/onboarding` - Complete user onboarding
- ✅ `PUT /api/users/plan` - Update user plan
- ✅ `GET /api/dashboard/checklist` - User checklist
- ✅ `POST /api/dashboard/events/:id/reminders` - Send reminders

**Date Fixed:** 2025-02-21
**Commit:** Route registration added to start() function

---

## 🟡 MAJOR: Mock/Stubs in Hooks

### useBusinessDashboard.ts
Lines 23-25, 39-41, 53-55, 71-73
```typescript
// TODO: Implement when events API is ready
console.log("Creating event:", data);
return { id: "temp" }; // FAKE ID
```

**Affected Mutations:**
- `useCreateEvent` - Returns fake ID, doesn't create
- `useCreateClient` - Returns fake ID, doesn't create
- `useInviteTeamMember` - Console log only
- `useCreateInvoice` - Returns fake ID, doesn't create

---

## 🟠 MEDIUM: Disabled UI Elements

### Auth Pages
| Element | Location | Status |
|---------|----------|--------|
| Google Login | login/page.tsx:300 | Disabled with "Soon" badge |
| Microsoft Login | login/page.tsx:328 | Disabled with "Soon" badge |
| Apple Login | login/page.tsx:340 | Disabled with "Soon" badge |
| Terms of Service | login/page.tsx:456 | Shows toast "Coming soon" |
| Privacy Policy | login/page.tsx:466 | Shows toast "Coming soon" |

### Couple Dashboard
| Element | Location | Status |
|---------|----------|--------|
| Manage Guests button | couple/page.tsx:320 | Disabled tooltip |
| Upgrade to Premium | couple/page.tsx:514 | Disabled tooltip |
| Import Guests | couple/page.tsx:544 | Disabled tooltip |
| Design Invitation | couple/page.tsx:544 | Disabled tooltip |
| Gift Registry | couple/page.tsx:544 | Disabled tooltip |
| Photo Gallery | couple/page.tsx:544 | Disabled tooltip |

### Business Dashboard
| Element | Location | Status |
|---------|----------|--------|
| Manage Event | business/page.tsx:287 | Disabled tooltip |
| More Options | business/page.tsx:292 | Disabled tooltip |
| Filter Clients | business/page.tsx:312 | Disabled tooltip |
| Add Client | business/page.tsx:318 | Disabled tooltip |
| Client Details | business/page.tsx:362 | Disabled tooltip |
| Invite Member | business/page.tsx:380 | Disabled tooltip |
| Message Team | business/page.tsx:419 | Disabled tooltip |
| Create Invoice | business/page.tsx:443 | Disabled tooltip |

---

## 🟡 MEDIUM: Mock Data Still Present

### Analytics Dashboard
File: `dashboard/analytics/page.tsx`
Line 33 comment: `// Mock data for charts - would come from API in production`

**Mock Data Used:**
- `rsvpTrendData` - Hardcoded 6 months
- `eventTypeData` - Fake percentages
- `revenueData` - Fake monthly revenue

### Admin Billing Page
File: `admin/billing/page.tsx`
Lines 78-118: Mock invoices and coupons
```typescript
const mockInvoices: Invoice[] = [...] // FAKE
const mockCoupons: Coupon[] = [...] // FAKE
```

### Dashboard Team Page
File: `dashboard/team/page.tsx`
Lines 22-95: Mock team members and invites
```typescript
const mockTeamMembers: TeamMember[] = [...] // FAKE
const mockPendingInvites: TeamInvite[] = [...] // FAKE
```

---

## 🟢 MINOR: Visual Placeholders

### Landing Page (page.tsx)
- Line 187: `{/* Placeholder for real wedding/event photo */}`
- Line 232-233: Photo placeholders with "Photo placeholder" text
- Line 304: `{/* Photo Placeholder */}`

### Editor Page
File: `editor/[siteId]/page.tsx`
Line 12: `// This is a stub implementation for the visual editor`

---

## 🟡 MEDIUM: Incomplete Features

### CSV Import
- Component: `components/import/csv-uploader.tsx`
- Status: UI works, but `onUpload` callback just logs data
- Needs: API endpoint to receive and process CSV

### Command Palette
- Component: `components/command-palette/command-palette.tsx`
- Status: UI works, some navigation works
- Issues:
  - `/events/new` route doesn't exist
  - `/guests` route doesn't exist
  - `/messages` route doesn't exist
  - `/settings` route may not exist

### Kanban Board
- File: `app/dashboard/board/page.tsx`
- Status: UI exists, drag-and-drop works
- Issue: May not persist to backend

---

## 🔴 CRITICAL: Missing API Endpoints

### For CSV Import
Need: `POST /api/import/guests`
Status: ❌ Not created

### For Event Management
Need: `POST /api/events` (create)
Need: `PUT /api/events/:id` (update)
Need: `DELETE /api/events/:id` (delete)
Status: ❌ Not created

### For Client Management
Need: `POST /api/clients`
Need: `GET /api/clients`
Need: `PUT /api/clients/:id`
Status: ❌ Not created

### For Team Management
Need: `POST /api/team/invite`
Need: `DELETE /api/team/members/:id`
Status: ❌ Not created

### For Invoices
Need: `POST /api/invoices`
Need: `GET /api/invoices`
Status: ❌ Not created

---

## 🟡 MEDIUM: Console Warnings in Production

### useAuth.ts
- Line 69: `console.warn("[useAuth] Token expired...")`
- Line 108: `console.warn("[useAuth] Session expiry warning...")`
- Line 113: `console.warn("[useAuth] Session expired event...")`
- Line 245: `console.warn("[useAuth] Token expired, logging out")`
- Line 267: `console.error("[useAuth] Failed to refresh user...")`
- Line 330: `console.error("[useAuth] Session extension failed...")`

These appear in browser console in production.

---

## 🟢 MINOR: Feature Flags / Coming Soon

### Dashboard Projects
File: `dashboard/projects/[id]/page.tsx`
Lines 81-101: Multiple tabs show "Coming Soon"
- Seating Chart: "Coming Soon"
- Analytics: "Coming Soon"
- Messages: "Coming Soon"
- Settings: "Coming Soon"

### Admin Users Page
File: `admin/users/page.tsx`
Line 483: `Activity tracking coming soon`

---

## Summary by Priority

### 🔴 CRITICAL (Must Fix)
1. **Register users/dashboard routes in API** - Backend 404s
2. **Create missing API endpoints** - Import, events, clients, team, invoices

### 🟡 HIGH (Should Fix)
3. **Connect useBusinessDashboard mutations to real APIs**
4. **Replace mock analytics data with real endpoints**
5. **Fix console warnings in production**

### 🟠 MEDIUM (Nice to Have)
6. **Add real photos to landing page**
7. **Implement visual editor stub**
8. **Create missing frontend routes** (/events/new, /guests, etc.)

### 🟢 LOW (Cosmetic)
9. **Complete coming soon features**
10. **Polish disabled element messaging**

---

## Quick Wins (Can Do Now)

1. **Register existing routes** - 5 min fix
2. **Remove console.logs** - 10 min fix
3. **Add real photos** - 30 min task
4. **Create missing placeholder pages** - 1 hour

---

## Effort Estimate

| Category | Hours Needed |
|----------|-------------|
| Backend API completion | 8-12 hours |
| Frontend route fixes | 2-4 hours |
| Mock data replacement | 4-6 hours |
| Visual polish | 2-3 hours |
| **Total** | **16-25 hours** |

---

## Recommended Action Plan

### Week 1: Critical Fixes
- Register users/dashboard routes
- Create missing API endpoints
- Test all dashboard functionality

### Week 2: Data & Polish
- Replace mock analytics
- Fix business dashboard mutations
- Add real photos

### Week 3: Features
- Complete CSV import endpoint
- Build missing routes
- Polish UX
