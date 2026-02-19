# Backend Agent A: User & Organization APIs
**Task ID:** BACKEND-1.1  
**Priority:** Critical (Blocks all frontend work)  
**Estimated Time:** 4-6 hours

## Objective
Create all backend APIs needed for user onboarding (saving user type, couple details, business details, and plan selection).

## Context
The onboarding flow at `/onboarding` currently uses `setTimeout` mocks. Users select "Personal Event" (COUPLE) or "Professional" (PLANNER/VENUE), enter details, but nothing is persisted to the database.

## Files to Create/Modify

### New Files
1. `apps/api/src/modules/users/routes.js` - User API routes
2. `apps/api/src/modules/users/service.js` - User business logic
3. `apps/api/src/modules/organizations/routes.js` - Organization routes
4. `apps/api/src/modules/organizations/service.js` - Organization logic

### Files to Modify
5. `apps/api/src/app.js` - Register new routes
6. `db/migrations/` - Add columns if needed

## API Specifications

### 1. POST /api/users/onboarding
**Purpose:** Save onboarding data after user selects type and enters details

**Request Body:**
```json
{
  "type": "COUPLE" | "PLANNER" | "VENUE",
  "coupleNames": { "partner1": "string", "partner2": "string" },
  "eventDate": "2025-06-15",
  "businessName": "string",
  "website": "string",
  "businessType": "PLANNER" | "VENUE" | "VENDOR"
}
```

**Response:**
```json
{
  "success": true,
  "organization": {
    "id": "uuid",
    "type": "COUPLE",
    "name": "Alex & Jordan",
    "coupleNames": { "partner1": "Alex", "partner2": "Jordan" },
    "eventDate": "2025-06-15"
  }
}
```

**Logic:**
- Get current user from JWT token
- Create or update organization with type
- For COUPLE: Store coupleNames as JSONB, generate name as "{partner1} & {partner2}"
- For professional types: Store businessName, website, businessType
- Set `users.onboarding_completed = true`
- Return organization object

### 2. PUT /api/users/plan
**Purpose:** Update user's selected subscription plan

**Request Body:**
```json
{
  "plan": "FREE" | "STARTER" | "PROFESSIONAL"
}
```

**Logic:**
- Update `users.selected_plan` column
- If upgrading from FREE, set trial period (14 days)

### 3. GET /api/users/me/organization
**Purpose:** Get current user's organization details

**Response:**
```json
{
  "id": "uuid",
  "type": "COUPLE",
  "name": "Alex & Jordan",
  "coupleNames": { "partner1": "Alex", "partner2": "Jordan" },
  "eventDate": "2025-06-15",
  "website": null,
  "businessType": null
}
```

## Database Changes Required

Run these migrations or add to schema:

```sql
-- Check if columns exist first
DO $$
BEGIN
    -- Add to users table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'onboarding_completed') THEN
        ALTER TABLE users ADD COLUMN onboarding_completed boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'selected_plan') THEN
        ALTER TABLE users ADD COLUMN selected_plan text DEFAULT 'FREE';
    END IF;
    
    -- Add to organizations table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'couple_names') THEN
        ALTER TABLE organizations ADD COLUMN couple_names jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'event_date') THEN
        ALTER TABLE organizations ADD COLUMN event_date date;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'website') THEN
        ALTER TABLE organizations ADD COLUMN website text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'business_type') THEN
        ALTER TABLE organizations ADD COLUMN business_type text;
    END IF;
END $$;
```

## Implementation Pattern

Follow existing code patterns in `apps/api/src/modules/auth/`:

```javascript
// Example pattern from auth/routes.js
module.exports = async function (fastify, opts) {
  const userService = require('./service')(fastify);
  
  fastify.post('/onboarding', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const userId = request.user.id;
      const result = await userService.completeOnboarding(userId, request.body);
      return { success: true, organization: result };
    }
  });
};
```

## Testing Checklist

- [ ] POST /onboarding creates org for COUPLE type
- [ ] POST /onboarding creates org for PLANNER type
- [ ] POST /onboarding updates existing org if called again
- [ ] GET /me/organization returns correct data
- [ ] PUT /plan updates selected_plan
- [ ] All endpoints require authentication
- [ ] Proper error handling for invalid input

## Handoff Notes for Next Agent

After completing this task:
1. Note the exact API endpoint URLs
2. Document any request/response differences from spec
3. Mention if any auth middleware changes were needed
4. Provide curl examples for testing
