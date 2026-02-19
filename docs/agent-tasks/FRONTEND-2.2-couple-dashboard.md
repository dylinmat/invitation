# Frontend Agent B: Couple Dashboard Data Integration
**Task ID:** FRONTEND-2.2  
**Priority:** Critical  
**Estimated Time:** 5-6 hours

## Objective
Replace all hardcoded mock data in couple dashboard with real API calls and make all buttons functional.

## Target File
`apps/web/app/dashboard/couple/page.tsx`

## Current Issues

### Issue 1: All Data is Hardcoded (Lines 29-62)
**Current:**
```typescript
const upcomingEvents = [
  { id: 1, name: "Our Wedding", date: "June 15, 2025", daysLeft: 120, ... }
];
const quickStats = [...]; // Static
const checklistItems = [...]; // Static
const recentActivity = [...]; // Static
```

### Issue 2: Non-Functional Buttons
- "Send Reminders" button - no onClick
- "Manage Guests" button - no navigation
- "Add Custom Task" button - no handler
- Quick Action links all have `href="#"`

## Implementation Steps

### Step 1: Create API Types and Methods

Add to `apps/web/lib/api.ts`:

```typescript
export interface CoupleDashboardData {
  event: {
    id: string;
    name: string;
    date: string;
    daysLeft: number;
    venue: string;
    guestCount: number;
  };
  stats: {
    guests: number;
    rsvpRate: number;
    daysLeft: number;
    gifts: number;
  };
  checklist: Array<{
    id: number;
    text: string;
    completed: boolean;
  }>;
  recentActivity: Array<{
    type: 'rsvp' | 'gift' | 'photo';
    message: string;
    time: string;
  }>;
}

export const dashboardApi = {
  getCoupleDashboard: () => api.get<CoupleDashboardData>("/dashboard/couple"),
  sendReminders: (eventId: string, data: { type: string; message?: string }) =>
    api.post(`/events/${eventId}/reminders`, data),
};

export const checklistApi = {
  getItems: () => api.get("/checklist"),
  createItem: (data: { text: string; category?: string }) =>
    api.post("/checklist", data),
  updateItem: (id: number, data: { completed: boolean }) =>
    api.put(`/checklist/${id}`, data),
  deleteItem: (id: number) => api.delete(`/checklist/${id}`),
};
```

### Step 2: Add React Query Hooks

Create `apps/web/hooks/useCoupleDashboard.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi, checklistApi } from "@/lib/api";
import { showToast } from "@/components/ui/toaster";

export function useCoupleDashboard() {
  return useQuery({
    queryKey: ["couple-dashboard"],
    queryFn: () => dashboardApi.getCoupleDashboard().then(r => r.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useChecklist() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["checklist"],
    queryFn: () => checklistApi.getItems().then(r => r.data?.items || []),
  });

  const toggleItem = useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      checklistApi.updateItem(id, { completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist"] });
      queryClient.invalidateQueries({ queryKey: ["couple-dashboard"] });
    },
  });

  const addItem = useMutation({
    mutationFn: (text: string) => checklistApi.createItem({ text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist"] });
      showToast({ title: "Task added", variant: "success" });
    },
  });

  return { items: data || [], isLoading, toggleItem, addItem };
}

export function useSendReminders() {
  return useMutation({
    mutationFn: ({ eventId, message }: { eventId: string; message?: string }) =>
      dashboardApi.sendReminders(eventId, { type: "rsvp", message }),
    onSuccess: () => {
      showToast({
        title: "Reminders sent!",
        description: "Your guests will receive an email.",
        variant: "success",
      });
    },
    onError: () => {
      showToast({
        title: "Failed to send reminders",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });
}
```

### Step 3: Replace Mock Data with API

Replace the hardcoded data with hook usage:

```typescript
export default function CoupleDashboard() {
  const { data: dashboardData, isLoading } = useCoupleDashboard();
  const { items: checklistItems, toggleItem } = useChecklist();
  const sendReminders = useSendReminders();

  // Get real data or fallback to empty state
  const event = dashboardData?.event;
  const stats = dashboardData?.stats;
  const recentActivity = dashboardData?.recentActivity || [];

  if (isLoading) {
    return <DashboardSkeleton />; // Create skeleton component
  }

  if (!event) {
    return <EmptyState />; // Show "Create your first event" CTA
  }

  return (
    // ... JSX using real data
  );
}
```

### Step 4: Create Skeleton Loading State

Add loading skeleton for better UX:

```typescript
function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Welcome banner skeleton */}
      <div className="h-32 bg-gray-200 animate-pulse rounded-2xl" />
      
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-lg" />
        ))}
      </div>
      
      {/* Content skeleton */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-64 bg-gray-200 animate-pulse rounded-lg" />
          <div className="h-96 bg-gray-200 animate-pulse rounded-lg" />
        </div>
        <div className="space-y-6">
          <div className="h-48 bg-gray-200 animate-pulse rounded-lg" />
          <div className="h-32 bg-gray-200 animate-pulse rounded-lg" />
        </div>
      </div>
    </div>
  );
}
```

### Step 5: Fix All Button Handlers

**Send Reminders Button:**
```typescript
<Button 
  onClick={() => sendReminders.mutate({ eventId: event.id })}
  disabled={sendReminders.isPending}
>
  {sendReminders.isPending ? (
    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
  ) : (
    <Mail className="w-4 h-4 mr-2" />
  )}
  Send Reminders
</Button>
```

**Manage Guests Link:**
```typescript
<Link href={`/events/${event.id}/guests`}>
  <Button variant="outline">
    <Users className="w-4 h-4 mr-2" />
    Manage Guests
  </Button>
</Link>
```

**Add Custom Task:**
```typescript
const [newTask, setNewTask] = useState("");
const [showAddTask, setShowAddTask] = useState(false);

// In render:
{showAddTask ? (
  <div className="flex gap-2">
    <Input 
      value={newTask}
      onChange={(e) => setNewTask(e.target.value)}
      placeholder="New task..."
    />
    <Button 
      size="sm"
      onClick={() => {
        addItem.mutate(newTask);
        setNewTask("");
        setShowAddTask(false);
      }}
    >
      Add
    </Button>
  </div>
) : (
  <Button variant="ghost" onClick={() => setShowAddTask(true)}>
    <Plus className="w-4 h-4 mr-2" />
    Add Custom Task
  </Button>
)}
```

**Quick Action Links:**
```typescript
// Replace all href="#" with real routes:
const quickActions = [
  { icon: Users, label: "Import Guests", href: "/guests/import" },
  { icon: Mail, label: "Design Invitation", href: "/invitations/design" },
  { icon: Gift, label: "Gift Registry", href: "/registry" },
  { icon: Camera, label: "Photo Gallery", href: "/gallery" },
];
```

### Step 6: Add Error State

```typescript
if (error) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Failed to load dashboard</h2>
        <p className="text-muted-foreground mb-4">Please try again</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    </div>
  );
}
```

## Testing Checklist

- [ ] Dashboard shows loading skeleton initially
- [ ] Real data appears after loading
- [ ] Checklist items can be toggled
- [ ] New checklist items can be added
- [ ] "Send Reminders" calls API and shows toast
- [ ] "Manage Guests" navigates to correct page
- [ ] Quick action links go to real pages
- [ ] Error state shows when API fails
- [ ] Retry button works on error

## Dependencies

- Backend Agent B must complete `BACKEND-1.2` first
- React Query is already set up in the project
- Need to verify API endpoint URLs match backend
