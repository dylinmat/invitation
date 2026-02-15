# Event Invitation OS (EIOS) Architecture

## AWS Service Mapping

| Capability | AWS Service | Notes |
| --- | --- | --- |
| CDN + edge caching | CloudFront | Public site and static assets; cache by site/version. |
| Static asset storage | S3 | Site assets, templates, exports, uploads, print-ready files. |
| Web app hosting | ECS Fargate + ALB | Next.js app (public + organizer + admin). |
| API monolith | ECS Fargate + ALB | Internal domain modules with strict boundaries. |
| Realtime collab | ECS Fargate + ALB | Yjs WebSocket server; long-lived connections. |
| Background jobs | ECS Fargate (worker) | SQS-driven jobs for email, exports, moderation. |
| Primary database | RDS PostgreSQL | Multi-tenant relational core. |
| Cache + rate limits | ElastiCache Redis | Sessions, throttles, collab presence. |
| Queues | SQS | Idempotent, retryable background jobs. |
| Event routing | EventBridge | Optional for cross-module events. |
| Email delivery | SES | Platform domain, SPF/DKIM/DMARC. |
| DNS + domain routing | Route 53 | BYOD verification, purchased domain setup. |
| TLS certificates | ACM | Auto-renewal for custom domains. |
| Secrets | Secrets Manager | SMTP creds, tokens, provider keys. |
| Observability | CloudWatch + X-Ray | Logs, metrics, traces, alerts. |
| WAF + rate control | AWS WAF | Edge protection for public sites. |

## Deployment Units (v1 Modular Monolith)

- `apps/web`: Next.js surface for public site, organizer dashboard, admin console.
- `apps/api`: API monolith with domain modules and internal interfaces.
- `apps/realtime`: Collab server for CRDT updates and presence.
- `apps/worker`: Background jobs (email, exports, moderation, domain provisioning).
- `packages/shared`: Shared types, settings schemas, and policy helpers.

## Domain Module Boundaries (API Monolith)

Each module owns its data models, business rules, and policies. Cross-module access goes through an internal interface or event.

- `IdentityAuth`: auth, sessions, social login, verification, rate limiting.
- `OrgsProjectsEvents`: org types, ownership transfer, project/event lifecycle.
- `SitesPublishing`: site versions, visibility, publishing, page rules.
- `TemplatesPacks`: template library, cloning, versioning, packs.
- `BrandWhiteLabel`: brand kits, tokens, white-label entitlements.
- `EditorSceneGraph`: scene graph storage, assets, exports.
- `RealtimeCollab`: CRDT updates, presence, snapshot compaction.
- `GuestsInvites`: guests/groups/tags, invite tokens, access logs.
- `RSVP`: forms, conditional logic, multi-event attendance, exports.
- `MessagingCockpit`: campaigns, readiness/trust scoring, suppression lists.
- `WhatsAppQuickSend`: quick-send links and conversion signals.
- `SeatingCheckin`: floor plans, assignments, QR check-in, metrics.
- `PhotoWall`: upload policies, moderation queue, Rekognition integration.
- `TravelAccommodations`: lodging blocks, inventory, maps, ICS.
- `GiftsInfo`: instructions, QR assets, copy fields.
- `PrintShop`: catalog, variants, mockups, checkout, fulfillment interface.
- `SettingsEntitlements`: settings resolution and plan enforcement.
- `RetentionLifecycle`: archive states, snapshots, anonymize/delete.
- `AnalyticsAudit`: dashboards, exports, audit logs, correlation IDs.

## Module Interaction Rules

- Modules can only read/write their own tables directly.
- Cross-module calls happen via internal service interfaces.
- Async work uses SQS jobs with idempotency keys.
- Any external provider call is wrapped by a provider interface per module.

