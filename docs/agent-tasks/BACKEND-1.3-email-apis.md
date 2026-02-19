# Backend Agent C: Email & Communication APIs
**Task ID:** BACKEND-1.3  
**Priority:** High  
**Estimated Time:** 3-4 hours

## Objective
Implement email resend endpoints and RSVP reminder functionality.

## Target File
`apps/api/src/modules/emails/` (extend existing)

## Endpoints to Create

### 1. POST /api/auth/resend-magic-link
**Purpose:** Resend magic link email

**Request:**
```json
{ "email": "user@example.com" }
```

**Logic:**
- Rate limit: max 3 requests per hour per email
- Generate new magic link token
- Send via email service (SendGrid/AWS SES)
- Return success even if email not found (security)

### 2. POST /api/auth/resend-verification
**Purpose:** Resend email verification link

**Request:**
```json
{ "email": "user@example.com" }
```

**Logic:**
- Same rate limiting as magic link
- Generate new verification token
- Send email

### 3. POST /api/events/:id/reminders
**Purpose:** Send RSVP reminders to non-responders

**Request:**
```json
{
  "type": "rsvp",
  "message": "Optional custom message"
}
```

**Logic:**
- Find all guests for event with status "pending"
- Queue emails via background job (Bull/Redis)
- Return count of reminders queued
- Rate limit: max 1 reminder per 24 hours per guest

## Implementation

```javascript
// routes.js
module.exports = async function (fastify, opts) {
  const emailService = require('./service')(fastify);
  
  fastify.post('/auth/resend-magic-link', {
    handler: async (request, reply) => {
      const { email } = request.body;
      await emailService.resendMagicLink(email);
      return { success: true, message: "If an account exists, a link has been sent" };
    }
  });

  fastify.post('/auth/resend-verification', {
    handler: async (request, reply) => {
      const { email } = request.body;
      await emailService.resendVerification(email);
      return { success: true };
    }
  });

  fastify.post('/events/:id/reminders', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const eventId = request.params.id;
      const userId = request.user.id;
      const { type, message } = request.body;
      
      const result = await emailService.sendReminders(eventId, userId, { type, message });
      return { success: true, sent: result.count };
    }
  });
};
```

## Rate Limiting

Use Redis for rate limiting:

```javascript
async function checkRateLimit(key, maxAttempts, windowSeconds) {
  const current = await redis.get(key);
  if (current && parseInt(current) >= maxAttempts) {
    throw new Error("Rate limit exceeded. Please try again later.");
  }
  await redis.multi()
    .incr(key)
    .expire(key, windowSeconds)
    .exec();
}
```

## Testing

Test rate limiting works correctly:
```bash
# Should work
curl -X POST /api/auth/resend-magic-link -d '{"email":"test@test.com"}'

# 4th request should fail (rate limited)
```
