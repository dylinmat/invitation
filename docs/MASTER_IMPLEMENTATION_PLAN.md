# Master Implementation Plan
## EIOS Enterprise-Grade Feature Set

---

## Overview
Implement comprehensive feature set based on research from The Knot, Zola, HoneyBook, Eventbrite, Notion, and Linear.

---

## Agent Swarm Structure

### Phase 1: Navigation & Wayfinding (Day 1)
**Goal:** Help users navigate efficiently

#### Agent 1.1: Command Palette System
**Files:**
- `apps/web/components/command-palette.tsx` (new)
- `apps/web/hooks/useCommandPalette.ts` (new)
- `apps/web/app/layout.tsx` (add provider)

**Features:**
- Cmd+K hotkey
- Search across pages, events, guests
- Quick actions ("Create event", "Add guest")
- Recent items
- Keyboard navigation (arrow keys, enter)

**APIs Needed:**
- `GET /api/search?q={query}` - Global search

---

#### Agent 1.2: Breadcrumb Navigation
**Files:**
- `apps/web/components/breadcrumbs.tsx` (new)
- Update all dashboard pages

**Features:**
- Dynamic breadcrumbs based on route
- Clickable navigation
- Mobile-responsive (collapsible)

---

#### Agent 1.3: Keyboard Shortcuts System
**Files:**
- `apps/web/hooks/useKeyboardShortcuts.ts` (new)
- `apps/web/components/keyboard-help.tsx` (new)
- Add to all pages

**Shortcuts:**
- `Cmd/Ctrl+K` - Command palette
- `Cmd/Ctrl+/` - Show shortcuts help
- `G` then `D` - Go to dashboard
- `G` then `E` - Go to events
- `N` then `E` - New event
- `N` then `G` - New guest
- `?` - Show help
- `Esc` - Close modals

---

### Phase 2: Data Import & Management (Day 2)
**Goal:** Make data entry effortless

#### Agent 2.1: CSV Import System
**Files:**
- `apps/web/components/import/csv-uploader.tsx` (new)
- `apps/web/components/import/guest-import.tsx` (new)
- `apps/api/src/modules/import/routes.js` (new)

**Features:**
- Drag-and-drop CSV upload
- Column mapping UI
- Preview before import
- Error handling for invalid rows
- Progress indicator for large files
- Template CSV download

**CSV Format Support:**
```csv
name,email,phone,plus_ones,dietary_restrictions
column mapping UI
```

**APIs:**
- `POST /api/import/guests` - Bulk guest import
- `GET /api/import/template` - Download template

---

#### Agent 2.2: Gmail/Contacts Import
**Files:**
- `apps/web/components/import/contacts-import.tsx` (new)
- Google OAuth integration

**Features:**
- Connect Google account
- Select contacts to import
- Auto-detect name/email

---

### Phase 3: Visual Pipeline (Day 3)
**Goal:** HoneyBook-style event management

#### Agent 3.1: Kanban Board
**Files:**
- `apps/web/components/kanban/board.tsx` (new)
- `apps/web/components/kanban/card.tsx` (new)
- `apps/web/components/kanban/column.tsx` (new)
- `apps/web/app/dashboard/board/page.tsx` (new)

**Features:**
- Drag-and-drop columns
- Event cards with key info
- Status columns (Inquiry → Planning → Confirmed → Completed)
- Drag events between statuses
- Filter by date, type, client

**Tech:**
- `@dnd-kit/core` for drag-and-drop
- `@dnd-kit/sortable` for reordering

**APIs:**
- `PUT /api/events/:id/status` - Update event status
- `GET /api/events?status={status}` - Filter by status

---

#### Agent 3.2: Calendar Integration
**Files:**
- `apps/web/components/calendar/sync.tsx` (new)
- `apps/api/src/modules/calendar/routes.js` (new)

**Features:**
- Connect Google Calendar
- Connect Outlook Calendar
- Sync events both ways
- Show availability

---

### Phase 4: Communication Hub (Day 4)
**Goal:** Centralize guest communication

#### Agent 4.1: Email Templates
**Files:**
- `apps/web/components/email/templates.tsx` (new)
- `apps/web/components/email/editor.tsx` (new)
- `apps/api/src/modules/email/templates.js` (new)

**Features:**
- Pre-built templates:
  - Save the Date
  - Formal Invitation
  - Reminder
  - Thank You
- Rich text editor
- Variable substitution ({{guest_name}}, {{event_date}})
- Preview mode

**APIs:**
- `GET /api/email/templates` - List templates
- `POST /api/email/send` - Send with template

---

#### Agent 4.2: Bulk Messaging
**Files:**
- `apps/web/components/messaging/bulk-send.tsx` (new)

**Features:**
- Select guests by status, tag
- Compose message
- Schedule send time
- Delivery tracking

---

### Phase 5: Analytics & Insights (Day 5)
**Goal:** Data-driven decisions

#### Agent 5.1: Analytics Dashboard
**Files:**
- `apps/web/app/dashboard/analytics/page.tsx` (new)
- `apps/web/components/charts/` (new folder)
- `apps/api/src/modules/analytics/routes.js` (new)

**Features:**
- RSVP rate over time (line chart)
- Guest demographics (pie chart)
- Revenue tracking (bar chart)
- Event type breakdown
- Response time analytics
- Export reports (PDF, CSV)

**Charts:**
- Line chart: RSVPs over time
- Pie chart: Guest status distribution
- Bar chart: Monthly events
- Donut chart: Meal preferences

**Tech:**
- `recharts` for React charts

**APIs:**
- `GET /api/analytics/dashboard` - Overview stats
- `GET /api/analytics/rsvp-trends` - Time series
- `GET /api/analytics/export` - Export data

---

#### Agent 5.2: Budget Tracker
**Files:**
- `apps/web/components/budget/tracker.tsx` (new)
- `apps/web/components/budget/categories.tsx` (new)

**Features:**
- Budget categories (Venue, Food, Decor, etc.)
- Expense tracking
- Vendor cost comparison
- Budget vs actual
- Remaining budget indicator

---

### Phase 6: Advanced Features (Day 6-7)
**Goal:** Premium functionality

#### Agent 6.1: Seating Chart
**Files:**
- `apps/web/components/seating/` (new folder)
- Drag-and-drop table placement
- Guest assignment
- Table shapes (round, rectangular)
- Conflict detection (ex-spouses)
- Print view

---

#### Agent 6.2: AI Assistant
**Files:**
- `apps/web/components/ai/assistant.tsx` (new)
- OpenAI integration

**Features:**
- Smart guest list suggestions
- RSVP reminder timing optimization
- Budget recommendations
- Vendor suggestions

---

## Shared Components

### New UI Components Needed
```
components/
├── command-palette/
│   ├── command-palette.tsx
│   └── command-item.tsx
├── breadcrumbs/
│   └── breadcrumbs.tsx
├── kanban/
│   ├── board.tsx
│   ├── column.tsx
│   └── card.tsx
├── import/
│   ├── csv-uploader.tsx
│   └── guest-import.tsx
├── email/
│   ├── templates.tsx
│   └── editor.tsx
├── charts/
│   ├── line-chart.tsx
│   ├── pie-chart.tsx
│   └── bar-chart.tsx
├── budget/
│   └── tracker.tsx
└── ai/
    └── assistant.tsx
```

---

## API Endpoints Summary

### New Endpoints Required

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/search` | Global search for command palette |
| POST | `/api/import/guests` | CSV import |
| GET | `/api/import/template` | Download CSV template |
| PUT | `/api/events/:id/status` | Update event status |
| GET | `/api/email/templates` | List email templates |
| POST | `/api/email/send` | Send bulk emails |
| GET | `/api/analytics/dashboard` | Analytics overview |
| GET | `/api/analytics/export` | Export reports |

---

## Database Schema Additions

```sql
-- Email templates
CREATE TABLE email_templates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id uuid REFERENCES organizations(id),
    name text NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    variables jsonb DEFAULT '[]',
    created_at timestamptz DEFAULT now()
);

-- Event statuses for kanban
CREATE TABLE event_statuses (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id uuid REFERENCES organizations(id),
    name text NOT NULL,
    color text DEFAULT '#gray',
    order_index integer DEFAULT 0
);

-- Budget categories
CREATE TABLE budget_categories (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id uuid REFERENCES organizations(id),
    name text NOT NULL,
    allocated_amount numeric DEFAULT 0,
    spent_amount numeric DEFAULT 0
);

-- Expenses
CREATE TABLE expenses (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id uuid REFERENCES budget_categories(id),
    description text NOT NULL,
    amount numeric NOT NULL,
    vendor text,
    date date,
    created_at timestamptz DEFAULT now()
);
```

---

## Technology Stack Additions

### New Dependencies
```json
{
  "@dnd-kit/core": "^6.0.8",
  "@dnd-kit/sortable": "^7.0.2",
  "recharts": "^2.10.3",
  "papaparse": "^5.4.1",
  "react-quill": "^2.0.0",
  "cmdk": "^0.2.0"
}
```

---

## Success Metrics

### User Experience
- [ ] Command palette opens in <100ms
- [ ] CSV import handles 1000 rows in <5s
- [ ] Kanban drag-and-drop is 60fps
- [ ] Charts render in <1s

### Business Value
- [ ] Import reduces guest entry time by 90%
- [ ] Email templates save 5 min per send
- [ ] Kanban view increases event completion rate
- [ ] Analytics help optimize event costs

---

## Deployment Strategy

### Phase 1: Navigation (Day 1)
- Low risk, high UX value
- Deploy after each agent completes

### Phase 2: Import (Day 2)
- Test with sample CSV files
- Staging environment validation

### Phase 3: Kanban (Day 3)
- Feature flag for gradual rollout
- A/B test vs list view

### Phase 4: Communication (Day 4)
- Email sending rate limits
- Queue system for bulk sends

### Phase 5: Analytics (Day 5)
- Background job for heavy queries
- Caching for dashboard stats

---

## Agent Assignment

| Agent | Phase | Focus |
|-------|-------|-------|
| A1 | 1 | Command Palette |
| A2 | 1 | Breadcrumbs + Shortcuts |
| B1 | 2 | CSV Import |
| B2 | 2 | Contacts Import |
| C1 | 3 | Kanban Board |
| C2 | 3 | Calendar Integration |
| D1 | 4 | Email Templates |
| D2 | 4 | Bulk Messaging |
| E1 | 5 | Analytics Charts |
| E2 | 5 | Budget Tracker |
| F1 | 6 | Seating Chart |
| F2 | 6 | AI Assistant |

---

## Handoff Protocol

1. Each agent updates this doc with progress
2. Shared components go in `/components/shared/`
3. API contracts documented in `/docs/api/`
4. E2E tests in `/tests/e2e/`

---

## Quality Gates

Before deployment:
- [ ] All TypeScript types defined
- [ ] Unit tests > 80% coverage
- [ ] Accessibility audit (axe-core)
- [ ] Performance budget met
- [ ] Mobile responsive verified
- [ ] Error handling tested
