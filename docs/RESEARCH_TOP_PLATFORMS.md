# UX Research: Top Event Planning & SaaS Platforms

## Platforms Analyzed

### 1. The Knot (Wedding Focus)
**URL:** theknot.com
**Key UX Patterns:**
- Progressive onboarding (budget → date → venue → guests)
- Visual checklist with progress rings
- Budget tracker with visual charts
- Vendor marketplace integration
- Guest list with RSVP status colors
- Seating chart drag-and-drop
- Mobile app sync

**Best Features:**
- "Checklist Progress" circular indicator
- Vendor shortlist with reviews
- Gift registry aggregator
- Wedding website builder

---

### 2. Zola (Wedding Focus)
**URL:** zola.com
**Key UX Patterns:**
- Clean, minimalist design
- Unified registry (any store)
- Guest communication center
- RSVP with meal preferences
- Cash fund options
- Mobile-first experience

**Best Features:**
- Smart guest import (from Gmail, etc.)
- Registry item grouping
- Thank you note tracker
- Post-wedding photo sharing

---

### 3. HoneyBook (Business Focus)
**URL:** honeybook.com
**Key UX Patterns:**
- Pipeline view (inquiry → booked → completed)
- Automated workflows
- Contract e-signatures
- Invoice payment processing
- Client portal
- Calendar integration

**Best Features:**
- Visual pipeline (Kanban-style)
- Automated email sequences
- Payment plans for clients
- Time tracking per project

---

### 4. Eventbrite (Events Focus)
**URL:** eventbrite.com
**Key UX Patterns:**
- Event creation wizard
- Ticketing tiers
- Promotional tools
- Attendee management
- Analytics dashboard
- Mobile check-in app

**Best Features:**
- Multi-tier ticket pricing
- Promo codes system
- Event discovery for attendees
- Check-in QR codes

---

### 5. Notion (SaaS UX Reference)
**URL:** notion.so
**Key UX Patterns:**
- Clean sidebar navigation
- Breadcrumb navigation
- Command palette (Cmd+K)
- Template gallery
- Real-time collaboration cursors
- Slash commands

**Best Features:**
- Keyboard shortcuts everywhere
- Contextual help tooltips
- Empty state illustrations
- Onboarding checklist

---

### 6. Linear (SaaS UX Reference)
**URL:** linear.app
**Key UX Patterns:**
- Keyboard-first design
- Command palette
- Minimal UI
- Fast transitions
- Offline support
- Git integration

**Best Features:**
- Zero-clutter interface
- Instant search
- Cycle/roadmap planning
- Issue templates

---

## UX Patterns Summary

### Common Patterns Across All Platforms

| Pattern | Implementation | Priority |
|---------|---------------|----------|
| **Progressive Onboarding** | Step-by-step wizard | High |
| **Visual Progress Indicators** | Circular progress, progress bars | High |
| **Kanban Board** | Pipeline view for events | Medium |
| **Command Palette** | Cmd+K search | Medium |
| **Empty States** | Illustrations + CTAs | High |
| **Real-time Updates** | WebSocket for notifications | Medium |
| **Mobile App** | Native or PWA | Low |
| **Template Gallery** | Pre-made designs | Medium |
| **Import Tools** | CSV, Gmail, etc. | High |
| **Analytics Dashboard** | Charts, metrics | Medium |

---

## Recommended Features for EIOS

### Phase 1: Core UX (Must Have)
1. ✅ Real data (COMPLETED)
2. ✅ Loading states (COMPLETED)
3. ✅ Error handling (COMPLETED)
4. **Command Palette (Cmd+K)** - Quick navigation
5. **Keyboard Shortcuts** - Power user features
6. **Breadcrumb Navigation** - Wayfinding
7. **Contextual Help** - Tooltips, tours

### Phase 2: Power Features (Should Have)
8. **Kanban Board** - Event pipeline view
9. **Calendar Integration** - Google/Outlook sync
10. **CSV Import** - Bulk guest upload
11. **Email Templates** - Pre-written messages
12. **Analytics Charts** - Visual data

### Phase 3: Advanced (Nice to Have)
13. **Seating Chart** - Visual table planner
14. **Budget Tracker** - Cost management
15. **Vendor Directory** - Marketplace
16. **Mobile PWA** - Offline support
17. **AI Assistant** - Smart suggestions

---

## Design System Recommendations

### Color Palette (From Research)
```
Primary: Warm neutrals (stone, sand)
Success: Emerald green (RSVP yes)
Warning: Amber (pending)
Error: Rose red (RSVP no)
Info: Blue (actions)
```

### Typography
- Headings: Serif (elegant, wedding feel)
- Body: Sans-serif (clean, readable)
- Monospace: For data (budgets, dates)

### Spacing
- 4px grid system
- Consistent 24px card padding
- 16px form field gaps

---

## Accessibility Standards

From analyzing top platforms:
- WCAG 2.1 AA minimum
- Keyboard navigation required
- Screen reader optimized
- Color contrast 4.5:1 minimum
- Focus indicators visible
- Reduced motion support
