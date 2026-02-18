# EIOS Architecture Map

**Generated:** 2026-02-17  
**Version:** 1.0.0  

This document provides a comprehensive visual mapping of the EIOS (Event Invitation OS) system architecture, including service connections, data flows, and API dependencies.

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Web App    │  │ Public Sites │  │   Mobile     │  │  External    │    │
│  │  (Next.js)   │  │  (Subdomain) │  │   (Future)   │  │  Webhooks    │    │
│  │   :3000      │  │              │  │              │  │  (SES/S3)    │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
└─────────┼────────────────┼────────────────┼────────────────┼──────────────┘
          │                │                │                │
          │ HTTP/REST      │ HTTP/REST      │                │
          │                │                │                │
┌─────────┼────────────────┼────────────────┼────────────────┼──────────────┐
│         ▼                ▼                │                │              │
│  ┌──────────────────────────────────────┐ │                │              │
│  │          LOAD BALANCER               │ │                │              │
│  │      (Railway/AWS ALB/Nginx)         │ │                │              │
│  └──────────┬───────────────┬───────────┘ │                │              │
│             │               │             │                │              │
│             ▼               ▼             │                ▼              │
│  ┌─────────────────┐ ┌─────────────────┐ │      ┌─────────────────┐      │
│  │   API Service   │ │ Realtime Service│ │      │  Webhook Router │      │
│  │   (Fastify)     │ │  (WebSocket)    │ │      │   (Future)      │      │
│  │     :4000       │ │     :4100       │ │      │                 │      │
│  └────────┬────────┘ └─────────────────┘ │      └─────────────────┘      │
│           │                               │                               │
│           │ Shared                        │                               │
│           │ Connection                    │                               │
│           │ Pool                          │                               │
│           ▼                               │                               │
│  ┌──────────────────────────────────────┐ │                               │
│  │           DATA LAYER                 │ │                               │
│  ├──────────────────┬───────────────────┤ │                               │
│  │   PostgreSQL     │     Redis         │ │                               │
│  │   (Primary DB)   │   (Cache/Sessions)│ │                               │
│  │      :5432       │      :6379        │ │                               │
│  └──────────────────┴───────────────────┘ │                               │
│                                           │                               │
│  ┌──────────────────────────────────────┐ │                               │
│  │      EXTERNAL SERVICES (Future)      │ │                               │
│  ├──────────────────┬───────────────────┤ │                               │
│  │   AWS S3/MinIO   │    SES/SendGrid   │ │                               │
│  │  (File Storage)  │   (Email)         │ │                               │
│  └──────────────────┴───────────────────┘ │                               │
│                                           │                               │
└───────────────────────────────────────────┼───────────────────────────────┘
                                            │
                                            ▼
                              ┌─────────────────────────┐
                              │   Worker Service        │
                              │   (NOT IMPLEMENTED)     │
                              │   - Bull Queue          │
                              │   - Email Processing    │
                              │   - Job Workers         │
                              └─────────────────────────┘
```

---

## 2. Service Communication Matrix

| Source → Destination | Protocol | Port | Authentication | Status |
|---------------------|----------|------|----------------|--------|
| Web App → API | HTTP/REST | 4000 | Bearer Token | ✅ Active |
| Web App → Realtime | WebSocket | 4100 | Query Param | ⚠️ Partial |
| API → PostgreSQL | TCP | 5432 | SSL/Password | ✅ Active |
| API → Redis | TCP | 6379 | Password | ✅ Active |
| Realtime → PostgreSQL | TCP | 5432 | SSL/Password | ✅ Active |
| Realtime → Redis | TCP | 6379 | Password | ✅ Active |
| External → API | HTTP/REST | 4000 | API Key (Future) | ❌ Not Implemented |
| Worker → PostgreSQL | TCP | 5432 | SSL/Password | ❌ Not Implemented |

---

## 3. API Module Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API MODULES                                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│    Core      │
│   (index.ts) │
└──────┬───────┘
       │ registers
       ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                              PLUGINS                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │   CORS   │ │ Security │ │  Logger  │ │  Error   │ │ Swagger  │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
└────────────────────────────────────────────────────────────────────────────┘
       │
       │ loads
       ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                           DOMAIN MODULES                                    │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐                                                           │
│  │    Auth     │◄──────────────────┐                                       │
│  │  (Required) │                   │                                       │
│  └──────┬──────┘                   │                                       │
│         │ provides                   │                                       │
│         │ authenticate               │ uses                                  │
│         ▼                          │                                       │
│  ┌─────────────┐    ┌─────────────┐│  ┌─────────────┐    ┌─────────────┐  │
│  │  Projects   │◄──►│   Guests    │┘  │    Sites    │◄──►│   Editor    │  │
│  │             │    │             │   │             │    │  (Realtime) │  │
│  └──────┬──────┘    └──────┬──────┘   └──────┬──────┘    └─────────────┘  │
│         │                  │                 │                              │
│         │ uses             │ uses            │ uses                         │
│         ▼                  ▼                 ▼                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                          Shared Services                             │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │  │
│  │  │  Settings   │  │Entitlements │  │  Messaging  │  │   Audit   │  │  │
│  │  └─────────────┘  └─────────────┘  └──────┬──────┘  └───────────┘  │  │
│  └───────────────────────────────────────────┼────────────────────────┘  │
│                                              │                             │
│                                              │ requires                    │
│                                              ▼                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      UNREGISTERED MODULES                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │  │
│  │  │   Photos    │  │   Seating   │  │   Messaging Webhooks        │ │  │
│  │  │  ❌ Orphan  │  │  ❌ Orphan  │  │        ❌ Orphan            │ │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Database Entity Relationship Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ENTITY RELATIONSHIPS                               │
└─────────────────────────────────────────────────────────────────────────────┘

USERS & ORGANIZATIONS
─────────────────────
┌──────────┐         ┌──────────────────┐         ┌──────────────┐
│  users   │◄───────►│organization_members│◄─────►│organizations│
│          │  1:M    │                  │  M:1   │              │
└────┬─────┘         └──────────────────┘        └──────┬───────┘
     │                                                  │
     │ 1:1                                              │ 1:M
     ▼                                                  ▼
┌──────────┐                                    ┌──────────────┐
│sessions  │                                    │    plans     │
│(MISSING) │                                    │              │
└──────────┘                                    └──────────────┘

PROJECT HIERARCHY
─────────────────
                    ┌──────────┐
                    │organizations│
                    └────┬─────┘
                         │ 1:M
                         ▼
┌──────────┐    ┌─────────────────┐    ┌──────────────┐
│  events  │◄───┤     projects    ├───►│   sites      │
│          │ M:1│                 │ 1:M │              │
└──────────┘    └─────────────────┘     └──────┬───────┘
                                               │
                                               │ 1:M
                                               ▼
                                        ┌──────────────┐
                                        │ site_versions│
                                        │              │
                                        └──────────────┘

GUEST MANAGEMENT
────────────────
┌──────────┐      ┌──────────┐      ┌──────────┐
│ projects │◄────►│guest_groups│◄──►│  guests  │
│          │ 1:M  │          │ 1:M  │          │
└──────────┘      └──────────┘      └───┬──┬───┘
                                        │  │
                    ┌───────────────────┘  └───────────────────┐
                    │ 1:M                              M:M      │
                    ▼                                           ▼
            ┌──────────────┐                          ┌──────────────┐
            │guest_contacts│                          │  guest_tags  │
            │              │                          │              │
            └──────────────┘                          └──────────────┘

INVITES & RSVP
──────────────
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────────┐
│  sites   │◄────►│  invites │◄────►│  guests  │      │ rsvp_forms   │
│          │ 1:M  │          │ M:1  │          │      │              │
└──────────┘      └────┬─────┘      └──────────┘      └──────┬───────┘
                       │                                      │
                       │ 1:M                                  │ 1:M
                       ▼                                      ▼
              ┌─────────────────┐                    ┌──────────────┐
              │invite_access_logs│                   │rsvp_questions│
              │                 │                    │              │
              └─────────────────┘                    └──────┬───────┘
                                                            │
                                                            │ 1:M
                                                            ▼
                            ┌──────────────────────────────────────────┐
                            │           rsvp_submissions               │
                            │                   │                      │
                            │                   │ 1:M                  │
                            │                   ▼                      │
                            │            ┌─────────────┐               │
                            │            │rsvp_answers │               │
                            │            └─────────────┘               │
                            └──────────────────────────────────────────┘

MESSAGING (Incomplete Implementation)
─────────────────────────────────────
┌──────────┐      ┌───────────────────┐      ┌──────────────┐
│ projects │◄────►│messaging_campaigns│◄────►│ message_jobs │
│          │ 1:M  │                   │ 1:M  │   (STUCK)    │
└──────────┘      └───────────────────┘      └──────┬───────┘
                                                    │
                                                    │ 1:M
                                                    ▼
                                           ┌──────────────┐
                                           │message_events│
                                           │              │
                                           └──────────────┘

SEATING & CHECK-IN (Orphaned)
─────────────────────────────
┌──────────┐      ┌──────────────┐      ┌──────────────┐
│  events  │◄────►│ floor_plans  │◄────►│seating_tables│
│          │ 1:M  │              │ 1:M  │              │
└────┬─────┘      └──────────────┘      └──────┬───────┘
     │                                          │
     │ 1:M                                      │ 1:M
     ▼                                          ▼
┌──────────────┐                       ┌──────────────────┐
│check_in_records│                     │seating_assignments│
│              │                       │                  │
└──────────────┘                       └──────────────────┘

PHOTO WALL (Orphaned)
─────────────────────
┌──────────┐      ┌──────────────────┐      ┌──────────────┐
│ projects │◄────►│photo_wall_settings│     │photo_uploads │
│          │ 1:1  │                  │◄────►│              │
└──────────┘      └──────────────────┘ M:1  └──────┬───────┘
                                                   │
                                                   │ 1:M
                                                   ▼
                                          ┌──────────────┐
                                          │  photo_likes │
                                          │              │
                                          └──────────────┘
```

---

## 5. Frontend Page Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PAGE HIERARCHY                                     │
└─────────────────────────────────────────────────────────────────────────────┘

PUBLIC ROUTES (No Auth Required)
────────────────────────────────
/
├── / (Landing Page) ✅ Complete
├── /auth/
│   ├── /login ✅ Complete
│   └── /verify ✅ Complete
├── /public/
│   └── /[subdomain] ⚠️ Incomplete (Placeholder)
└── /api/
    ├── /health ✅ Complete
    └── /ready ✅ Complete

PROTECTED ROUTES (Auth Required)
────────────────────────────────
/dashboard
├── / (Dashboard Home) ⚠️ Partial
│   ├── KPI Cards - Mock Data
│   ├── Project List - Real API ✅
│   └── Activity Feed - Mock Data
├── /projects/
│   └── /[id] ⚠️ Incomplete
│       ├── Overview Tab ✅ Real Data
│       ├── Guests Tab ❌ Placeholder
│       ├── Invites Tab ❌ Placeholder
│       ├── Sites Tab ❌ Placeholder
│       └── Settings Tab ❌ Placeholder
├── /analytics ❌ Mock Data
├── /audit ❌ Mock Data
├── /board ⚠️ Kanban UI Only
├── /team ⚠️ Partial
└── /enterprise-demo ❌ Demo Page

/editor
└── /[siteId] ⚠️ Incomplete
    ├── Editor UI ✅
    └── WebSocket Connection ❌ Not Connected

/admin (Future)
├── / ⚠️ Skeleton
├── /users ❌ Skeleton
├── /organizations ❌ Skeleton
├── /billing ❌ Skeleton
├── /settings ❌ Skeleton
└── /support ❌ Skeleton

AUTH GUARD FLOW
───────────────
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Request   │────►│ Middleware  │────►│   Target    │
│             │     │   (matcher) │     │    Page     │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │  Protected? │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │ No         │ Yes        │
              ▼            ▼            │
       ┌──────────┐  ┌──────────┐       │
       │  Allow   │  │ Has      │       │
       │          │  │ Token?   │       │
       └──────────┘  └────┬─────┘       │
                     ┌────┴────┐        │
                No ◄─┤         ├─► Yes │
                     └────┬────┘        │
                          ▼             │
                   ┌──────────┐         │
                   │ Redirect │─────────┘
                   │ to /auth │
                   │ /login   │
                   └──────────┘
```

---

## 6. API Endpoint Map

### Auth Module (`/auth/*`)
```
POST   /auth/register         ✅ Register new user
POST   /auth/login            ✅ Request magic link
POST   /auth/verify           ✅ Verify OTP + create session
POST   /auth/logout           ✅ Logout (requires auth)
GET    /auth/me               ✅ Get current user
PATCH  /auth/profile          ⚠️ Partial (mock update)
```

### Organization Module (`/orgs/*`)
```
POST   /orgs                  ✅ Create organization
GET    /orgs/:id              ✅ Get organization
GET    /orgs/:id/members      ✅ List members
POST   /orgs/:id/invite       ✅ Invite member
```

### Projects Module (`/projects/*`)
```
GET    /projects              ✅ List projects (with pagination)
POST   /projects              ✅ Create project
GET    /projects/:id          ✅ Get project
PATCH  /projects/:id          ✅ Update project
DELETE /projects/:id          ✅ Delete project
POST   /projects/:id/duplicate ✅ Duplicate project
```

### Guests Module (`/projects/:id/guests/*`, `/guests/*`)
```
GET    /projects/:id/groups              ✅ List groups
POST   /projects/:id/groups              ✅ Create group
PUT    /groups/:id                       ✅ Update group
DELETE /groups/:id                       ✅ Delete group

GET    /projects/:id/guests              ✅ List guests
POST   /projects/:id/guests              ✅ Create guest
POST   /projects/:id/guests/import       ✅ Import guests
GET    /guests/:id                       ✅ Get guest
PATCH  /guests/:id                       ✅ Update guest
DELETE /guests/:id                       ✅ Delete guest

GET    /projects/:id/tags                ✅ List tags
POST   /projects/:id/tags                ✅ Create tag
DELETE /tags/:id                         ✅ Delete tag
POST   /guests/:id/tags                  ✅ Assign tag
DELETE /guests/:id/tags/:tagId           ✅ Remove tag

POST   /guests/:id/contacts              ✅ Add contact
PUT    /contacts/:id                     ✅ Update contact
DELETE /contacts/:id                     ✅ Remove contact
```

### Invites Module (`/projects/:id/invites/*`, `/invites/*`)
```
GET    /projects/:id/invites             ✅ List invites
POST   /projects/:id/invites             ✅ Create invite
GET    /invites/:id                      ✅ Get invite
POST   /invites/:id/revoke              ✅ Revoke invite
POST   /invites/:id/regenerate          ✅ Regenerate token
GET    /invites/:id/logs                ✅ Get access logs
POST   /invites/:token/validate         ✅ Public: Validate token
```

### RSVP Module (`/rsvp/*`, `/rsvp-forms/*`)
```
GET    /projects/:id/rsvp-forms          ✅ List forms
POST   /projects/:id/rsvp-forms          ✅ Create form
GET    /rsvp-forms/:id                   ✅ Get form
PUT    /rsvp-forms/:id                   ✅ Update form
DELETE /rsvp-forms/:id                   ✅ Delete form

POST   /rsvp-forms/:id/questions         ✅ Add question
DELETE /rsvp-questions/:id               ✅ Remove question

GET    /rsvp-forms/:id/submissions       ✅ List submissions
GET    /rsvp-submissions/:id             ✅ Get submission
POST   /rsvp/submit                      ✅ Public: Submit RSVP
```

### Sites Module (`/projects/:id/sites/*`, `/sites/*`)
```
GET    /projects/:id/sites               ✅ List sites
POST   /projects/:id/sites               ✅ Create site
GET    /projects/:id/sites/:id           ✅ Get site
PATCH  /projects/:id/sites/:id           ✅ Update site
DELETE /projects/:id/sites/:id           ✅ Delete site

POST   /sites/:id/publish                ✅ Publish version
POST   /sites/:id/unpublish              ✅ Unpublish site
GET    /sites/:id/versions               ✅ List versions
POST   /sites/:id/versions               ✅ Create version
GET    /sites/:id/versions/:versionId    ✅ Get version
PUT    /sites/:id/versions/:id/scene-graph ✅ Update scene
GET    /sites/:id/scene-graph            ✅ Get scene graph

POST   /sites/validate-subdomain         ✅ Check subdomain
POST   /sites/validate-custom-domain     ✅ Check domain
GET    /public/sites/:subdomain          ✅ Public: Get site
```

### Messaging Module (`/projects/:id/campaigns/*`, `/campaigns/*`)
```
GET    /projects/:id/campaigns           ✅ List campaigns
POST   /projects/:id/campaigns           ✅ Create campaign
GET    /projects/:id/campaigns/readiness ✅ Get readiness
GET    /campaigns/:id                    ✅ Get campaign
POST   /campaigns/:id/approve            ✅ Approve campaign
POST   /campaigns/:id/cancel             ✅ Cancel campaign
GET    /campaigns/:id/stats              ✅ Campaign stats

GET    /projects/:id/suppression-list    ✅ List suppressions
POST   /projects/:id/suppression-list    ✅ Add to list
DELETE /projects/:id/suppression-list/:id ✅ Remove from list

POST   /webhooks/ses                     ❌ NOT REGISTERED
```

### Photos Module (❌ NOT REGISTERED)
```
GET    /projects/:id/photo-settings        ❌ Inaccessible
PUT    /projects/:id/photo-settings        ❌ Inaccessible
GET    /photos/upload-url                  ❌ Inaccessible
POST   /photos/confirm-upload              ❌ Inaccessible
GET    /projects/:id/photos                ❌ Inaccessible
GET    /photos/:id                         ❌ Inaccessible
POST   /photos/:id/like                    ❌ Inaccessible
DELETE /photos/:id/like                    ❌ Inaccessible
GET    /projects/:id/photos/moderation-queue ❌ Inaccessible
POST   /photos/:id/moderate                ❌ Inaccessible
POST   /webhooks/s3/upload-complete        ❌ Inaccessible
```

### Seating Module (❌ NOT REGISTERED)
```
GET    /events/:id/floor-plans             ❌ Inaccessible
POST   /events/:id/floor-plans             ❌ Inaccessible
GET    /floor-plans/:id                    ❌ Inaccessible
PATCH  /floor-plans/:id                    ❌ Inaccessible
DELETE /floor-plans/:id                    ❌ Inaccessible

GET    /floor-plans/:id/tables             ❌ Inaccessible
POST   /floor-plans/:id/tables             ❌ Inaccessible
PATCH  /tables/:id                         ❌ Inaccessible
DELETE /tables/:id                         ❌ Inaccessible
PATCH  /tables/:id/position                ❌ Inaccessible

GET    /tables/:id/assignments             ❌ Inaccessible
POST   /seating/assignments                ❌ Inaccessible
DELETE /seating/assignments/:id            ❌ Inaccessible
POST   /seating/move-guest                 ❌ Inaccessible

POST   /events/:id/check-in                ❌ Inaccessible
GET    /events/:id/check-ins               ❌ Inaccessible
DELETE /check-ins/:id                      ❌ Inaccessible

POST   /events/:id/qr-code                 ❌ Inaccessible
POST   /events/:id/guest-qr-code           ❌ Inaccessible
POST   /check-in/qr                        ❌ Inaccessible

GET    /events/:id/seating-stats           ❌ Inaccessible
```

### Settings Module (Legacy Routes)
```
GET    /settings/definitions               ✅ Get definitions
POST   /settings/resolve                   ✅ Resolve setting
POST   /settings/values                    ✅ Set value
GET    /settings/values                    ✅ Get values
```

### Entitlements Module (Legacy Routes)
```
GET    /entitlements/resolve               ✅ Resolve entitlements
POST   /admin/plans                        ✅ Create plan
GET    /admin/plans                        ✅ List plans
```

---

## 7. Data Flow Diagrams

### 7.1 Authentication Flow

```
┌──────────┐           ┌──────────┐           ┌──────────┐           ┌──────────┐
│  Client  │           │   API    │           │   Auth   │           │   DB     │
└────┬─────┘           └────┬─────┘           └────┬─────┘           └────┬─────┘
     │                      │                      │                      │
     │ 1. POST /auth/login  │                      │                      │
     │─────────────────────►│                      │                      │
     │                      │ 2. Request magic link│                      │
     │                      │─────────────────────►│                      │
     │                      │                      │ 3. Store token       │
     │                      │                      │────────┐             │
     │                      │                      │        │             │
     │                      │                      │◄───────┘             │
     │                      │                      │                      │
     │                      │ 4. Send email        │                      │
     │                      │◄─────────────────────│                      │
     │ 5. Check email       │                      │                      │
     │◄─────────────────────│                      │                      │
     │                      │                      │                      │
     │ 6. POST /auth/verify │                      │                      │
     │─────────────────────►│                      │                      │
     │                      │ 7. Verify token      │                      │
     │                      │─────────────────────►│                      │
     │                      │                      │ 8. Validate          │
     │                      │                      │─────────────────────►│
     │                      │                      │◄─────────────────────│
     │                      │                      │                      │
     │                      │                      │ 9. Create session    │
     │                      │                      │─────────────────────►│
     │                      │                      │◄─────────────────────│
     │                      │◄─────────────────────│                      │
     │                      │                      │                      │
     │ 10. Return token     │                      │                      │
     │◄─────────────────────│                      │                      │
     │                      │                      │                      │
     │ 11. Store token      │                      │                      │
     │────┐                 │                      │                      │
     │    │                 │                      │                      │
     │◄───┘                 │                      │                      │
     │                      │                      │                      │
     │ 12. Subsequent requests with Bearer token  │                      │
     │═══════════════════════════════════════════════════════════════════════│
     │                      │                      │                      │
```

### 7.2 Campaign Creation Flow (Broken)

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────────┐     ┌──────────┐
│  Client  │     │   API    │     │ Messaging│     │  Database    │     │  Worker  │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └──────┬───────┘     └────┬─────┘
     │                │                │                  │                  │
     │ Create Campaign│                │                  │                  │
     │───────────────►│                │                  │                  │
     │                │ Create Campaign│                  │                  │
     │                │───────────────►│                  │                  │
     │                │                │ Create campaign  │                  │
     │                │                │─────────────────►│                  │
     │                │                │ Create jobs      │                  │
     │                │                │ (status: QUEUED) │                  │
     │                │                │─────────────────►│                  │
     │                │◄───────────────│                  │                  │
     │◄───────────────│                │                  │                  │
     │                │                │                  │                  │
     │                │                │                  │  ❌ NO WORKER   │
     │                │                │                  │  ❌ JOBS STUCK  │
     │                │                │                  │     IN QUEUED   │
     │                │                │                  │                  │
     ═════════════════════════════════════════════════════════════════════════════
     │                │                │                  │                  │
     │ Check Status   │                │                  │                  │
     │───────────────►│                │                  │                  │
     │                │ Get Campaign   │                  │                  │
     │                │───────────────►│                  │                  │
     │                │                │ Query            │                  │
     │                │                │─────────────────►│                  │
     │                │                │◄─────────────────│                  │
     │                │◄───────────────│                  │                  │
     │ Status: QUEUED │                │                  │                  │
     │◄───────────────│                │                  │                  │
     │                │                │                  │                  │
     ═════════════════════════════════════════════════════════════════════════════
     │                │                │                  │                  │
     │  Hours later...│                │                  │                  │
     │                │                │                  │                  │
     │ Check Status   │                │                  │                  │
     │───────────────►│                │                  │                  │
     │                │ ...            │                  │                  │
     │ Status: QUEUED │                │                  │                  │
     │◄───────────────│                │                  │                  │
     │                │                │                  │                  │
```

### 7.3 Realtime Collaboration Flow (Partial)

```
┌──────────┐                      ┌──────────────┐                      ┌──────────┐
│ Client 1 │                      │   Realtime   │                      │ Client 2 │
│ (Editor) │                      │  (WebSocket) │                      │ (Editor) │
└────┬─────┘                      └──────┬───────┘                      └────┬─────┘
     │                                   │                                   │
     │ 1. Open Editor                    │                                   │
     │────┐                              │                                   │
     │    │                              │                                   │
     │◄───┘                              │                                   │
     │                                   │                                   │
     │ 2. Connect WebSocket              │                                   │
     │ ws://realtime:4100/ws/:site/:ver  │                                   │
     │═══════════════════════════════════►│                                   │
     │                                   │                                   │
     │                                   │ 3. Load Yjs document              │
     │                                   │────┐                              │
     │                                   │    │                              │
     │                                   │◄───┘                              │
     │                                   │                                   │
     │ 4. Receive initial state          │                                   │
     │◄══════════════════════════════════│                                   │
     │                                   │                                   │
     │                                   │                                   │ 5. Connect
     │                                   │◄══════════════════════════════════│
     │                                   │                                   │
     │                                   │ 6. Sync existing state            │
     │                                   │══════════════════════════════════►│
     │                                   │                                   │
     │ 7. User makes edit                │                                   │
     │────┐                              │                                   │
     │    │                              │                                   │
     │◄───┘                              │                                   │
     │                                   │                                   │
     │ 8. Broadcast change               │                                   │
     │═══════════════════════════════════│══════════════════════════════════►│
     │                                   │                                   │
     │                                   │                                   │ 9. Apply change
     │                                   │                                   │────┐
     │                                   │                                   │    │
     │                                   │                                   │◄───┘
     │                                   │                                   │
     │                                   │ 10. Persist to DB                 │
     │                                   │────┐                              │
     │                                   │    │                              │
     │                                   │◄───┘                              │
     │                                   │                                   │
```

---

## 8. Environment Configuration Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ENVIRONMENT VARIABLES                                 │
└─────────────────────────────────────────────────────────────────────────────┘

API SERVICE (apps/api/.env)
───────────────────────────
Required:
  DATABASE_URL            ✅ Primary database connection
  JWT_SECRET             ⚠️ Should be required (uses default)
  COOKIE_SECRET          ⚠️ Should be required (uses default)

Optional:
  PORT                   ✅ Defaults to 4000
  NODE_ENV               ✅ development/production/test
  REDIS_URL              ✅ For rate limiting/sessions
  CORS_ORIGIN            ✅ Defaults per environment
  LOG_LEVEL              ✅ debug/info/warn/error
  RATE_LIMIT_MAX         ✅ Defaults to 100/min
  TRUST_PROXY            ✅ Defaults based on env

Missing from .env.example:
  AWS_ACCESS_KEY_ID      ❌ S3 integration
  AWS_SECRET_ACCESS_KEY  ❌ S3 integration
  S3_BUCKET              ❌ S3 integration
  SES_REGION             ❌ Email service
  SES_FROM_EMAIL         ❌ Email service
  WEBHOOK_SECRET         ❌ Webhook validation

WEB APP (apps/web/.env)
───────────────────────
Required:
  NEXT_PUBLIC_API_URL    ✅ Backend API URL

Optional:
  NEXT_PUBLIC_REALTIME_URL ⚠️ Should be set
  NEXT_PUBLIC_APP_NAME   ✅ Defaults to "EIOS"

REALTIME SERVICE (apps/realtime/.env)
─────────────────────────────────────
Required:
  DATABASE_URL           ✅ Same as API
  REDIS_URL              ✅ Same as API

Optional:
  PORT                   ✅ Defaults to 4100
  RATE_LIMIT_PER_ROOM    ✅ Defaults to 100

WORKER SERVICE (NOT IMPLEMENTED)
────────────────────────────────
  DATABASE_URL           ❌ Would be needed
  REDIS_URL              ❌ Would be needed
  SMTP_HOST              ❌ Would be needed
  SMTP_PORT              ❌ Would be needed
  SMTP_USER              ❌ Would be needed
  SMTP_PASS              ❌ Would be needed
```

---

## 9. Technology Stack Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TECHNOLOGY STACK                                     │
└─────────────────────────────────────────────────────────────────────────────┘

FRONTEND (apps/web)
───────────────────
Framework:        Next.js 14 (App Router)
Language:         TypeScript 5.x
Styling:          Tailwind CSS
UI Components:    shadcn/ui + Radix UI
State Management: React Query (TanStack Query)
Forms:            React Hook Form + Zod
Icons:            Lucide React
Charts:           Recharts
Animations:       Framer Motion
Testing:          Jest + React Testing Library
E2E Testing:      Playwright

BACKEND (apps/api)
──────────────────
Framework:        Fastify 4.x
Language:         TypeScript 5.x / JavaScript
Database:         PostgreSQL 15+
Connection Pool:  node-postgres (pg)
Cache/Session:    Redis (ioredis)
Validation:       Zod (partially)
Documentation:    @fastify/swagger
Authentication:   JWT (jsonwebtoken)
Rate Limiting:    @fastify/rate-limit (configured but not enforced)
Security:         @fastify/helmet, @fastify/cors

REALTIME (apps/realtime)
────────────────────────
Server:           Node.js HTTP + ws
Protocol:         WebSocket
CRDT:             Yjs
Pub/Sub:          Redis
Database:         PostgreSQL (for persistence)

DATABASE
────────
Primary:          PostgreSQL 15+
Extensions:       uuid-ossp
Migrations:       Manual SQL files

EXTERNAL SERVICES (Future)
──────────────────────────
Email:            AWS SES or SendGrid
Storage:          AWS S3 or MinIO
CDN:              CloudFront or Cloudflare
Monitoring:       DataDog or New Relic (not implemented)
Logging:          Datadog or ELK Stack (not implemented)
```

---

## 10. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      RAILWAY DEPLOYMENT (Current)                            │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │   Railway Network   │
                    │  (Private Network)  │
                    └──────────┬──────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
           ▼                   ▼                   ▼
    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
    │   API       │    │   Web       │    │  Realtime   │
    │  Service    │    │   App       │    │   Service   │
    │  (Fastify)  │    │  (Next.js)  │    │(WebSocket)  │
    │             │    │             │    │             │
    │ Domain:     │    │ Domain:     │    │ Domain:     │
    │ api.*       │    │ app.*       │    │ rt.*        │
    │             │    │             │    │             │
    │ Health: /   │    │ Health: /   │    │ Health: /   │
    │ health      │    │ api/health  │    │ health      │
    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
           │                   │                   │
           └───────────────────┼───────────────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
           ▼                   ▼                   ▼
    ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐
    │ PostgreSQL  │    │    Redis    │    │   (Worker -     │
    │  (Primary)  │    │  (Valkey)   │    │   NOT DEPLOYED) │
    │             │    │             │    │                 │
    │ Connection  │    │ Connection  │    │                 │
    │ via $DB_URL │    │ via $REDIS  │    │                 │
    └─────────────┘    └─────────────┘    └─────────────────┘

CURRENT STATUS:
✅ API Service: Deployed and running
✅ Web App: Deployed and running
✅ PostgreSQL: Provisioned and connected
✅ Redis: Provisioned and connected
⚠️ Realtime: Deployed but WebSocket not fully integrated
❌ Worker: Not deployed (missing implementation)

MISSING:
- Auto-scaling configuration
- Health check alerts
- Log aggregation
- CDN for static assets
- Backup automation
```

---

## 11. Integration Points

| System | Integration Type | Status | Notes |
|--------|-----------------|--------|-------|
| AWS SES | Email delivery | ❌ Not configured | Mock only |
| AWS S3 | File storage | ❌ Not configured | Photo uploads fail |
| SendGrid | Email alternative | ❌ Not configured | - |
| MinIO | S3-compatible | ❌ Not configured | Could be self-hosted |
| Stripe | Payments | ❌ Not implemented | For billing |
| Twilio | SMS | ❌ Not implemented | For WhatsApp channel |
| Google OAuth | Auth provider | ❌ Not implemented | Alternative to magic link |
| Sentry | Error tracking | ❌ Not implemented | - |
| Datadog | Monitoring | ❌ Not implemented | - |

---

*End of Architecture Map*
