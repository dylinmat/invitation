# Messaging Cockpit and Delivery Flows

## Cockpit Concepts
- **Campaign**: A scheduled or immediate send (email or WhatsApp quick-send).
- **Audience**: Saved segment or explicit guest list.
- **Template**: Email/WhatsApp content with merge fields.
- **Message**: Per-recipient delivery record and status.

## Gating: Readiness and Trust

Readiness score factors:
- Domain verification complete (SPF/DKIM/DMARC).
- Unsubscribe/suppression compliance enabled.
- List hygiene (bounce rate under threshold).
- Organization age and prior sends.

Trust score factors:
- Admin review status (manual override).
- Abuse signals (rapid guest imports + large sends).

Gate outcome:
- **Allow**: send at normal rate.
- **Throttled**: reduced per-minute rate.
- **Blocked**: requires admin override.

## Email Flow (SES)
1. Campaign created and queued.
2. Worker expands recipients into message jobs.
3. Each message is sent via SES with idempotency keys.
4. Webhooks update status: sent/open/click/bounce/complaint.
5. Suppression lists updated from bounces/complaints/unsubscribes.

## WhatsApp Quick-Send (Free)
- Generate `wa.me` links with prefilled message per recipient.
- “Guided send” UI walks organizer through opening chat and tapping send.
- Track only “opened send screen” events and RSVP conversions.

## SMS OTP (Premium, Twilio Verify)
- OTP requests are throttled per IP, per phone, per project.
- Twilio Verify used for SMS delivery and verification.
- All OTP attempts logged for auditing and abuse detection.

