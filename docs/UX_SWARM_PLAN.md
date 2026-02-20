# UX Improvement Swarm Execution Plan
## Enterprise-Grade Implementation

---

## Mission
Transform placeholder dashboards into production-ready, enterprise-grade experiences with real data, proper loading states, and disabled non-functional elements.

---

## Workstreams (Parallel Execution)

### Workstream A: Dashboard Real Data Integration
**Owner:** Dashboard Integration Agent
**Files:**
- `apps/web/app/dashboard/couple/page.tsx`
- `apps/web/app/dashboard/business/page.tsx`
**Dependencies:** Backend APIs (already complete)

**Requirements:**
- Replace ALL hardcoded mock data with API calls
- Implement proper error handling with retry
- Add empty states for new users
- Handle loading → error → success states
- Responsive grid layouts
- Accessible (ARIA labels, keyboard nav)

**Success Criteria:**
- [ ] Dashboard shows real user data (names, dates, stats)
- [ ] Checklist items persist (toggle, add, delete)
- [ ] RSVP reminders actually send
- [ ] Graceful error handling with retry
- [ ] Empty state when no data exists

---

### Workstream B: Loading States & Skeletons
**Owner:** Loading Experience Agent
**Files:**
- `apps/web/components/ui/dashboard-skeleton.tsx` (new)
- `apps/web/app/dashboard/couple/page.tsx` (add skeleton)
- `apps/web/app/dashboard/business/page.tsx` (add skeleton)
- `apps/web/app/onboarding/page.tsx` (add loading)

**Requirements:**
- Shimmer/skeleton loading (not spinner)
- Staggered animation for list items
- Match layout exactly (prevents layout shift)
- `prefers-reduced-motion` support
- Progressive disclosure (load sections independently)

**Skeleton Components Needed:**
1. `DashboardSkeleton` - Full page shimmer
2. `StatsCardSkeleton` - 4 cards with icons
3. `EventCardSkeleton` - Large featured card
4. `ChecklistSkeleton` - List with checkboxes
5. `TableSkeleton` - For business dashboard

**Success Criteria:**
- [ ] No layout shift between loading and loaded
- [ ] Smooth shimmer animation
- [ ] Respects reduced motion preference
- [ ] Shows content progressively

---

### Workstream C: Non-Functional Element Handling
**Owner:** UX Polish Agent
**Files:**
- `apps/web/app/auth/login/page.tsx`
- `apps/web/app/auth/register/page.tsx`
- `apps/web/app/dashboard/couple/page.tsx`
- `apps/web/app/dashboard/business/page.tsx`

**Requirements:**
- Disable social login buttons (with tooltip)
- Hide or disable non-functional dashboard buttons
- Add "Coming soon" badges where appropriate
- Ensure disabled state is visually clear
- Keyboard accessible (tab order, focus states)
- Screen reader friendly (aria-disabled, descriptions)

**Elements to Fix:**
| Location | Element | Action |
|----------|---------|--------|
| Login | Google/MS/Apple buttons | Disable + tooltip |
| Login | "Need help?" link | Disable or remove |
| Login | Terms/Privacy links | Disable or link to placeholder |
| Couple | "Send Reminders" | Keep, but handle error gracefully |
| Couple | "Add Custom Task" | Enable (connect to API) |
| Couple | Quick Action links | Disable with badges |
| Business | "New Event" | Keep, show modal (even if mock) |
| Business | "Invite Member" | Disable with tooltip |
| Business | "Create Invoice" | Disable with tooltip |

**Success Criteria:**
- [ ] No buttons that do nothing when clicked
- [ ] Clear visual indication of disabled state
- [ ] Tooltips explain why disabled
- [ ] Tab navigation skips disabled elements appropriately

---

## Implementation Standards

### Enterprise-Grade Requirements

1. **Accessibility (a11y)**
   - WCAG 2.1 AA compliance
   - Keyboard navigation
   - Screen reader support
   - Focus management
   - Color contrast ratios

2. **Performance**
   - First Contentful Paint < 1.5s
   - No layout shift (CLS < 0.1)
   - Lazy load non-critical components
   - Image optimization

3. **Error Handling**
   - Graceful degradation
   - Retry mechanisms with exponential backoff
   - User-friendly error messages
   - Error boundaries

4. **Mobile-First**
   - Touch targets >= 44px
   - Responsive breakpoints
   - Swipe gestures where appropriate
   - Mobile-optimized navigation

5. **Analytics**
   - Track dashboard load times
   - Track feature usage
   - Error tracking (Sentry)
   - User journey funnel

---

## File Structure Changes

```
apps/web/
├── components/
│   └── ui/
│       ├── skeletons/
│       │   ├── dashboard-skeleton.tsx
│       │   ├── stats-skeleton.tsx
│       │   ├── event-card-skeleton.tsx
│       │   └── checklist-skeleton.tsx
│       ├── empty-states/
│       │   ├── no-guests.tsx
│       │   ├── no-events.tsx
│       │   └── welcome-new-user.tsx
│       └── disabled-button.tsx
├── app/
│   ├── dashboard/
│   │   ├── couple/
│   │   │   └── page.tsx (updated)
│   │   ├── business/
│   │   │   └── page.tsx (updated)
│   │   └── components/
│   │       ├── error-boundary.tsx
│   │       └── retry-button.tsx
│   └── auth/
│       └── components/
│           └── social-login-buttons.tsx (disabled)
└── hooks/
    └── useDashboard.ts (enhanced with error handling)
```

---

## Design Tokens

### Skeleton Colors
```css
--skeleton-base: #f5f5f5;
--skeleton-highlight: #ebebeb;
--skeleton-animation: shimmer 1.5s infinite;
```

### Disabled States
```css
--disabled-opacity: 0.5;
--disabled-cursor: not-allowed;
--disabled-tooltip-bg: rgba(0,0,0,0.8);
```

### Animation Timing
```css
--transition-fast: 150ms;
--transition-normal: 300ms;
--transition-slow: 500ms;
--stagger-delay: 50ms;
```

---

## Parallel Execution Schedule

```
Hour 0: Kickoff
├── Agent A: Setup hooks, types, basic data fetching
├── Agent B: Create skeleton components
└── Agent C: Identify and mark all disabled elements

Hour 2: Midpoint Check
├── Agent A: Couple dashboard data integration complete
├── Agent B: All skeleton components ready
└── Agent C: All disabled states implemented

Hour 4: Integration
├── Agent A: Business dashboard + error handling
├── Agent B: Integrate skeletons into pages
└── Agent C: Tooltips and accessibility

Hour 6: Testing & Polish
├── All agents: Cross-browser testing
├── All agents: Mobile testing
└── All agents: Accessibility audit

Hour 8: Final Review & Deploy
```

---

## Code Review Checklist

Before marking complete, each agent must verify:

- [ ] No `any` types
- [ ] No `console.log` in production code
- [ ] All components have proper PropTypes/interfaces
- [ ] Error boundaries in place
- [ ] Loading states tested (slow 3G simulation)
- [ ] Accessibility audit passed (axe-core)
- [ ] Mobile responsive (iPhone SE to iPad Pro)
- [ ] Dark mode support (if applicable)
- [ ] Reduced motion support
- [ ] Unit tests for critical paths

---

## Communication Protocol

1. **Hourly Updates** - Comment progress on this doc
2. **Blockers** - Tag immediately in shared channel
3. **Dependencies** - If Agent A needs Agent B's work, use placeholder then refactor
4. **Code Style** - Follow existing patterns, use Prettier

---

## Definition of Done

- Dashboards display real user data
- Loading skeletons prevent layout shift
- No broken/clickable-but-broken buttons remain
- All accessibility checks pass
- Mobile experience is polished
- Deployed to production
- Analytics show improved metrics (lower bounce, higher engagement)
