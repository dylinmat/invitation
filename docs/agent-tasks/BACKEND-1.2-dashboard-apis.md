# Backend Agent B: Dashboard Data APIs
**Task ID:** BACKEND-1.2  
**Priority:** Critical  
**Estimated Time:** 6-8 hours

## Objective
Create APIs that feed real data to the couple and business dashboards, replacing all mock data.

## Context
Currently both dashboards show hardcoded fake data:
- `dashboard/couple`: Shows "Alex & Jordan" wedding with static stats
- `dashboard/business`: Shows "Bloom Events" with fake clients

## API Endpoints to Create

### 1. GET /api/dashboard/couple
**Purpose:** Feed all data needed for the couple dashboard

**Response:**
```json
{
  "event": {
    "id": "uuid",
    "name": "Our Wedding",
    "date": "2025-06-15",
    "daysLeft": 120,
    "venue": "Garden Venue",
    "guestCount": 150
  },
  "stats": {
    "guests": 102,
    "rsvpRate": 68,
    "daysLeft": 120,
    "gifts": 24
  },
  "checklist": [
    { "id": 1, "text": "Send invitations", "completed": true },
    { "id": 2, "text": "Book venue", "completed": true },
    { "id": 3, "text": "Choose caterer", "completed": false }
  ],
  "recentActivity": [
    { "type": "rsvp", "message": "Sarah Chen accepted", "time": "2 hours ago" },
    { "type": "gift", "message": "Gift added", "time": "5 hours ago" }
  ]
}
```

**Database Queries Needed:**
- Get user's organization → find their primary event
- Count total guests from `guests` table
- Count RSVPs from `rsvps` table
- Calculate days until event
- Get checklist items from `checklists` table
- Get recent activity (combine RSVPs, gifts, photos)

### 2. GET /api/dashboard/business
**Purpose:** Feed all data for business dashboard

**Response:**
```json
{
  "clients": [
    { "id": 1, "name": "Smith Wedding", "type": "Wedding", "date": "2025-03-15", "status": "active", "guests": 150, "revenue": 5000 }
  ],
  "events": [
    { "id": 1, "name": "Smith Wedding", "type": "Wedding", "date": "2025-03-15", "status": "active", "guests": 150, "revenue": 5000 }
  ],
  "teamMembers": [
    { "id": 1, "name": "Sarah Chen", "role": "Lead Planner", "avatar": "SC" }
  ],
  "invoices": [
    { "id": "INV-001", "client": "Smith Wedding", "amount": 2500, "status": "paid", "date": "2025-01-15" }
  ],
  "analytics": {
    "totalRevenue": 21300,
    "activeEvents": 4,
    "totalGuests": 580,
    "conversionRate": 78
  }
}
```

### 3. GET /api/checklist
**Purpose:** Get wedding checklist items

**Response:**
```json
{
  "items": [
    { "id": 1, "text": "Send invitations", "completed": true, "category": "planning" },
    { "id": 2, "text": "Book venue", "completed": true, "category": "venue" }
  ]
}
```

### 4. POST /api/checklist
**Purpose:** Add custom checklist item

**Request:**
```json
{ "text": "Order flowers", "category": "vendor" }
```

### 5. PUT /api/checklist/:id
**Purpose:** Toggle checklist item completion

**Request:**
```json
{ "completed": true }
```

### 6. POST /api/events/:id/reminders
**Purpose:** Send RSVP reminders

**Request:**
```json
{ "type": "rsvp", "message": "Please respond by March 1st" }
```

**Logic:**
- Get guests who haven't RSVPed
- Queue emails via email service
- Return count of reminders sent

## Required Database Tables

Check if these exist, create migrations if not:

```sql
-- Checklists table
CREATE TABLE IF NOT EXISTS checklists (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    text text NOT NULL,
    completed boolean DEFAULT false,
    category text DEFAULT 'general',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Activities/audit log table (if not exists)
CREATE TABLE IF NOT EXISTS activities (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type text NOT NULL, -- 'rsvp', 'gift', 'photo', 'invoice', etc.
    message text NOT NULL,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- Invoices table (for business)
CREATE TABLE IF NOT EXISTS invoices (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_id uuid REFERENCES events(id),
    invoice_number text NOT NULL,
    client_name text NOT NULL,
    amount numeric NOT NULL,
    status text DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
    due_date date,
    created_at timestamptz DEFAULT now()
);
```

## File Structure

```
apps/api/src/modules/
├── dashboard/
│   ├── routes.js      # All GET endpoints
│   ├── service.js     # Business logic
│   └── index.js       # Export
├── checklist/
│   ├── routes.js      # CRUD for checklist
│   ├── service.js
│   └── index.js
└── activities/
    └── service.js     # Activity logging
```

## Seed Data for Testing

Add some test data so dashboards aren't empty:

```sql
-- Add default checklist template for couples
INSERT INTO checklists (organization_id, text, category) VALUES
('org-uuid', 'Send invitations', 'communication'),
('org-uuid', 'Book venue', 'venue'),
('org-uuid', 'Choose caterer', 'food'),
('org-uuid', 'Select photographer', 'vendor'),
('org-uuid', 'Plan honeymoon', 'planning');
```

## Testing

Create test data and verify:
```bash
# Get auth token first
TOKEN=$(curl -X POST https://api.railway.app/auth/login -d '{"email":"test@test.com"}' | jq -r .token)

# Test couple dashboard
curl -H "Authorization: Bearer $TOKEN" https://api.railway.app/api/dashboard/couple

# Test business dashboard  
curl -H "Authorization: Bearer $TOKEN" https://api.railway.app/api/dashboard/business
```

## Performance Notes

- Use database indexes on `organization_id` for all queries
- Consider caching dashboard stats (Redis) if slow
- Use JOINs efficiently to minimize queries
- Return only fields needed by frontend
