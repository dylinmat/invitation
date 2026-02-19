# Agent Swarm Task Directory

## Quick Start

1. **Read `MASTER-EXECUTION.md`** first - contains coordination plan
2. **Find your assigned task** below
3. **Read your task file** completely before starting
4. **Update status** in master document as you progress

---

## Task Files

### Phase 1: Backend Foundation
| Task ID | File | Agent | Status |
|---------|------|-------|--------|
| BACKEND-1.1 | `BACKEND-1.1-user-org-apis.md` | Backend Agent A | 🔴 Not Started |
| BACKEND-1.2 | `BACKEND-1.2-dashboard-apis.md` | Backend Agent B | 🔴 Not Started |
| BACKEND-1.3 | `BACKEND-1.3-email-apis.md` | Backend Agent C | 🔴 Not Started |

### Phase 2: Frontend Integration
| Task ID | File | Agent | Status | Depends On |
|---------|------|-------|--------|------------|
| FRONTEND-2.1 | `FRONTEND-2.1-onboarding-integration.md` | Frontend Agent A | 🔴 Not Started | BACKEND-1.1 |
| FRONTEND-2.2 | `FRONTEND-2.2-couple-dashboard.md` | Frontend Agent B | 🔴 Not Started | BACKEND-1.2 |
| FRONTEND-2.3 | `FRONTEND-2.3-business-dashboard.md` | Frontend Agent C | 🔴 Not Started | BACKEND-1.2 |

### Phase 3: Social Authentication
| Task ID | File | Agent | Status |
|---------|------|-------|--------|
| FULLSTACK-3.1 | `FULLSTACK-3.1-google-oauth.md` | Full-Stack Agent A | 🔴 Not Started |
| FULLSTACK-3.2 | `FULLSTACK-3.2-microsoft-oauth.md` | Full-Stack Agent B | 🔴 Not Started |
| FULLSTACK-3.3 | `FULLSTACK-3.3-apple-oauth.md` | Full-Stack Agent C | 🔴 Not Started |

### Phase 4: Utilities & Content
| Task ID | File | Agent | Status | Depends On |
|---------|------|-------|--------|------------|
| FRONTEND-4.1 | `FRONTEND-4.1-email-resend.md` | Frontend Agent D | 🔴 Not Started | BACKEND-1.3 |
| FRONTEND-4.2 | `FRONTEND-4.2-legal-pages.md` | Content Agent | 🔴 Not Started | None |

### Phase 5: QA & Testing
| Task ID | File | Agent | Status | Depends On |
|---------|------|-------|--------|------------|
| QA-5.1 | `QA-5.1-integration-testing.md` | QA Agent A | 🔴 Not Started | All Above |
| QA-5.2 | `QA-5.2-error-handling.md` | QA Agent B | 🔴 Not Started | All Above |
| QA-5.3 | `QA-5.3-performance.md` | Performance Agent | 🔴 Not Started | All Above |

---

## Placeholder Summary

| Category | Count | Priority |
|----------|-------|----------|
| Mock API calls (setTimeout) | 6 | 🔴 Critical |
| Hardcoded mock data | 2 | 🔴 Critical |
| Non-functional buttons | 9 | 🟡 Medium |
| Social auth stubs | 6 | 🟡 Medium |
| Placeholder links | 4 | 🟢 Low |
| **TOTAL** | **27** | - |

---

## Execution Order

```
Day 1:
├── Backend Agent A starts (User/Org APIs)
├── Backend Agent B starts (Dashboard APIs)
├── Backend Agent C starts (Email APIs)
└── Content Agent starts (Legal Pages)

Day 2:
├── Backend APIs should be complete
├── Frontend Agent A starts (Onboarding)
├── Frontend Agent B starts (Couple Dashboard)
└── Frontend Agent C starts (Business Dashboard)

Day 3-4:
├── Frontend integration continues
├── Full-Stack Agents start (Social Auth)
└── Frontend Agent D starts (Email Resend)

Day 5:
├── QA Agents test everything
├── Bug fixes
└── Deploy
```

---

## Coordination

- **Daily Standups:** Check MASTER-EXECUTION.md for agenda
- **Status Updates:** Comment on your task file with progress
- **Blockers:** Tag blocking agent immediately
- **Handoffs:** Update "Handoff Notes" section in task file

---

## Definition of Done

Each agent must verify:
- [ ] All assigned TODOs removed
- [ ] All mocks replaced with real APIs
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Tested locally
- [ ] PR created
- [ ] Handoff notes written
