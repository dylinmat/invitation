# Enterprise Features

This document describes the enterprise-grade features added to EIOS.

## Features Overview

### 1. Command Palette (⌘K)

A powerful command palette for quick navigation and actions.

**File:** `components/command-palette.tsx`

**Features:**
- Trigger with `Cmd/Ctrl + K`
- Grouped results: Navigation, Actions, Recent, Help
- Fuzzy search matching with highlighted results
- Keyboard navigation (↑↓ to navigate, ↵ to select, Esc to close)
- Recently visited projects (last 5)
- Keyboard shortcuts display

**Usage:**
```tsx
import { CommandPalette } from "@/components/command-palette";

// Add to layout for global availability
<CommandPalette />
```

### 2. Notification System

Smart toast notifications with actions and progress indicators.

**Files:**
- `components/notifications/notification-provider.tsx`
- `components/notifications/notification-toast.tsx`
- `components/notifications/notification-container.tsx`
- `components/notifications/useNotifications.ts`

**Features:**
- 4 types: success, error, warning, info
- Auto-dismiss after 5 seconds (configurable)
- Pause on hover
- Swipe to dismiss on mobile
- Max 5 visible at once
- Custom actions support
- Progress bar indicator

**Usage:**
```tsx
import { NotificationProvider, useNotify } from "@/components/notifications";

// Wrap app with provider
<NotificationProvider>
  <App />
</NotificationProvider>

// Use in components
const notify = useNotify();
notify.success("Saved!", "Your changes have been saved.");
notify.error("Error", "Something went wrong");

// With actions
const { notify: showToast } = useNotifications();
showToast({
  type: "info",
  title: "New Feature",
  message: "Check it out!",
  actions: [
    { label: "Try it", onClick: () => {} },
    { label: "Later", onClick: () => {} }
  ]
});
```

### 3. Activity Feed

Timeline view of recent activities with filtering and infinite scroll.

**File:** `components/activity-feed.tsx`

**Features:**
- Activity types: project_created, guest_added, invite_sent, rsvp_received, site_published
- Group by date (Today, Yesterday, specific dates)
- Filter by type
- Infinite scroll
- Relative timestamps
- Actor avatars and metadata

**Usage:**
```tsx
import { ActivityFeed } from "@/components/activity-feed";

<ActivityFeed />
<ActivityFeed showFilters={true} maxItems={10} />
```

### 4. Global Search

Search across projects, guests, invites, and settings.

**File:** `components/global-search.tsx`

**Features:**
- Search across multiple entity types
- Type filtering (P, G, I, S shortcuts)
- Highlighted matches
- Fuzzy search
- Quick type jump shortcuts

**Usage:**
```tsx
import { GlobalSearch } from "@/components/global-search";

<GlobalSearch />
<GlobalSearch onSelect={(result) => console.log(result)} />
```

### 5. User Menu

Enhanced user menu with organization switcher and theme toggle.

**File:** `components/user-menu.tsx`

**Features:**
- User profile section (avatar, name, email, plan)
- Organization switcher with roles
- Theme toggle (light/dark)
- Keyboard shortcuts reference modal
- Sign out

**Usage:**
```tsx
import { UserMenu } from "@/components/user-menu";

<UserMenu />
```

### 6. Onboarding Checklist

Guided setup for new users.

**File:** `components/onboarding-checklist.tsx`

**Features:**
- 5-step checklist
- Progress indicator
- Persistent state (localStorage)
- Skip and dismiss options
- Collapsible floating button
- Completion celebration

**Usage:**
```tsx
import { OnboardingChecklist, useOnboarding } from "@/components/onboarding-checklist";

// Component
<OnboardingChecklist />

// Hook
const { completeItem, progress, isComplete } = useOnboarding();
completeItem("create-project");
```

### 7. Keyboard Shortcuts Hook

Centralized keyboard shortcut management.

**File:** `hooks/useKeyboardShortcuts.ts`

**Features:**
- Multiple shortcut support
- Modifier key support (Cmd, Ctrl, Shift, Alt)
- Individual shortcut hook
- Configurable preventDefault

**Usage:**
```tsx
import { useKeyboardShortcuts, useKeyboardShortcut } from "@/hooks/useKeyboardShortcuts";

// Multiple shortcuts
useKeyboardShortcuts([
  { key: "k", meta: true, handler: () => openPalette() },
  { key: "s", ctrl: true, handler: () => save() },
]);

// Single shortcut
useKeyboardShortcut("k", () => openPalette(), { meta: true });
```

## Design System

### Colors
- Primary accent: Rose (`rose-500` to `rose-600`)
- Success: Green (`green-500` to `green-600`)
- Error: Red (`red-500` to `red-600`)
- Warning: Amber (`amber-500` to `amber-600`)
- Info: Blue (`blue-500` to `blue-600`)

### Typography
- Sans-serif: Inter (UI elements)
- Serif: Playfair Display (headings)

### Animations
- Duration: 200-300ms
- Easing: `[0.16, 1, 0.3, 1]` (ease-out-expo)
- Framer Motion for smooth transitions

### Accessibility
- Keyboard navigation support
- ARIA labels on interactive elements
- Focus rings on all interactive elements
- Reduced motion support (via system preferences)
- Color contrast compliance

## Integration

All features are integrated in `app/layout.tsx`:

```tsx
<Providers>
  {children}
  <CommandPalette />
  <OnboardingChecklist />
</Providers>
```

And in `components/dashboard/header.tsx`:

```tsx
<DashboardHeader>
  <GlobalSearch />
  <UserMenu />
</DashboardHeader>
```

## Demo Page

Visit `/dashboard/enterprise-demo` to see all features in action.
