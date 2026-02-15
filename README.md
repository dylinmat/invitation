# Event Invitation OS (EIOS)

This repository contains the initial architecture, schema, and service scaffolding
for the Event Invitation OS platform described in the requirements spec.

## Structure

- `docs/` Architecture, settings engine, editor/CRDT, messaging, ops/security.
- `db/` Core PostgreSQL schema draft.
- `apps/`
  - `api/` Modular monolith API scaffold.
  - `realtime/` Realtime collaboration server scaffold.
  - `worker/` Background job worker scaffold.
  - `web/` Web surface scaffold.
- `packages/shared/` Shared utilities and resolution logic.

## Quick Start (Scaffold Only)

These are minimal Node-based entry points for now:

- `node apps/api/src/index.js`
- `node apps/realtime/src/index.js`
- `node apps/worker/src/index.js`
- `node apps/web/src/server.js`

Database setup (optional for now):

- Set `DATABASE_URL`
- `node apps/api/src/db/migrate.js`

## API Endpoints (Scaffold)

- `GET /settings/definitions`
- `POST /settings/resolve`
- `POST /settings/values`
- `GET /settings/values`
- `GET /entitlements/resolve`
- `POST /admin/plans`
- `GET /admin/plans`
- `POST /admin/plans/entitlements`
- `GET /admin/plans/entitlements`
- `POST /admin/org-plans`
- `GET /admin/org-plans`
- `POST /admin/project-plans`
- `GET /admin/project-plans`
- `POST /admin/entitlements/overrides`
- `GET /admin/entitlements/overrides`
- `POST /messaging/campaigns`

## Next Steps

- Add framework dependencies (Next.js, DB drivers, Redis, queue clients).
- Implement domain module boundaries inside `apps/api`.
- Wire providers (SES, Twilio, OpenSRS, Rekognition).

