# Ops, Security, and Observability

## Rate Limits (Defaults)

- Auth (magic link): 5 requests / 10 min / IP
- Auth (OTP verify): 10 attempts / 10 min / IP
- OTP requests (SMS/email): 3 / 15 min / contact + 10 / hr / IP
- RSVP search: 20 / 10 min / IP (tunable by privacy mode)
- Messaging send: 100 / hr / org (pre-trust), 5k / hr (trusted)
- Invite access: 60 / min / token (burst) to slow scraping
- Uploads: 10 / 5 min / guest (photo wall)

## Audit Logs (Core Events)

Every critical mutation emits an audit event:
- `project.created`, `project.ownership_transferred`
- `settings.updated`, `entitlements.changed`
- `invite.security_mode_changed`, `invite.revoked`
- `messaging.campaign.sent`, `messaging.campaign.blocked`
- `domain.verified`, `domain.failed`
- `retention.archived`, `retention.deleted`

Audit record fields:
- `id`, `timestamp`, `actor_user_id`, `org_id`, `project_id`
- `action`, `target_type`, `target_id`, `metadata`
- `ip_address`, `user_agent`, `correlation_id`

## Observability Metrics

Messaging:
- Send rate, bounce rate, complaint rate, unsubscribe rate.
- Readiness/trust gating decisions.

OTP:
- OTP request volume, verification success rate, throttling triggers.

Collaboration:
- Concurrent editors per doc, snapshot size, compaction latency.

Jobs:
- Queue depth, retry counts, dead-letter rate.

Domains:
- Verification success rate, cert issuance failures.

## Tracing and Correlation
- Correlation IDs injected at ingress and propagated to all logs.
- Job payloads carry `correlation_id` for async tracing.

