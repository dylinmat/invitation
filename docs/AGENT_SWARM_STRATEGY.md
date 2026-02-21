# EIOS Agent Swarm Strategy
## Complete Production Readiness Plan

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AGENT SWARM ORCHESTRATION                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Backend    │  │  Backend    │  │  Backend    │  │  Backend    │        │
│  │  Agent 1    │  │  Agent 2    │  │  Agent 3    │  │  Agent 4    │        │
│  │  (Events)   │  │  (Clients)  │  │   (Team)    │  │ (Invoices)  │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │                │
│         └────────────────┴────────────────┴────────────────┘                │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     DATABASE SCHEMA (Shared)                         │   │
│  │  • events table      • clients table    • team_invites table        │   │
│  │  • event_tasks       • invoices         • audit_logs                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│         ┌──────────────────────────┼──────────────────────────┐            │
│         ▼                          ▼                          ▼            │
│  ┌─────────────┐           ┌─────────────┐           ┌─────────────┐       │
│  │   Frontend  │           │   Frontend  │           │   Frontend  │       │
│  │   Agent 1   │           │   Agent 2   │           │   Agent 3   │       │
│  │  (Hooks)    │           │ (Analytics) │           │  (Admin)    │       │
│  └─────────────┘           └─────────────┘           └─────────────┘       │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Full-     │  │     UI      │  │     UI      │  │   Testing   │        │
│  │   Stack     │  │   Agent 1   │  │   Agent 2   │  │   Agent     │        │
│  │   Agent     │  │  (Landing)  │  │   (Legal)   │  │             │        │
│  │ (CSV Import)│  │             │  │             │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Backend API Foundation

### Agent 1.1: Events API Module
**Scope:** Complete event management system
**Files to Create:**
- `apps/api/src/modules/events/routes.js` - REST endpoints
- `apps/api/src/modules/events/service.js` - Business logic
- `apps/api/src/modules/events/repository.js` - Database queries
- `apps/api/src/modules/events/index.js` - Module export

**Endpoints:**
```
GET    /api/events              - List events
POST   /api/events              - Create event
GET    /api/events/:id          - Get event details
PUT    /api/events/:id          - Update event
DELETE /api/events/:id          - Delete event
GET    /api/events/:id/tasks    - Get event tasks
POST   /api/events/:id/tasks    - Create task
PUT    /api/events/:id/tasks/:taskId - Update task
```

**Database Schema Needed:**
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50), -- wedding, corporate, birthday, etc.
  date DATE,
  location VARCHAR(500),
  budget DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'planning',
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE event_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE,
  status VARCHAR(20) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### Agent 1.2: Clients API Module
**Scope:** Client/Contact management for business users
**Files to Create:**
- `apps/api/src/modules/clients/routes.js`
- `apps/api/src/modules/clients/service.js`
- `apps/api/src/modules/clients/repository.js`
- `apps/api/src/modules/clients/index.js`

**Endpoints:**
```
GET    /api/clients             - List clients
POST   /api/clients             - Create client
GET    /api/clients/:id         - Get client details
PUT    /api/clients/:id         - Update client
DELETE /api/clients/:id         - Delete client
GET    /api/clients/:id/events  - Get client's events
POST   /api/clients/:id/notes   - Add client note
```

**Database Schema:**
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  type VARCHAR(50), -- couple, corporate, individual
  status VARCHAR(20) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE client_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### Agent 1.3: Team & Invites API Module
**Scope:** Team member management and invitation system
**Files to Create:**
- `apps/api/src/modules/team/routes.js`
- `apps/api/src/modules/team/service.js`
- `apps/api/src/modules/team/repository.js`
- `apps/api/src/modules/team/index.js`

**Endpoints:**
```
GET    /api/team                - List team members
POST   /api/team/invite         - Invite team member
DELETE /api/team/:id            - Remove team member
PUT    /api/team/:id/role       - Update member role
GET    /api/team/invites        - List pending invites
POST   /api/team/invites/:id/resend - Resend invite
DELETE /api/team/invites/:id    - Cancel invite
```

**Database Schema:**
```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  status VARCHAR(20) DEFAULT 'active',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE TABLE team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  token VARCHAR(255) UNIQUE NOT NULL,
  invited_by UUID REFERENCES users(id),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP
);
```

---

### Agent 1.4: Invoices API Module
**Scope:** Simple invoicing system
**Files to Create:**
- `apps/api/src/modules/invoices/routes.js`
- `apps/api/src/modules/invoices/service.js`
- `apps/api/src/modules/invoices/repository.js`
- `apps/api/src/modules/invoices/index.js`

**Endpoints:**
```
GET    /api/invoices            - List invoices
POST   /api/invoices            - Create invoice
GET    /api/invoices/:id        - Get invoice details
PUT    /api/invoices/:id        - Update invoice
DELETE /api/invoices/:id        - Delete invoice
POST   /api/invoices/:id/send   - Send invoice email
POST   /api/invoices/:id/mark-paid - Mark as paid
```

**Database Schema:**
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id UUID REFERENCES clients(id),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'draft',
  due_date DATE,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL
);
```

---

## Phase 2: Frontend Integration

### Agent 2.1: Frontend Hooks Update
**Scope:** Replace console.log stubs with real API calls
**Files to Modify:**
- `apps/web/hooks/useBusinessDashboard.ts`
- `apps/web/hooks/useCoupleDashboard.ts`
- `apps/web/lib/api/events.ts` (create)
- `apps/web/lib/api/clients.ts` (create)
- `apps/web/lib/api/team.ts` (create)
- `apps/web/lib/api/invoices.ts` (create)

**Mutations to Implement:**
```typescript
// useBusinessDashboard.ts
useCreateEvent: POST /api/events
useUpdateEvent: PUT /api/events/:id
useDeleteEvent: DELETE /api/events/:id
useCreateClient: POST /api/clients
useUpdateClient: PUT /api/clients/:id
useDeleteClient: DELETE /api/clients/:id
useInviteTeamMember: POST /api/team/invite
useRemoveTeamMember: DELETE /api/team/:id
useCreateInvoice: POST /api/invoices
useUpdateInvoice: PUT /api/invoices/:id
useSendInvoice: POST /api/invoices/:id/send
```

---

### Agent 2.2: Analytics Dashboard
**Scope:** Replace mock data with real API
**Files:**
- `apps/web/app/dashboard/analytics/page.tsx`
- Create: `apps/api/src/modules/analytics/routes.js`
- Create: `apps/api/src/modules/analytics/service.js`

**New Endpoints:**
```
GET /api/analytics/rsvp-trends?from=&to=     - RSVP over time
GET /api/analytics/event-types               - Event type distribution
GET /api/analytics/revenue?from=&to=         - Revenue data
GET /api/analytics/overview                  - Summary stats
```

**Frontend Changes:**
- Replace mock arrays with React Query hooks
- Add date range picker
- Add loading states
- Add error boundaries

---

### Agent 2.3: Admin Billing & Team Pages
**Scope:** Replace mock data with real APIs
**Files:**
- `apps/web/app/admin/billing/page.tsx`
- `apps/web/app/dashboard/team/page.tsx`
- `apps/web/hooks/useAdminBilling.ts` (create)
- `apps/web/hooks/useTeam.ts` (create)

**Changes:**
- Connect to real invoice APIs
- Connect to real team APIs
- Add loading states
- Add error handling
- Add empty states

---

## Phase 3: Full-Stack Features

### Agent 3.1: CSV Import System
**Scope:** Complete CSV import for guests/clients
**Backend:**
- `apps/api/src/modules/import/routes.js` - CSV upload endpoint
- `apps/api/src/modules/import/service.js` - Parse & validate
- `apps/api/src/modules/import/validation.js` - Schema validation

**Frontend:**
- Update `apps/web/components/import/csv-uploader.tsx`
- Connect to real API
- Add progress indicators
- Add validation errors display
- Add preview before import

**Endpoint:**
```
POST /api/import/csv
Content-Type: multipart/form-data
Body: { file, type: 'guests' | 'clients', options: {...} }
Response: { imported: 150, errors: [], warnings: [] }
```

---

### Agent 3.2: Visual Editor Foundation
**Scope:** Basic visual editor implementation
**Files:**
- `apps/web/app/editor/[siteId]/page.tsx` - Replace stub
- `apps/web/components/editor/` (create directory)
  - `canvas.tsx` - Main editing canvas
  - `toolbar.tsx` - Editing tools
  - `sidebar.tsx` - Component library
  - `properties.tsx` - Property panel

**Features:**
- Drag-and-drop components
- Text editing inline
- Image upload/selection
- Color picker
- Preview mode
- Save changes

**API Endpoint:**
```
PUT /api/sites/:id/content - Save site content
GET  /api/sites/:id/content - Get site content
```

---

## Phase 4: UI/UX Polish

### Agent 4.1: Landing Page Photos
**Scope:** Replace placeholders with real photos
**Files:**
- `apps/web/app/page.tsx`

**Changes:**
- Add Unsplash integration or curated photo URLs
- Add responsive image loading
- Add lazy loading
- Add blur-up placeholder effect

**Photo Categories:**
- Hero: Elegant wedding scene
- Features: Invitation cards, RSVP interface, Photo gallery
- Testimonials: Professional headshots

---

### Agent 4.2: Legal Pages
**Scope:** Create Terms of Service and Privacy Policy
**Files:**
- `apps/web/app/terms/page.tsx`
- `apps/web/app/privacy/page.tsx`

**Content:**
- Professional legal language
- GDPR compliance sections
- Data usage explanation
- Contact information
- Last updated date

---

### Agent 4.3: Disabled States & Tooltips
**Scope:** Improve UX for disabled features
**Files:**
- `apps/web/components/ui/coming-soon-badge.tsx` (enhance)
- Update all disabled buttons across dashboard

**Changes:**
- Add clear tooltips explaining why disabled
- Add links to feature request/feedback
- Add "Notify me when available" option
- Better visual distinction

---

## Phase 5: Integration Testing

### Agent 5.1: End-to-End Testing
**Scope:** Test all new features
**Files:**
- Create test plans
- Run through critical user flows
- Fix any integration issues

**Test Flows:**
1. Business user: Create event → Add client → Create invoice → Send invite
2. Couple user: Complete onboarding → View dashboard → Import guests
3. Admin: View analytics → Manage billing → View team

---

## Execution Order

### Wave 1 (Parallel) - Backend Foundation
- Agent 1.1: Events API
- Agent 1.2: Clients API  
- Agent 1.3: Team API
- Agent 1.4: Invoices API

### Wave 2 (Parallel) - Frontend Integration
- Agent 2.1: Hooks Update (depends on Wave 1)
- Agent 2.2: Analytics (depends on Wave 1)
- Agent 2.3: Admin/Team Pages (depends on Wave 1)

### Wave 3 (Parallel) - Full-Stack Features
- Agent 3.1: CSV Import (backend + frontend)
- Agent 3.2: Visual Editor (frontend focused)

### Wave 4 (Parallel) - UI/UX Polish
- Agent 4.1: Landing Photos
- Agent 4.2: Legal Pages
- Agent 4.3: Disabled States

### Wave 5 - Testing & Integration
- Agent 5.1: End-to-End Testing

---

## Communication Protocol

Each agent must:
1. Read existing code patterns before writing
2. Follow the established architecture (Fastify modules, React Query hooks)
3. Export functions matching existing patterns
4. Return consistent error formats
5. Add proper TypeScript types
6. Include JSDoc comments

## Success Criteria

- ✅ All API endpoints return real data (no mocks)
- ✅ All frontend mutations call real APIs
- ✅ Analytics shows real metrics
- ✅ CSV import works end-to-end
- ✅ Visual editor is functional
- ✅ No console.log stubs in production
- ✅ All disabled buttons have clear messaging
- ✅ Landing page has real photos
- ✅ Legal pages exist and are linked
- ✅ All features have error boundaries
